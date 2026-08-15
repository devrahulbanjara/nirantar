from datetime import datetime, timedelta

import pytest
from pydantic import ValidationError

from nirantar.schemas.workouts import (
    DropsetCreate,
    ExerciseCreate,
    ExerciseGroupCreate,
    SetCreate,
    SetType,
    WorkoutCreate,
)
from tests.helpers import NEPAL, sample_workout


def test_rejects_checkout_before_checkin() -> None:
    check_in = datetime(2026, 8, 16, 7, 5, tzinfo=NEPAL)
    with pytest.raises(ValidationError):
        WorkoutCreate(
            check_in_at=check_in,
            check_out_at=check_in - timedelta(minutes=1),
            exercises=[],
        )


def test_rejects_naive_timestamps() -> None:
    with pytest.raises(ValidationError):
        WorkoutCreate(
            check_in_at=datetime(2026, 8, 16, 7, 5),
            exercises=[],
        )


def test_rejects_negative_weight() -> None:
    with pytest.raises(ValidationError):
        SetCreate(order=1, type=SetType.WORKING, weight_kg="-1", reps=5)


def test_rejects_top_level_dropset_type() -> None:
    with pytest.raises(ValidationError):
        SetCreate(order=1, type=SetType.DROPSET, weight_kg="10", reps=5)


def test_rejects_dropsets_on_warmup() -> None:
    with pytest.raises(ValidationError):
        SetCreate(
            order=1,
            type=SetType.WARMUP,
            weight_kg="5",
            reps=10,
            dropsets=[DropsetCreate(order=1, weight_kg="5", reps=5)],
        )


def test_rejects_unknown_group_refs() -> None:
    with pytest.raises(ValidationError):
        sample_workout(include_invalid_group=True)


def test_rejects_duplicate_exercise_order() -> None:
    with pytest.raises(ValidationError):
        WorkoutCreate(
            check_in_at=datetime(2026, 8, 16, 7, 5, tzinfo=NEPAL),
            exercises=[
                ExerciseCreate(name="A", order=1, sets=[]),
                ExerciseCreate(name="B", order=1, sets=[]),
            ],
        )


def test_rejects_non_superset_group_type() -> None:
    with pytest.raises(ValidationError):
        ExerciseGroupCreate(
            type="circuit",
            order=1,
            exercise_refs=["a", "b"],
        )
