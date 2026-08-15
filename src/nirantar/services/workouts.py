from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from nirantar.models.workouts import (
    ExerciseGroup,
    ExerciseGroupMember,
    ExerciseSet,
    ExerciseSetType,
    WorkoutExercise,
    WorkoutSession,
)
from nirantar.schemas.workouts import (
    DropsetRead,
    ExerciseGroupRead,
    ExerciseHistoryEntry,
    ExerciseHistoryQuery,
    ExerciseHistorySetRead,
    ExerciseRead,
    GroupMemberRead,
    RecentWorkoutsQuery,
    SetRead,
    SetType,
    WorkoutCreate,
    WorkoutRead,
)
from nirantar.services.errors import ValidationDomainError


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
                rir=child.rir,
                rpe=child.rpe,
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
                rir=parent.rir,
                rpe=parent.rpe,
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

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def log_workout(self, payload: WorkoutCreate) -> WorkoutRead:
        try:
            workout = WorkoutSession(
                check_in_at=payload.check_in_at,
                check_out_at=payload.check_out_at,
                title=payload.title,
                notes=payload.notes,
            )
            self.session.add(workout)
            await self.session.flush()

            exercise_by_ref: dict[str, WorkoutExercise] = {}
            for exercise_payload in sorted(payload.exercises, key=lambda item: item.order):
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
                        rir=set_payload.rir,
                        rpe=set_payload.rpe,
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
                                rir=drop_payload.rir,
                                rpe=drop_payload.rpe,
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

    async def get_recent_workouts(
        self,
        query: RecentWorkoutsQuery,
    ) -> list[WorkoutRead]:
        statement: Select[tuple[WorkoutSession]] = (
            select(WorkoutSession)
            .options(*_session_load_options())
            .order_by(WorkoutSession.check_in_at.desc())
            .limit(query.limit)
        )
        if query.before is not None:
            statement = statement.where(WorkoutSession.check_in_at < query.before)

        result = await self.session.execute(statement)
        sessions = result.scalars().unique().all()
        return [_to_workout_read(item) for item in sessions]

    async def get_exercise_history(
        self,
        query: ExerciseHistoryQuery,
    ) -> list[ExerciseHistoryEntry]:
        statement: Select[tuple[WorkoutExercise]] = (
            select(WorkoutExercise)
            .join(WorkoutSession, WorkoutExercise.workout_session_id == WorkoutSession.id)
            .options(
                selectinload(WorkoutExercise.sets),
                selectinload(WorkoutExercise.session),
            )
            .where(func.lower(WorkoutExercise.exercise_name) == query.exercise_name.lower())
            .order_by(WorkoutSession.check_in_at.desc(), WorkoutExercise.exercise_order.asc())
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
                            rir=item.rir,
                            rpe=item.rpe,
                            notes=item.notes,
                            parent_set_id=item.parent_set_id,
                            dropsets=item.dropsets,
                        )
                        for item in assembled
                    ],
                )
            )
        return history

    async def _get_session(self, session_id: UUID) -> WorkoutSession:
        result = await self.session.execute(
            select(WorkoutSession)
            .where(WorkoutSession.id == session_id)
            .options(*_session_load_options())
        )
        workout = result.scalar_one()
        return workout
