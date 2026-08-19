from __future__ import annotations

from collections import defaultdict
from datetime import datetime, time, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import Select, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from nirantar.config import get_settings
from nirantar.models.workouts import (
    ExerciseGroup,
    ExerciseGroupMember,
    ExerciseSet,
    ExerciseSetType,
    WorkoutExercise,
    WorkoutSession,
)
from nirantar.schemas.workouts import (
    AddDropsetOperation,
    AddExerciseOperation,
    AddSetOperation,
    AddSupersetOperation,
    DropsetRead,
    ExerciseGroupRead,
    ExerciseHistoryEntry,
    ExerciseHistoryQuery,
    ExerciseHistorySetRead,
    ExerciseRead,
    GroupMemberRead,
    RecentWorkoutsQuery,
    RemoveExerciseOperation,
    RemoveSetOperation,
    RemoveSupersetOperation,
    SetCreate,
    SetRead,
    SetType,
    UpdateExerciseOperation,
    UpdateSetOperation,
    UpdateSupersetOperation,
    UpdateWorkoutOperation,
    WorkoutCreate,
    WorkoutDeleteRequest,
    WorkoutDeleteResult,
    WorkoutEditRequest,
    WorkoutHistoryQuery,
    WorkoutHistoryRead,
    WorkoutRead,
)
from nirantar.services.errors import (
    ConflictDomainError,
    NotFoundError,
    ValidationDomainError,
)


def _set_type(value: SetType | ExerciseSetType | str) -> SetType:
    if isinstance(value, SetType):
        return value
    if isinstance(value, ExerciseSetType):
        return SetType(value.value)
    return SetType(value)


def _count_sets(sets: list[ExerciseSet]) -> tuple[int, int, int]:
    working = sum(1 for item in sets if item.set_type == ExerciseSetType.WORKING)
    dropsets = sum(1 for item in sets if item.set_type == ExerciseSetType.DROPSET)
    return working, dropsets, len(sets)


def _assemble_sets(sets: list[ExerciseSet]) -> list[SetRead]:
    top_level = sorted(
        (item for item in sets if item.parent_set_id is None),
        key=lambda item: item.set_order,
    )
    children_by_parent: dict[UUID, list[ExerciseSet]] = defaultdict(list)
    for item in sets:
        if item.parent_set_id is not None:
            children_by_parent[item.parent_set_id].append(item)

    assembled: list[SetRead] = []
    for parent in top_level:
        dropsets = [
            DropsetRead(
                id=child.id,
                set_order=child.set_order,
                set_type=_set_type(child.set_type),
                weight_kg=child.weight_kg,
                reps=child.reps,
                notes=child.notes,
                parent_set_id=child.parent_set_id,
            )
            for child in sorted(
                children_by_parent.get(parent.id, []),
                key=lambda item: item.set_order,
            )
        ]
        assembled.append(
            SetRead(
                id=parent.id,
                set_order=parent.set_order,
                set_type=_set_type(parent.set_type),
                weight_kg=parent.weight_kg,
                reps=parent.reps,
                notes=parent.notes,
                parent_set_id=None,
                dropsets=dropsets,
            )
        )
    return assembled


def _to_workout_read(session: WorkoutSession) -> WorkoutRead:
    all_sets = [item for exercise in session.exercises for item in exercise.sets]
    working, dropsets, physical = _count_sets(all_sets)

    exercises = [
        ExerciseRead(
            id=exercise.id,
            exercise_name=exercise.exercise_name,
            exercise_order=exercise.exercise_order,
            notes=exercise.notes,
            sets=_assemble_sets(exercise.sets),
        )
        for exercise in sorted(session.exercises, key=lambda item: item.exercise_order)
    ]

    groups = [
        ExerciseGroupRead(
            id=group.id,
            group_type=group.group_type,
            group_order=group.group_order,
            notes=group.notes,
            members=[
                GroupMemberRead(
                    id=member.id,
                    workout_exercise_id=member.workout_exercise_id,
                    exercise_name=member.exercise.exercise_name,
                    member_order=member.member_order,
                )
                for member in sorted(group.members, key=lambda item: item.member_order)
            ],
        )
        for group in sorted(session.groups, key=lambda item: item.group_order)
    ]

    return WorkoutRead(
        id=session.id,
        check_in_at=session.check_in_at,
        check_out_at=session.check_out_at,
        title=session.title,
        notes=session.notes,
        created_at=session.created_at,
        updated_at=session.updated_at,
        exercises=exercises,
        groups=groups,
        working_set_count=working,
        dropset_count=dropsets,
        physical_set_count=physical,
    )


