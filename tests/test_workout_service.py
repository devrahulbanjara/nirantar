from datetime import datetime
from decimal import Decimal

import pytest
from sqlalchemy import func, select

from nirantar.models.workouts import WorkoutSession
from nirantar.schemas.workouts import (
    ExerciseCreate,
    ExerciseHistoryQuery,
    RecentWorkoutsQuery,
    SetCreate,
    SetType,
    WorkoutCreate,
)
from nirantar.services.errors import ValidationDomainError
from nirantar.services.workouts import WorkoutService
from tests.helpers import NEPAL, sample_workout


@pytest.mark.asyncio
async def test_log_workout_saves_sets_dropsets_and_superset(db_session) -> None:
    service = WorkoutService(db_session)
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
    service = WorkoutService(db_session)
    duplicate_set = SetCreate.model_construct(
        order=1,
        type=SetType.WORKING,
        weight_kg=Decimal("10"),
        reps=10,
        rir=None,
        rpe=None,
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
    service = WorkoutService(db_session)
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
    service = WorkoutService(db_session)
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
