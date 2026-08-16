from datetime import datetime
from decimal import Decimal

import pytest
from sqlalchemy import func, select

from nirantar.models.workouts import ExerciseSet, WorkoutExercise, WorkoutSession
from nirantar.schemas.workouts import (
    ExerciseCreate,
    ExerciseHistoryQuery,
    RecentWorkoutsQuery,
    SetCreate,
    SetType,
    WorkoutCreate,
    WorkoutDeleteRequest,
    WorkoutEditRequest,
)
from nirantar.services.errors import ConflictDomainError, ValidationDomainError
from nirantar.services.workouts import WorkoutService
from tests.helpers import NEPAL, TEST_USER_ID, sample_workout


@pytest.mark.asyncio
async def test_log_workout_saves_sets_dropsets_and_superset(db_session) -> None:
    service = WorkoutService(db_session, TEST_USER_ID)
    result = await service.log_workout(sample_workout())

    assert result.title == "Arms"
    assert len(result.exercises) == 2
    assert result.exercises[0].exercise_name == "Bicep Curl"
    assert result.exercises[0].sets[0].set_type == SetType.WARMUP
    assert result.exercises[0].sets[-1].dropsets[0].weight_kg == Decimal("15")
    assert result.exercises[0].sets[-1].dropsets[1].reps == 8
    assert result.groups[0].group_type == "superset"
    assert [member.exercise_name for member in result.groups[0].members] == [
        "Bicep Curl",
        "Tricep Pushdown",
    ]
    assert result.working_set_count == 4
    assert result.dropset_count == 2
    assert result.physical_set_count == 7


@pytest.mark.asyncio
async def test_log_workout_rolls_back_on_invalid_child(db_session) -> None:
    service = WorkoutService(db_session, TEST_USER_ID)
    duplicate_set = SetCreate.model_construct(
        order=1,
        type=SetType.WORKING,
        weight_kg=Decimal("10"),
        reps=10,
        notes=None,
        client_ref=None,
        dropsets=[],
    )
    payload = WorkoutCreate.model_construct(
        check_in_at=datetime(2026, 8, 16, 7, 5, tzinfo=NEPAL),
        check_out_at=datetime(2026, 8, 16, 8, 12, tzinfo=NEPAL),
        title="Broken",
        notes=None,
        exercises=[
            ExerciseCreate.model_construct(
                name="Broken Curl",
                order=1,
                notes=None,
                client_ref=None,
                sets=[duplicate_set, duplicate_set.model_copy()],
            )
        ],
        groups=[],
    )

    with pytest.raises(ValidationDomainError):
        await service.log_workout(payload)

    count = await db_session.scalar(select(func.count()).select_from(WorkoutSession))
    assert count == 0


@pytest.mark.asyncio
async def test_recent_workouts_are_ordered(db_session) -> None:
    service = WorkoutService(db_session, TEST_USER_ID)
    earlier = sample_workout(
        check_in_at=datetime(2026, 8, 15, 7, 0, tzinfo=NEPAL),
    )
    later = sample_workout(
        check_in_at=datetime(2026, 8, 16, 7, 0, tzinfo=NEPAL),
    )
    earlier.title = "Earlier"
    later.title = "Later"
    await service.log_workout(earlier)
    await service.log_workout(later)

    recent = await service.get_recent_workouts(RecentWorkoutsQuery(limit=10))
    assert [item.title for item in recent] == ["Later", "Earlier"]
    assert recent[0].exercises[0].sets[0].set_order == 1


@pytest.mark.asyncio
async def test_exercise_history_separates_working_and_dropsets(db_session) -> None:
    service = WorkoutService(db_session, TEST_USER_ID)
    await service.log_workout(sample_workout())

    history = await service.get_exercise_history(
        ExerciseHistoryQuery(exercise_name="bicep curl", limit=10)
    )
    assert len(history) == 1
    entry = history[0]
    assert entry.exercise_name == "Bicep Curl"
    working = [item for item in entry.sets if item.set_type == SetType.WORKING]
    warmups = [item for item in entry.sets if item.set_type == SetType.WARMUP]
    assert len(warmups) == 1
    assert len(working) == 3
    assert len(working[-1].dropsets) == 2
    assert all(drop.set_type == SetType.DROPSET for drop in working[-1].dropsets)


@pytest.mark.asyncio
async def test_database_rejects_checkout_before_checkin(db_session) -> None:
    session = WorkoutSession(
        check_in_at=datetime(2026, 8, 16, 8, 0, tzinfo=NEPAL),
        check_out_at=datetime(2026, 8, 16, 7, 0, tzinfo=NEPAL),
        title="Invalid",
    )
    db_session.add(session)
    with pytest.raises(Exception):
        await db_session.commit()
    await db_session.rollback()