def _session_load_options() -> tuple:
    return (
        selectinload(WorkoutSession.exercises).selectinload(WorkoutExercise.sets),
        selectinload(WorkoutSession.groups)
        .selectinload(ExerciseGroup.members)
        .selectinload(ExerciseGroupMember.exercise),
    )


class WorkoutService:
    """Shared workout domain operations for FastAPI and MCP."""

    def __init__(
        self,
        session: AsyncSession,
        owner_id: str,
        *,
        user_timezone: str | None = None,
    ) -> None:
        self.session = session
        self.owner_id = owner_id
        self.user_timezone = user_timezone or get_settings().user_timezone

    async def log_workout(self, payload: WorkoutCreate) -> WorkoutRead:
        try:
            workout = WorkoutSession(
                owner_id=self.owner_id,
                check_in_at=payload.check_in_at,
                check_out_at=payload.check_out_at,
                title=payload.title,
                notes=payload.notes,
            )
            self.session.add(workout)
            await self.session.flush()

            exercise_by_ref: dict[str, WorkoutExercise] = {}
            for exercise_payload in sorted(
                payload.exercises, key=lambda item: item.order
            ):
                exercise = WorkoutExercise(
                    workout_session_id=workout.id,
                    exercise_name=exercise_payload.name.strip(),
                    exercise_order=exercise_payload.order,
                    notes=exercise_payload.notes,
                )
                self.session.add(exercise)
                await self.session.flush()

                if exercise_payload.client_ref is not None:
                    exercise_by_ref[exercise_payload.client_ref] = exercise

                for set_payload in sorted(
                    exercise_payload.sets,
                    key=lambda item: item.order,
                ):
                    parent = ExerciseSet(
                        workout_exercise_id=exercise.id,
                        set_order=set_payload.order,
                        set_type=ExerciseSetType(set_payload.type.value),
                        weight_kg=set_payload.weight_kg,
                        reps=set_payload.reps,
                        notes=set_payload.notes,
                        parent_set_id=None,
                    )
                    self.session.add(parent)
                    await self.session.flush()

                    for drop_payload in sorted(
                        set_payload.dropsets,
                        key=lambda item: item.order,
                    ):
                        self.session.add(
                            ExerciseSet(
                                workout_exercise_id=exercise.id,
                                set_order=drop_payload.order,
                                set_type=ExerciseSetType.DROPSET,
                                weight_kg=drop_payload.weight_kg,
                                reps=drop_payload.reps,
                                notes=drop_payload.notes,
                                parent_set_id=parent.id,
                            )
                        )

            for group_payload in sorted(payload.groups, key=lambda item: item.order):
                group = ExerciseGroup(
                    workout_session_id=workout.id,
                    group_type=group_payload.type,
                    group_order=group_payload.order,
                    notes=group_payload.notes,
                )
                self.session.add(group)
                await self.session.flush()

                for member_order, exercise_ref in enumerate(
                    group_payload.exercise_refs,
                    start=1,
                ):
                    exercise = exercise_by_ref.get(exercise_ref)
                    if exercise is None:
                        raise ValidationDomainError(
                            f"Unknown exercise_ref '{exercise_ref}' in group order {group_payload.order}"
                        )
                    if exercise.workout_session_id != workout.id:
                        raise ValidationDomainError(
                            "Superset members must belong to the same workout session"
                        )
                    self.session.add(
                        ExerciseGroupMember(
                            exercise_group_id=group.id,
                            workout_exercise_id=exercise.id,
                            member_order=member_order,
                        )
                    )

            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise ValidationDomainError(
                "Workout could not be saved due to a data constraint violation"
            ) from exc
        except Exception:
            await self.session.rollback()
            raise

        loaded = await self._get_session(workout.id)
        return _to_workout_read(loaded)

    async def get_workout(self, workout_id: UUID) -> WorkoutRead:
        self.session.expire_all()
        return _to_workout_read(await self._get_session(workout_id))

    async def edit_workout(
        self,
        workout_id: UUID,
        payload: WorkoutEditRequest,
    ) -> WorkoutRead:
        try:
            workout = await self._get_session(workout_id, for_update=True)
            self._require_current_version(workout, payload.expected_updated_at)

            exercises = {item.id: item for item in workout.exercises}
            sets = {
                item.id: item
                for exercise in workout.exercises
                for item in exercise.sets
            }
            groups = {item.id: item for item in workout.groups}
            self._validate_operation_conflicts(payload)

            removed_exercises = {
                operation.exercise_id
                for operation in payload.operations
                if isinstance(operation, RemoveExerciseOperation)
            }
            removed_sets = {
                operation.set_id
                for operation in payload.operations
                if isinstance(operation, RemoveSetOperation)
            }
            removed_groups = {
                operation.superset_id
                for operation in payload.operations
                if isinstance(operation, RemoveSupersetOperation)
            }

            final_group_orders: dict[object, int] = {
                group_id: group.group_order
                for group_id, group in groups.items()
                if group_id not in removed_groups
            }
            final_group_members: dict[object, list[UUID]] = {
                group_id: [
                    member.workout_exercise_id
                    for member in sorted(
                        group.members, key=lambda item: item.member_order
                    )
                ]
                for group_id, group in groups.items()
                if group_id not in removed_groups
            }
            for operation in payload.operations:
                if isinstance(operation, UpdateSupersetOperation):
                    group = self._group_in_workout(groups, operation.superset_id)
                    if group.id in removed_groups:
                        raise ValidationDomainError(
                            "A superset cannot be changed in the same request that removes it"
                        )
                    if "order" in operation.model_fields_set:
                        final_group_orders[group.id] = operation.order
                    if "workout_exercise_ids" in operation.model_fields_set:
                        final_group_members[group.id] = (
                            operation.workout_exercise_ids or []
                        )
                elif isinstance(operation, AddSupersetOperation):
                    key = ("new-group", id(operation))
                    final_group_orders[key] = operation.order
                    final_group_members[key] = operation.workout_exercise_ids

            self._require_unique_orders(
                list(final_group_orders.values()),
                "Superset order values must be unique within a workout",
            )
            for member_ids in final_group_members.values():
                if len(member_ids) < 2:
                    raise ValidationDomainError(
                        "A superset requires at least two workout exercises"
                    )
                for exercise_id in member_ids:
                    self._exercise_in_workout(exercises, exercise_id)

            for exercise_id in removed_exercises:
                exercise = self._exercise_in_workout(exercises, exercise_id)
                if any(
                    exercise_id in member_ids
                    for member_ids in final_group_members.values()
                ):
                    raise ValidationDomainError(
                        "Cannot remove an exercise that belongs to a superset; "
                        "remove it from every superset in the same edit"
                    )
                if any(
                    isinstance(operation, AddSetOperation)
                    and operation.exercise_id == exercise.id
                    for operation in payload.operations
                ):
                    raise ValidationDomainError(
                        "Cannot add a set to an exercise being removed"
                    )

            cascaded_set_ids: set[UUID] = set()
            for operation in payload.operations:
                if not isinstance(operation, RemoveSetOperation):
                    continue
                target = self._set_in_workout(sets, operation.set_id)
                children = [
                    item for item in sets.values() if item.parent_set_id == target.id
                ]
                if children and not operation.cascade_dropsets:
                    raise ValidationDomainError(
                        "Removing a working set with dropsets requires "
                        "cascade_dropsets=true"
                    )
                cascaded_set_ids.update(item.id for item in children)

            removed_sets.update(cascaded_set_ids)
            for set_id in removed_sets:
                target = sets.get(set_id)
                if (
                    target is not None
                    and target.workout_exercise_id in removed_exercises
                ):
                    raise ValidationDomainError(
                        "Do not remove sets separately from an exercise being removed"
                    )

            final_exercise_orders: dict[object, int] = {
                exercise_id: exercise.exercise_order
                for exercise_id, exercise in exercises.items()
                if exercise_id not in removed_exercises
            }
            final_set_orders = {
                set_id: item.set_order
                for set_id, item in sets.items()
                if set_id not in removed_sets
                and item.workout_exercise_id not in removed_exercises
            }
            final_check_in = workout.check_in_at
            final_check_out = workout.check_out_at

            for operation in payload.operations:
                if isinstance(operation, UpdateWorkoutOperation):
                    if "check_in_at" in operation.model_fields_set:
                        final_check_in = operation.check_in_at
                    if "check_out_at" in operation.model_fields_set:
                        final_check_out = operation.check_out_at
                elif isinstance(operation, UpdateExerciseOperation):
                    exercise = self._exercise_in_workout(
                        exercises, operation.exercise_id
                    )
                    self._reject_removed_exercise(exercise.id, removed_exercises)
                    if "order" in operation.model_fields_set:
                        final_exercise_orders[exercise.id] = operation.order
                elif isinstance(operation, AddExerciseOperation):
                    final_exercise_orders[("new", id(operation))] = (
                        operation.exercise.order
                    )
                elif isinstance(operation, UpdateSetOperation):
                    target = self._set_in_workout(sets, operation.set_id)
                    self._reject_removed_set(target, removed_sets, removed_exercises)
                    if "order" in operation.model_fields_set:
                        final_set_orders[target.id] = operation.order
                elif isinstance(operation, AddSetOperation):
                    self._exercise_in_workout(exercises, operation.exercise_id)
                    self._reject_removed_exercise(
                        operation.exercise_id,
                        removed_exercises,
                    )
                elif isinstance(operation, AddDropsetOperation):
                    parent = self._set_in_workout(sets, operation.parent_set_id)
                    self._reject_removed_set(parent, removed_sets, removed_exercises)
                    if (
                        parent.set_type != ExerciseSetType.WORKING
                        or parent.parent_set_id is not None
                    ):
                        raise ValidationDomainError(
                            "A dropset requires a top-level working-set parent"
                        )

            if final_check_in is None:
                raise ValidationDomainError("check_in_at cannot be null")
            if final_check_out is not None and final_check_out <= final_check_in:
                raise ValidationDomainError(
                    "check_out_at must be later than check_in_at"
                )
            self._require_unique_orders(
                list(final_exercise_orders.values()),
                "Exercise order values must be unique within a workout",
            )
            self._validate_final_set_orders(
                workout,
                payload,
                sets,
                removed_exercises,
                removed_sets,
                final_set_orders,
            )

            original_exercise_orders = {
                item.id: item.exercise_order for item in workout.exercises
            }
            original_set_orders = {item.id: item.set_order for item in sets.values()}
            original_group_orders = {
                item.id: item.group_order for item in workout.groups
            }
            stage_base = (
                max(
                    [
                        *original_exercise_orders.values(),
                        *original_set_orders.values(),
                        *original_group_orders.values(),
                        0,
                    ]
                )
                + len(original_exercise_orders)
                + len(original_set_orders)
                + 100
            )
            for index, exercise in enumerate(workout.exercises, start=1):
                exercise.exercise_order = stage_base + index
            for index, item in enumerate(
                sets.values(), start=len(workout.exercises) + 1
            ):
                item.set_order = stage_base + index
            for index, group in enumerate(
                workout.groups,
                start=len(workout.exercises) + len(sets) + 1,
            ):
                group.group_order = stage_base + index
            await self.session.flush()

            for exercise_id, order in original_exercise_orders.items():
                exercises[exercise_id].exercise_order = final_exercise_orders.get(
                    exercise_id,
                    order,
                )
            for set_id, order in original_set_orders.items():
                sets[set_id].set_order = final_set_orders.get(set_id, order)
            for group_id, order in original_group_orders.items():
                if group_id in final_group_orders:
                    groups[group_id].group_order = final_group_orders[group_id]

            remove_group_operations = tuple(
                operation
                for operation in payload.operations
                if isinstance(operation, RemoveSupersetOperation)
            )
            other_group_operations = tuple(
                operation
                for operation in payload.operations
                if isinstance(
                    operation, (AddSupersetOperation, UpdateSupersetOperation)
                )
            )
            for operation in remove_group_operations:
                await self._apply_operation(workout, exercises, sets, groups, operation)
            if remove_group_operations:
                await self.session.flush()
            ordered_group_operations = (
                *remove_group_operations,
                *other_group_operations,
            )
            for operation in (
                *other_group_operations,
                *(
                    item
                    for item in payload.operations
                    if item not in ordered_group_operations
                ),
            ):
                await self._apply_operation(workout, exercises, sets, groups, operation)

            workout.updated_at = func.now()
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise ValidationDomainError(
                "Workout could not be edited due to a data constraint violation"
            ) from exc
        except Exception:
            await self.session.rollback()
            raise

        self.session.expire_all()
        return _to_workout_read(await self._get_session(workout_id))

    async def delete_workout(
        self,
        workout_id: UUID,
        payload: WorkoutDeleteRequest,
    ) -> WorkoutDeleteResult:
        try:
            workout = await self._get_session(workout_id, for_update=True)
            self._require_current_version(workout, payload.expected_updated_at)
            expected_confirmation = f"DELETE {workout_id}"
            if payload.confirmation != expected_confirmation:
                raise ValidationDomainError(
                    f"confirmation must exactly match '{expected_confirmation}'"
                )
            await self.session.delete(workout)
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise
        return WorkoutDeleteResult(workout_id=workout_id)

    @staticmethod
    def _require_current_version(
        workout: WorkoutSession,
        expected_updated_at: datetime,
    ) -> None:
        if workout.updated_at != expected_updated_at:
            raise ConflictDomainError(
                "Workout has changed since it was read; retrieve it again before editing"
            )

    @staticmethod
    def _exercise_in_workout(
        exercises: dict[UUID, WorkoutExercise],
        exercise_id: UUID,
    ) -> WorkoutExercise:
        exercise = exercises.get(exercise_id)
        if exercise is None:
            raise ValidationDomainError(
                f"Exercise {exercise_id} does not belong to this workout"
            )
        return exercise

    @staticmethod
    def _set_in_workout(
        sets: dict[UUID, ExerciseSet],
        set_id: UUID,
    ) -> ExerciseSet:
        target = sets.get(set_id)
        if target is None:
            raise ValidationDomainError(f"Set {set_id} does not belong to this workout")
        return target

    @staticmethod
    def _group_in_workout(
        groups: dict[UUID, ExerciseGroup],
        group_id: UUID,
    ) -> ExerciseGroup:
        group = groups.get(group_id)
        if group is None:
            raise ValidationDomainError(
                f"Superset {group_id} does not belong to this workout"
            )
        return group

    @staticmethod
    def _reject_removed_exercise(
        exercise_id: UUID,
        removed_exercises: set[UUID],
    ) -> None:
        if exercise_id in removed_exercises:
            raise ValidationDomainError(
                "An exercise cannot be changed in the same request that removes it"
            )

    @staticmethod
    def _reject_removed_set(
        target: ExerciseSet,
        removed_sets: set[UUID],
        removed_exercises: set[UUID],
    ) -> None:
        if target.id in removed_sets or target.workout_exercise_id in removed_exercises:
            raise ValidationDomainError(
                "A set cannot be changed in the same request that removes it"
            )

    @staticmethod
    def _require_unique_orders(orders: list[int], message: str) -> None:
        if len(orders) != len(set(orders)):
            raise ValidationDomainError(message)

    @staticmethod
    def _validate_operation_conflicts(payload: WorkoutEditRequest) -> None:
        workout_updates = 0
        exercise_targets: set[UUID] = set()
        set_targets: set[UUID] = set()
        group_targets: set[UUID] = set()
        for operation in payload.operations:
            if isinstance(operation, UpdateWorkoutOperation):
                workout_updates += 1
            elif isinstance(
                operation, (UpdateExerciseOperation, RemoveExerciseOperation)
            ):
                if operation.exercise_id in exercise_targets:
                    raise ValidationDomainError(
                        "An exercise may be updated or removed only once per request"
                    )
                exercise_targets.add(operation.exercise_id)
            elif isinstance(operation, (UpdateSetOperation, RemoveSetOperation)):
                if operation.set_id in set_targets:
                    raise ValidationDomainError(
                        "A set may be updated or removed only once per request"
                    )
                set_targets.add(operation.set_id)
            elif isinstance(
                operation, (UpdateSupersetOperation, RemoveSupersetOperation)
            ):
                if operation.superset_id in group_targets:
                    raise ValidationDomainError(
                        "A superset may be updated or removed only once per request"
                    )
                group_targets.add(operation.superset_id)
        if workout_updates > 1:
            raise ValidationDomainError(
                "Workout details may be updated only once per request"
            )

    def _validate_final_set_orders(
        self,
        workout: WorkoutSession,
        payload: WorkoutEditRequest,
        sets: dict[UUID, ExerciseSet],
        removed_exercises: set[UUID],
        removed_sets: set[UUID],
        final_set_orders: dict[UUID, int],
    ) -> None:
        orders_by_scope: dict[tuple[UUID, UUID | None], list[int]] = defaultdict(list)
        for set_id, target in sets.items():
            if (
                set_id in removed_sets
                or target.workout_exercise_id in removed_exercises
            ):
                continue
            orders_by_scope[(target.workout_exercise_id, target.parent_set_id)].append(
                final_set_orders[set_id]
            )

        for operation in payload.operations:
            if isinstance(operation, AddSetOperation):
                orders_by_scope[(operation.exercise_id, None)].append(
                    operation.set.order
                )
            elif isinstance(operation, AddDropsetOperation):
                parent = sets[operation.parent_set_id]
                orders_by_scope[(parent.workout_exercise_id, parent.id)].append(
                    operation.dropset.order
                )

        for orders in orders_by_scope.values():
            self._require_unique_orders(
                orders,
                "Set order values must be unique within their parent scope",
            )

    async def _apply_operation(
        self,
        workout: WorkoutSession,
        exercises: dict[UUID, WorkoutExercise],
        sets: dict[UUID, ExerciseSet],
        groups: dict[UUID, ExerciseGroup],
        operation: object,
    ) -> None:
        if isinstance(operation, UpdateWorkoutOperation):
            for field_name in ("check_in_at", "check_out_at", "title", "notes"):
                if field_name in operation.model_fields_set:
                    setattr(workout, field_name, getattr(operation, field_name))
            return

        if isinstance(operation, AddExerciseOperation):
            exercise = WorkoutExercise(
                workout_session_id=workout.id,
                exercise_name=operation.exercise.name.strip(),
                exercise_order=operation.exercise.order,
                notes=operation.exercise.notes,
            )
            self.session.add(exercise)
            await self.session.flush()
            for set_payload in sorted(
                operation.exercise.sets,
                key=lambda item: item.order,
            ):
                await self._add_top_level_set(exercise.id, set_payload)
            return

        if isinstance(operation, UpdateExerciseOperation):
            exercise = exercises[operation.exercise_id]
            if "name" in operation.model_fields_set:
                exercise.exercise_name = operation.name.strip()
            if "order" in operation.model_fields_set:
                exercise.exercise_order = operation.order
            if "notes" in operation.model_fields_set:
                exercise.notes = operation.notes
            return

        if isinstance(operation, RemoveExerciseOperation):
            await self.session.delete(exercises[operation.exercise_id])
            return

        if isinstance(operation, AddSetOperation):
            await self._add_top_level_set(operation.exercise_id, operation.set)
            return

        if isinstance(operation, AddDropsetOperation):
            parent = sets[operation.parent_set_id]
            self.session.add(
                ExerciseSet(
                    workout_exercise_id=parent.workout_exercise_id,
                    set_order=operation.dropset.order,
                    set_type=ExerciseSetType.DROPSET,
                    weight_kg=operation.dropset.weight_kg,
                    reps=operation.dropset.reps,
                    notes=operation.dropset.notes,
                    parent_set_id=parent.id,
                )
            )
            return

        if isinstance(operation, UpdateSetOperation):
            target = sets[operation.set_id]
            field_map = {
                "order": "set_order",
                "weight_kg": "weight_kg",
                "reps": "reps",
                "notes": "notes",
            }
            for input_name, model_name in field_map.items():
                if input_name in operation.model_fields_set:
                    setattr(target, model_name, getattr(operation, input_name))
            return

        if isinstance(operation, RemoveSetOperation):
            await self.session.delete(sets[operation.set_id])
            return

        if isinstance(operation, AddSupersetOperation):
            group = ExerciseGroup(
                workout_session_id=workout.id,
                group_type="superset",
                group_order=operation.order,
                notes=operation.notes,
            )
            self.session.add(group)
            await self.session.flush()
            for member_order, exercise_id in enumerate(
                operation.workout_exercise_ids,
                start=1,
            ):
                self.session.add(
                    ExerciseGroupMember(
                        exercise_group_id=group.id,
                        workout_exercise_id=exercise_id,
                        member_order=member_order,
                    )
                )
            return

        if isinstance(operation, UpdateSupersetOperation):
            group = groups[operation.superset_id]
            if "order" in operation.model_fields_set:
                group.group_order = operation.order
            if "notes" in operation.model_fields_set:
                group.notes = operation.notes
            if "workout_exercise_ids" in operation.model_fields_set:
                for member in tuple(group.members):
                    await self.session.delete(member)
                await self.session.flush()
                group.members.clear()
                for member_order, exercise_id in enumerate(
                    operation.workout_exercise_ids,
                    start=1,
                ):
                    self.session.add(
                        ExerciseGroupMember(
                            exercise_group_id=group.id,
                            workout_exercise_id=exercise_id,
                            member_order=member_order,
                        )
                    )
            return

        if isinstance(operation, RemoveSupersetOperation):
            await self.session.delete(groups[operation.superset_id])

    async def _add_top_level_set(
        self,
        exercise_id: UUID,
        payload: SetCreate,
    ) -> None:
        parent = ExerciseSet(
            workout_exercise_id=exercise_id,
            set_order=payload.order,
            set_type=ExerciseSetType(payload.type.value),
            weight_kg=payload.weight_kg,
            reps=payload.reps,
            notes=payload.notes,
            parent_set_id=None,
        )
        self.session.add(parent)
        await self.session.flush()
        for drop_payload in sorted(payload.dropsets, key=lambda item: item.order):
            self.session.add(
                ExerciseSet(
                    workout_exercise_id=exercise_id,
                    set_order=drop_payload.order,
                    set_type=ExerciseSetType.DROPSET,
                    weight_kg=drop_payload.weight_kg,
                    reps=drop_payload.reps,
                    notes=drop_payload.notes,
                    parent_set_id=parent.id,
                )
            )

    async def get_recent_workouts(
        self,
        query: RecentWorkoutsQuery,
    ) -> list[WorkoutRead]:
        statement: Select[tuple[WorkoutSession]] = (
            select(WorkoutSession)
            .options(*_session_load_options())
            .where(WorkoutSession.owner_id == self.owner_id)
            .order_by(WorkoutSession.check_in_at.desc())
            .limit(query.limit)
        )
        if query.before is not None:
            statement = statement.where(WorkoutSession.check_in_at < query.before)

        result = await self.session.execute(statement)
        sessions = result.scalars().unique().all()
        return [_to_workout_read(item) for item in sessions]

    async def get_workouts(self, query: WorkoutHistoryQuery) -> WorkoutHistoryRead:
        timezone = ZoneInfo(self.user_timezone)
        start_at = datetime.combine(query.start_date, time.min, tzinfo=timezone)
        end_at = datetime.combine(
            query.end_date + timedelta(days=1),
            time.min,
            tzinfo=timezone,
        )
        statement: Select[tuple[WorkoutSession]] = (
            select(WorkoutSession)
            .options(*_session_load_options())
            .where(
                WorkoutSession.owner_id == self.owner_id,
                WorkoutSession.check_in_at >= start_at,
                WorkoutSession.check_in_at < end_at,
            )
            .order_by(WorkoutSession.check_in_at.desc(), WorkoutSession.id.asc())
            .limit(query.limit)
        )
        result = await self.session.execute(statement)
        sessions = result.scalars().unique().all()
        workouts = [_to_workout_read(item) for item in sessions]
        return WorkoutHistoryRead(
            start_date=query.start_date,
            end_date=query.end_date,
            workout_count=len(workouts),
            workouts=workouts,
        )

    async def get_exercise_history(
        self,
        query: ExerciseHistoryQuery,
    ) -> list[ExerciseHistoryEntry]:
        statement: Select[tuple[WorkoutExercise]] = (
            select(WorkoutExercise)
            .join(
                WorkoutSession, WorkoutExercise.workout_session_id == WorkoutSession.id
            )
            .options(
                selectinload(WorkoutExercise.sets),
                selectinload(WorkoutExercise.session),
            )
            .where(
                func.lower(WorkoutExercise.exercise_name) == query.exercise_name.lower()
            )
            .where(WorkoutSession.owner_id == self.owner_id)
            .order_by(
                WorkoutSession.check_in_at.desc(), WorkoutExercise.exercise_order.asc()
            )
            .limit(query.limit)
        )
        if query.start_at is not None:
            statement = statement.where(WorkoutSession.check_in_at >= query.start_at)
        if query.end_at is not None:
            statement = statement.where(WorkoutSession.check_in_at <= query.end_at)

        result = await self.session.execute(statement)
        exercises = result.scalars().unique().all()

        history: list[ExerciseHistoryEntry] = []
        for exercise in exercises:
            assembled = _assemble_sets(exercise.sets)
            history.append(
                ExerciseHistoryEntry(
                    workout_session_id=exercise.workout_session_id,
                    check_in_at=exercise.session.check_in_at,
                    workout_title=exercise.session.title,
                    workout_exercise_id=exercise.id,
                    exercise_name=exercise.exercise_name,
                    exercise_order=exercise.exercise_order,
                    sets=[
                        ExerciseHistorySetRead(
                            id=item.id,
                            set_order=item.set_order,
                            set_type=item.set_type,
                            weight_kg=item.weight_kg,
                            reps=item.reps,
                            notes=item.notes,
                            parent_set_id=item.parent_set_id,
                            dropsets=item.dropsets,
                        )
                        for item in assembled
                    ],
                )
            )
        return history

    async def _get_session(
        self,
        session_id: UUID,
        *,
        for_update: bool = False,
    ) -> WorkoutSession:
        statement = (
            select(WorkoutSession)
            .where(
                WorkoutSession.id == session_id,
                WorkoutSession.owner_id == self.owner_id,
            )
            .options(*_session_load_options())
        )
        if for_update:
            statement = statement.with_for_update()
        result = await self.session.execute(statement)
        workout = result.scalar_one_or_none()
        if workout is None:
            raise NotFoundError(f"Workout {session_id} was not found")
        return workout
