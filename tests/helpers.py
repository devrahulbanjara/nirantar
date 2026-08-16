from datetime import datetime, timedelta, timezone

from nirantar.schemas.workouts import (
    DropsetCreate,
    ExerciseCreate,
    ExerciseGroupCreate,
    SetCreate,
    SetType,
    WorkoutCreate,
)
from nirantar.schemas.meals import FoodItemCreate, MealCreate

NEPAL = timezone(timedelta(hours=5, minutes=45))


def sample_meal(*, eaten_at: datetime | None = None) -> MealCreate:
    return MealCreate(
        eaten_at=eaten_at or datetime(2026, 8, 16, 9, 10, tzinfo=NEPAL),
        name="Breakfast",
        notes="At home",
        items=[
            FoodItemCreate(
                name="Egg",
                quantity="3",
                unit="piece",
                calories_kcal="210",
                protein_g="18",
                carbohydrates_g="1.5",
                fat_g="15",
            ),
            FoodItemCreate(name="Bread", quantity="2", unit="slice"),
            FoodItemCreate(name="Banana", quantity="1", unit="piece"),
        ],
    )


def sample_workout(
    *,
    check_in_at: datetime | None = None,
    include_invalid_group: bool = False,
) -> WorkoutCreate:
    check_in = check_in_at or datetime(2026, 8, 16, 7, 5, tzinfo=NEPAL)
    exercises = [
        ExerciseCreate(
            client_ref="curl",
            name="Bicep Curl",
            order=1,
            sets=[
                SetCreate(
                    order=1,
                    type=SetType.WARMUP,
                    weight_kg="5",
                    reps=15,
                ),
                SetCreate(
                    order=2,
                    type=SetType.WORKING,
                    weight_kg="10",
                    reps=10,
                ),
                SetCreate(
                    order=3,
                    type=SetType.WORKING,
                    weight_kg="15",
                    reps=8,
                ),
                SetCreate(
                    order=4,
                    type=SetType.WORKING,
                    weight_kg="20",
                    reps=5,
                    dropsets=[
                        DropsetCreate(order=1, weight_kg="15", reps=6),
                        DropsetCreate(order=2, weight_kg="10", reps=8),
                    ],
                ),
            ],
        ),
        ExerciseCreate(
            client_ref="pushdown",
            name="Tricep Pushdown",
            order=2,
            sets=[
                SetCreate(
                    order=1,
                    type=SetType.WORKING,
                    weight_kg="20",
                    reps=12,
                ),
            ],
        ),
    ]
    groups = [
        ExerciseGroupCreate(
            type="superset",
            order=1,
            exercise_refs=["curl", "pushdown"]
            if not include_invalid_group
            else ["curl", "missing"],
        )
    ]
    return WorkoutCreate(
        check_in_at=check_in,
        check_out_at=check_in + timedelta(hours=1, minutes=7),
        title="Arms",
        notes="First session back",
        exercises=exercises,
        groups=groups,
    )