@pytest.mark.asyncio
async def test_edit_workout_updates_set_and_adds_dropset(db_session) -> None:
    service = WorkoutService(db_session, TEST_USER_ID)
    created = await service.log_workout(sample_workout())
    target_set = created.exercises[0].sets[2]

    edited = await service.edit_workout(
        created.id,
        WorkoutEditRequest(
            expected_updated_at=created.updated_at,
            operations=[
                {"operation": "update_workout", "title": "Corrected Arms"},
                {
                    "operation": "update_set",
                    "set_id": target_set.id,
                    "weight_kg": "17.5",
                    "notes": None,
                },
                {
                    "operation": "add_dropset",
                    "parent_set_id": target_set.id,
                    "dropset": {"order": 1, "weight_kg": "12.5", "reps": 7},
                },
            ],
        ),
    )

    assert edited.title == "Corrected Arms"
    assert edited.exercises[0].sets[2].id == target_set.id
    assert edited.exercises[0].sets[2].weight_kg == Decimal("17.500")
    assert edited.exercises[0].sets[2].dropsets[0].reps == 7
    assert edited.updated_at > created.updated_at


@pytest.mark.asyncio
async def test_edit_requires_explicit_dropset_cascade(db_session) -> None:
    service = WorkoutService(db_session, TEST_USER_ID)
    created = await service.log_workout(sample_workout())
    parent = created.exercises[0].sets[-1]

    with pytest.raises(ValidationDomainError, match="cascade_dropsets=true"):
        await service.edit_workout(
            created.id,
            WorkoutEditRequest(
                expected_updated_at=created.updated_at,
                operations=[{"operation": "remove_set", "set_id": parent.id}],
            ),
        )

    edited = await service.edit_workout(
        created.id,
        WorkoutEditRequest(
            expected_updated_at=created.updated_at,
            operations=[
                {
                    "operation": "remove_set",
                    "set_id": parent.id,
                    "cascade_dropsets": True,
                }
            ],
        ),
    )
    assert all(item.id != parent.id for item in edited.exercises[0].sets)
    assert edited.dropset_count == 0


@pytest.mark.asyncio
async def test_edit_rejects_grouped_exercise_removal_and_stale_version(db_session) -> None:
    service = WorkoutService(db_session, TEST_USER_ID)
    created = await service.log_workout(sample_workout())

    with pytest.raises(ValidationDomainError, match="belongs to a superset"):
        await service.edit_workout(
            created.id,
            WorkoutEditRequest(
                expected_updated_at=created.updated_at,
                operations=[
                    {
                        "operation": "remove_exercise",
                        "exercise_id": created.exercises[0].id,
                    }
                ],
            ),
        )

    edited = await service.edit_workout(
        created.id,
        WorkoutEditRequest(
            expected_updated_at=created.updated_at,
            operations=[{"operation": "update_workout", "notes": "new note"}],
        ),
    )
    with pytest.raises(ConflictDomainError):
        await service.edit_workout(
            created.id,
            WorkoutEditRequest(
                expected_updated_at=created.updated_at,
                operations=[{"operation": "update_workout", "title": "stale"}],
            ),
        )
    assert edited.notes == "new note"


@pytest.mark.asyncio
async def test_remove_ungrouped_exercise_and_delete_workout(db_session) -> None:
    service = WorkoutService(db_session, TEST_USER_ID)
    payload = sample_workout()
    payload.groups = []
    created = await service.log_workout(payload)

    edited = await service.edit_workout(
        created.id,
        WorkoutEditRequest(
            expected_updated_at=created.updated_at,
            operations=[
                {
                    "operation": "remove_exercise",
                    "exercise_id": created.exercises[1].id,
                }
            ],
        ),
    )
    assert len(edited.exercises) == 1

    with pytest.raises(ValidationDomainError, match="confirmation must exactly match"):
        await service.delete_workout(
            edited.id,
            WorkoutDeleteRequest(
                expected_updated_at=edited.updated_at,
                confirmation="DELETE",
            ),
        )

    result = await service.delete_workout(
        edited.id,
        WorkoutDeleteRequest(
            expected_updated_at=edited.updated_at,
            confirmation=f"DELETE {edited.id}",
        ),
    )
    assert result.deleted is True
    assert await db_session.scalar(select(func.count()).select_from(WorkoutSession)) == 0
    assert await db_session.scalar(select(func.count()).select_from(WorkoutExercise)) == 0
    assert await db_session.scalar(select(func.count()).select_from(ExerciseSet)) == 0
