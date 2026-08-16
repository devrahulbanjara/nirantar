from __future__ import annotations

import asyncio
import os
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select

from nirantar.config import get_settings
from nirantar.db.session import dispose_engine, get_session_factory
from nirantar.models.meals import Meal
from nirantar.models.weights import BodyWeightEntry
from nirantar.models.workouts import WorkoutSession
from nirantar.schemas.meals import FoodItemCreate, MealCreate
from nirantar.schemas.weights import WeightCreate
from nirantar.schemas.workouts import (
    DropsetCreate,
    ExerciseCreate,
    ExerciseGroupCreate,
    SetCreate,
    SetType,
    WorkoutCreate,
)
from nirantar.services.meals import MealService
from nirantar.services.weights import WeightService
from nirantar.services.workouts import WorkoutService


def local_datetime(day: date, hour: int, minute: int = 0) -> datetime:
    timezone = ZoneInfo(get_settings().user_timezone)
    return datetime.combine(day, time(hour, minute), tzinfo=timezone)


def set_entry(
    order: int,
    weight_kg: str,
    reps: int,
    *,
    set_type: SetType = SetType.WORKING,
    dropsets: list[DropsetCreate] | None = None,
) -> SetCreate:
    return SetCreate(
        order=order,
        type=set_type,
        weight_kg=weight_kg,
        reps=reps,
        dropsets=dropsets or [],
    )


def exercise(
    name: str,
    order: int,
    sets: list[SetCreate],
    *,
    client_ref: str | None = None,
) -> ExerciseCreate:
    return ExerciseCreate(
        name=name,
        order=order,
        sets=sets,
        client_ref=client_ref,
    )


def workout(
    day: date,
    title: str,
    start: tuple[int, int],
    duration_minutes: int,
    exercises: list[ExerciseCreate],
    *,
    groups: list[ExerciseGroupCreate] | None = None,
) -> WorkoutCreate:
    check_in = local_datetime(day, *start)
    return WorkoutCreate(
        check_in_at=check_in,
        check_out_at=check_in + timedelta(minutes=duration_minutes),
        title=title,
        exercises=exercises,
        groups=groups or [],
    )


def demo_workouts(today: date) -> list[WorkoutCreate]:
    return [
        workout(
            today,
            "Upper body",
            (6, 35),
            77,
            [
                exercise(
                    "Barbell Bench Press",
                    1,
                    [
                        set_entry(1, "20", 15, set_type=SetType.WARMUP),
                        set_entry(2, "40", 10, set_type=SetType.WARMUP),
                        set_entry(3, "60", 8),
                        set_entry(4, "62.5", 7),
                        set_entry(5, "60", 8),
                    ],
                ),
                exercise(
                    "Lat Pulldown",
                    2,
                    [
                        set_entry(1, "45", 12),
                        set_entry(2, "50", 10),
                        set_entry(3, "50", 9),
                    ],
                ),
                exercise(
                    "Seated Cable Row",
                    3,
                    [
                        set_entry(1, "45", 12),
                        set_entry(2, "50", 10),
                        set_entry(3, "50", 9),
                    ],
                ),
                exercise(
                    "Cable Lateral Raise",
                    4,
                    [
                        set_entry(1, "5", 15),
                        set_entry(
                            2,
                            "7.5",
                            12,
                            dropsets=[
                                DropsetCreate(order=1, weight_kg="5", reps=8),
                                DropsetCreate(order=2, weight_kg="2.5", reps=10),
                            ],
                        ),
                    ],
                ),
            ],
        ),
        workout(
            today - timedelta(days=2),
            "Lower body",
            (17, 40),
            69,
            [
                exercise(
                    "Back Squat",
                    1,
                    [
                        set_entry(1, "20", 12, set_type=SetType.WARMUP),
                        set_entry(2, "50", 8, set_type=SetType.WARMUP),
                        set_entry(3, "75", 6),
                        set_entry(4, "80", 5),
                        set_entry(5, "75", 7),
                    ],
                ),
                exercise(
                    "Romanian Deadlift",
                    2,
                    [
                        set_entry(1, "60", 10),
                        set_entry(2, "70", 8),
                        set_entry(3, "70", 8),
                    ],
                ),
                exercise(
                    "Leg Extension",
                    3,
                    [
                        set_entry(1, "35", 14),
                        set_entry(2, "40", 12),
                        set_entry(
                            3,
                            "40",
                            10,
                            dropsets=[
                                DropsetCreate(order=1, weight_kg="25", reps=9),
                            ],
                        ),
                    ],
                ),
            ],
        ),
        workout(
            today - timedelta(days=5),
            "Pull",
            (7, 5),
            64,
            [
                exercise(
                    "Pull-up",
                    1,
                    [set_entry(1, "0", 8), set_entry(2, "0", 7), set_entry(3, "0", 6)],
                ),
                exercise(
                    "Chest Supported Row",
                    2,
                    [
                        set_entry(1, "30", 12),
                        set_entry(2, "35", 10),
                        set_entry(3, "35", 9),
                    ],
                ),
                exercise(
                    "Face Pull",
                    3,
                    [set_entry(1, "20", 15), set_entry(2, "20", 14)],
                ),
            ],
        ),
        workout(
            today - timedelta(days=9),
            "Arms",
            (18, 10),
            51,
            [
                exercise(
                    "Dumbbell Curl",
                    1,
                    [set_entry(1, "10", 12), set_entry(2, "12.5", 9), set_entry(3, "12.5", 8)],
                    client_ref="curl",
                ),
                exercise(
                    "Rope Pushdown",
                    2,
                    [set_entry(1, "25", 13), set_entry(2, "30", 10), set_entry(3, "30", 9)],
                    client_ref="pushdown",
                ),
            ],
            groups=[
                ExerciseGroupCreate(
                    type="superset",
                    order=1,
                    exercise_refs=["curl", "pushdown"],
                )
            ],
        ),
    ]


def food(
    name: str,
    quantity: str,
    unit: str,
    calories: str | None,
    protein: str | None,
    carbs: str | None,
    fat: str | None,
) -> FoodItemCreate:
    return FoodItemCreate(
        name=name,
        quantity=quantity,
        unit=unit,
        calories_kcal=calories,
        protein_g=protein,
        carbohydrates_g=carbs,
        fat_g=fat,
    )


def meal(
    day: date,
    name: str,
    eaten_at: tuple[int, int],
    items: list[FoodItemCreate],
) -> MealCreate:
    return MealCreate(
        eaten_at=local_datetime(day, *eaten_at),
        name=name,
        items=items,
    )


def demo_meals(today: date) -> list[MealCreate]:
    breakfast = [
        food("Rolled oats", "70", "g", "266", "9.0", "47.4", "4.8"),
        food("Whole milk", "250", "ml", "153", "7.9", "12.0", "8.3"),
        food("Banana", "1", "medium", "105", "1.3", "27.0", "0.4"),
        food("Boiled eggs", "2", "piece", "156", "12.6", "1.2", "10.6"),
    ]
    lunch = [
        food("Cooked rice", "300", "g", "390", "7.2", "84.6", "0.9"),
        food("Masoor dal", "220", "g", "255", "17.5", "44.0", "1.0"),
        food("Chicken curry", "180", "g", "315", "39.0", "8.0", "14.0"),
        food("Mixed tarkari", "180", "g", "125", "4.0", "20.0", "4.0"),
        food("Cucumber achar", "60", "g", "35", "1.0", "5.0", "1.2"),
    ]
    snack = [
        food("Chiura", "60", "g", "210", "4.0", "46.0", "1.0"),
        food("Plain dahi", "180", "g", "110", "6.3", "8.5", "5.5"),
        food("Milk tea", "1", "cup", None, None, None, None),
    ]

    return [
        meal(today, "Breakfast", (8, 20), breakfast),
        meal(today, "Dal bhat lunch", (13, 5), lunch),
        meal(today, "Afternoon snack", (16, 45), snack),
        meal(today - timedelta(days=1), "Breakfast", (8, 10), breakfast),
        meal(today - timedelta(days=1), "Dal bhat dinner", (19, 30), lunch),
        meal(today - timedelta(days=2), "Breakfast", (8, 35), breakfast),
        meal(today - timedelta(days=2), "Afternoon snack", (16, 20), snack),
        meal(today - timedelta(days=3), "Dal bhat lunch", (12, 50), lunch),
        meal(today - timedelta(days=3), "Afternoon snack", (16, 30), snack),
    ]


def demo_weights(today: date) -> list[WeightCreate]:
    readings = [
        (14, "74.200"),
        (12, "74.000"),
        (10, "73.900"),
        (8, "73.800"),
        (6, "73.700"),
        (4, "73.600"),
        (2, "73.500"),
        (0, "73.400"),
    ]
    return [
        WeightCreate(measured_on=today - timedelta(days=days_ago), weight_kg=value)
        for days_ago, value in readings
    ]


async def seed() -> None:
    owner_id = os.environ.get("NIRANTAR_SEED_USER_ID", "").strip()
    if not owner_id:
        raise RuntimeError("Set NIRANTAR_SEED_USER_ID to the target Clerk user ID")

    timezone = ZoneInfo(get_settings().user_timezone)
    today = datetime.now(timezone).date()
    factory = get_session_factory()
    created = {"workouts": 0, "meals": 0, "weights": 0}
    skipped = {"workouts": 0, "meals": 0, "weights": 0}

    async with factory() as session:
        for payload in demo_workouts(today):
            exists = await session.scalar(
                select(WorkoutSession.id).where(
                    WorkoutSession.owner_id == owner_id,
                    WorkoutSession.check_in_at == payload.check_in_at,
                    WorkoutSession.title == payload.title,
                )
            )
            if exists:
                skipped["workouts"] += 1
                continue
            await WorkoutService(session, owner_id).log_workout(payload)
            created["workouts"] += 1

        for payload in demo_meals(today):
            exists = await session.scalar(
                select(Meal.id).where(
                    Meal.owner_id == owner_id,
                    Meal.eaten_at == payload.eaten_at,
                    Meal.name == payload.name,
                )
            )
            if exists:
                skipped["meals"] += 1
                continue
            await MealService(session, owner_id).log_meal(payload)
            created["meals"] += 1

        for payload in demo_weights(today):
            exists = await session.scalar(
                select(BodyWeightEntry.id).where(
                    BodyWeightEntry.owner_id == owner_id,
                    BodyWeightEntry.measured_on == payload.measured_on
                )
            )
            if exists:
                skipped["weights"] += 1
                continue
            await WeightService(session, owner_id).log_weight(payload)
            created["weights"] += 1

    await dispose_engine()
    print(
        "Created "
        f"{created['workouts']} workouts, "
        f"{created['meals']} meals, and "
        f"{created['weights']} weight entries."
    )
    if any(skipped.values()):
        print(
            "Skipped "
            f"{skipped['workouts']} workouts, "
            f"{skipped['meals']} meals, and "
            f"{skipped['weights']} weight entries already present."
        )


if __name__ == "__main__":
    asyncio.run(seed())
