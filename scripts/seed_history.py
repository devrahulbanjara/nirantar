"""Seed realistic multi-month history for the local development Clerk user.

Generation is deterministic: the same user id, week count, and end date always
produce the same rows, so re-running only fills gaps instead of duplicating.

Run from the repository root with uv:

    uv run python scripts/seed_history.py

To generate a different history length:

    uv run python scripts/seed_history.py --weeks 24
"""

from __future__ import annotations

import argparse
import asyncio
import random
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from decimal import ROUND_HALF_UP, Decimal
from zoneinfo import ZoneInfo

from sqlalchemy import select

from nirantar.config import get_settings
from nirantar.db.session import dispose_engine, get_session_factory
from nirantar.models.meals import Meal
from nirantar.models.sleep import SleepEntry
from nirantar.models.weights import BodyWeightEntry
from nirantar.models.workouts import WorkoutSession
from nirantar.schemas.meals import FoodItemCreate, MealCreate
from nirantar.schemas.sleep import SleepCreate
from nirantar.schemas.targets import TargetPatch
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
from nirantar.services.sleep import SleepService
from nirantar.services.targets import TargetService
from nirantar.services.weights import WeightService
from nirantar.services.workouts import WorkoutService

DEFAULT_WEEKS = 16
SEED_USER_ID = "user_3HzhQfWPlSSgQwsADzZiO0UeJMv"

# Nepali training week: Saturday is the rest day, so the split runs
# Sunday / Monday / Wednesday / Thursday. date.weekday(): Mon=0 .. Sun=6.
TRAINING_WEEKDAYS = (6, 0, 2, 3)

# Every sixth week is a deload: lighter loads, fewer reps, no dropsets.
DELOAD_INTERVAL_WEEKS = 6

MISSED_SESSION_CHANCE = 0.07
UNLOGGED_DAY_CHANCE = 0.08
SKIPPED_MEAL_CHANCE = 0.18
WEIGHT_LOG_CHANCE = 0.8

START_BODY_WEIGHT_KG = Decimal("70.800")
WEEKLY_BODY_WEIGHT_GAIN_KG = Decimal("0.150")


# --------------------------------------------------------------------------
# Workout templates
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class ExerciseSpec:
    """One exercise slot in a template, with its own progression curve."""

    name: str
    start_kg: str
    weekly_kg: str
    step_kg: str
    top_reps: int
    min_reps: int
    working_sets: int
    warmup_fractions: tuple[str, ...] = ()
    dropsets: int = 0
    weekly_reps: float = 0.0

    @property
    def is_bodyweight(self) -> bool:
        return Decimal(self.start_kg) == 0 and Decimal(self.weekly_kg) == 0


@dataclass(frozen=True)
class SessionTemplate:
    title: str
    start_hour: int
    start_minute: int
    base_minutes: int
    exercises: tuple[ExerciseSpec, ...]
    superset: tuple[str, str] | None = None


BARBELL = "2.5"
DUMBBELL = "2"
STACK = "5"

UPPER_A = SessionTemplate(
    title="Upper A",
    start_hour=6,
    start_minute=35,
    base_minutes=76,
    exercises=(
        ExerciseSpec(
            name="Barbell Bench Press",
            start_kg="57.5",
            weekly_kg="0.9",
            step_kg=BARBELL,
            top_reps=8,
            min_reps=5,
            working_sets=4,
            warmup_fractions=("0.35", "0.65"),
        ),
        ExerciseSpec(
            name="Incline Dumbbell Press",
            start_kg="22",
            weekly_kg="0.35",
            step_kg=DUMBBELL,
            top_reps=10,
            min_reps=7,
            working_sets=3,
        ),
        ExerciseSpec(
            name="Lat Pulldown",
            start_kg="50",
            weekly_kg="0.8",
            step_kg=STACK,
            top_reps=11,
            min_reps=8,
            working_sets=3,
        ),
        ExerciseSpec(
            name="Seated Cable Row",
            start_kg="45",
            weekly_kg="0.8",
            step_kg=STACK,
            top_reps=12,
            min_reps=9,
            working_sets=3,
        ),
        ExerciseSpec(
            name="Cable Lateral Raise",
            start_kg="7.5",
            weekly_kg="0.15",
            step_kg=DUMBBELL,
            top_reps=15,
            min_reps=11,
            working_sets=3,
            dropsets=2,
        ),
        ExerciseSpec(
            name="Rope Pushdown",
            start_kg="27.5",
            weekly_kg="0.5",
            step_kg=STACK,
            top_reps=13,
            min_reps=9,
            working_sets=3,
        ),
    ),
)

LOWER_A = SessionTemplate(
    title="Lower A",
    start_hour=17,
    start_minute=40,
    base_minutes=71,
    exercises=(
        ExerciseSpec(
            name="Back Squat",
            start_kg="72.5",
            weekly_kg="1.1",
            step_kg=BARBELL,
            top_reps=7,
            min_reps=5,
            working_sets=4,
            warmup_fractions=("0.3", "0.6", "0.8"),
        ),
        ExerciseSpec(
            name="Romanian Deadlift",
            start_kg="65",
            weekly_kg="1.0",
            step_kg=BARBELL,
            top_reps=9,
            min_reps=7,
            working_sets=3,
            warmup_fractions=("0.55",),
        ),
        ExerciseSpec(
            name="Leg Press",
            start_kg="140",
            weekly_kg="2.5",
            step_kg="10",
            top_reps=12,
            min_reps=9,
            working_sets=3,
        ),
        ExerciseSpec(
            name="Seated Leg Curl",
            start_kg="40",
            weekly_kg="0.6",
            step_kg=STACK,
            top_reps=13,
            min_reps=10,
            working_sets=3,
        ),
        ExerciseSpec(
            name="Standing Calf Raise",
            start_kg="60",
            weekly_kg="1.0",
            step_kg=STACK,
            top_reps=15,
            min_reps=11,
            working_sets=3,
            dropsets=1,
        ),
    ),
)

UPPER_B = SessionTemplate(
    title="Upper B",
    start_hour=7,
    start_minute=5,
    base_minutes=68,
    exercises=(
        ExerciseSpec(
            name="Pull-up",
            start_kg="0",
            weekly_kg="0",
            step_kg=BARBELL,
            top_reps=8,
            min_reps=5,
            working_sets=4,
            weekly_reps=0.12,
        ),
        ExerciseSpec(
            name="Overhead Press",
            start_kg="37.5",
            weekly_kg="0.6",
            step_kg=BARBELL,
            top_reps=8,
            min_reps=6,
            working_sets=3,
            warmup_fractions=("0.5",),
        ),
        ExerciseSpec(
            name="Chest Supported Row",
            start_kg="32.5",
            weekly_kg="0.6",
            step_kg=DUMBBELL,
            top_reps=11,
            min_reps=8,
            working_sets=3,
        ),
        ExerciseSpec(
            name="Incline Dumbbell Curl",
            start_kg="12",
            weekly_kg="0.18",
            step_kg=DUMBBELL,
            top_reps=11,
            min_reps=8,
            working_sets=3,
        ),
        ExerciseSpec(
            name="Overhead Cable Extension",
            start_kg="25",
            weekly_kg="0.5",
            step_kg=STACK,
            top_reps=13,
            min_reps=9,
            working_sets=3,
        ),
        ExerciseSpec(
            name="Face Pull",
            start_kg="20",
            weekly_kg="0.3",
            step_kg=STACK,
            top_reps=16,
            min_reps=12,
            working_sets=3,
        ),
    ),
    superset=("Incline Dumbbell Curl", "Overhead Cable Extension"),
)

LOWER_B = SessionTemplate(
    title="Lower B",
    start_hour=18,
    start_minute=10,
    base_minutes=66,
    exercises=(
        ExerciseSpec(
            name="Conventional Deadlift",
            start_kg="95",
            weekly_kg="1.4",
            step_kg=BARBELL,
            top_reps=5,
            min_reps=3,
            working_sets=3,
            warmup_fractions=("0.35", "0.6", "0.8"),
        ),
        ExerciseSpec(
            name="Bulgarian Split Squat",
            start_kg="16",
            weekly_kg="0.3",
            step_kg=DUMBBELL,
            top_reps=10,
            min_reps=8,
            working_sets=3,
        ),
        ExerciseSpec(
            name="Leg Extension",
            start_kg="40",
            weekly_kg="0.7",
            step_kg=STACK,
            top_reps=14,
            min_reps=10,
            working_sets=3,
            dropsets=1,
        ),
        ExerciseSpec(
            name="Lying Leg Curl",
            start_kg="35",
            weekly_kg="0.6",
            step_kg=STACK,
            top_reps=13,
            min_reps=10,
            working_sets=3,
        ),
        ExerciseSpec(
            name="Hanging Leg Raise",
            start_kg="0",
            weekly_kg="0",
            step_kg=BARBELL,
            top_reps=12,
            min_reps=8,
            working_sets=3,
            weekly_reps=0.15,
        ),
    ),
)

WEEK_SPLIT = (UPPER_A, LOWER_A, UPPER_B, LOWER_B)

SESSION_NOTES = (
    None,
    None,
    None,
    "Felt strong, sleep was good.",
    "Short on time, cut rest periods.",
    "Left shoulder slightly stiff on pressing.",
    "Gym was crowded, swapped the order around.",
)


# --------------------------------------------------------------------------
# Food library
# --------------------------------------------------------------------------

# (name, quantity, unit, kcal, protein_g, carbohydrates_g, fat_g)
# None means the value is genuinely unknown and must stay NULL.
FoodRow = tuple[str, str, str, str | None, str | None, str | None, str | None]


@dataclass(frozen=True)
class MealTemplate:
    name: str
    items: tuple[FoodRow, ...]


BREAKFASTS = (
    MealTemplate(
        "Oats breakfast",
        (
            ("Rolled oats", "70", "g", "266", "9.0", "47.4", "4.8"),
            ("Whole milk", "250", "ml", "153", "7.9", "12.0", "8.3"),
            ("Banana", "1", "medium", "105", "1.3", "27.0", "0.4"),
            ("Boiled eggs", "2", "piece", "156", "12.6", "1.2", "10.6"),
        ),
    ),
    MealTemplate(
        "Roti and omelette",
        (
            ("Wheat roti", "3", "piece", "297", "9.0", "54.0", "5.7"),
            ("Two-egg omelette", "1", "serving", "220", "13.0", "2.0", "17.0"),
            ("Milk tea", "1", "cup", None, None, None, None),
        ),
    ),
    MealTemplate(
        "Chiura and dahi",
        (
            ("Chiura", "60", "g", "210", "4.0", "46.0", "1.0"),
            ("Plain dahi", "200", "g", "122", "7.0", "9.4", "6.1"),
            ("Boiled egg", "1", "piece", "78", "6.3", "0.6", "5.3"),
            ("Black tea", "1", "cup", "2", None, "0.5", "0"),
        ),
    ),
    MealTemplate(
        "Sel roti and chiya",
        (
            ("Sel roti", "2", "piece", "330", "4.0", "52.0", "12.0"),
            ("Milk tea", "1", "cup", None, None, None, None),
            ("Boiled eggs", "2", "piece", "156", "12.6", "1.2", "10.6"),
        ),
    ),
)

LUNCHES = (
    MealTemplate(
        "Dal bhat with chicken",
        (
            ("Cooked rice", "300", "g", "390", "7.2", "84.6", "0.9"),
            ("Masoor dal", "220", "g", "255", "17.5", "44.0", "1.0"),
            ("Chicken curry", "180", "g", "315", "39.0", "8.0", "14.0"),
            ("Mixed tarkari", "180", "g", "125", "4.0", "20.0", "4.0"),
            ("Cucumber achar", "60", "g", None, None, None, None),
        ),
    ),
    MealTemplate(
        "Dal bhat with fish",
        (
            ("Cooked rice", "300", "g", "390", "7.2", "84.6", "0.9"),
            ("Rahar dal", "220", "g", "240", "15.0", "42.0", "1.2"),
            ("Fish curry", "160", "g", "280", "32.0", "6.0", "13.0"),
            ("Rayo saag", "150", "g", "70", "4.0", "8.0", "2.5"),
            ("Golbheda achar", "50", "g", None, None, None, None),
        ),
    ),
    MealTemplate(
        "Veg dal bhat",
        (
            ("Cooked rice", "320", "g", "416", "7.7", "90.2", "1.0"),
            ("Mas ko dal", "200", "g", "230", "14.0", "38.0", "1.5"),
            ("Aloo tama", "180", "g", "160", "5.0", "26.0", "4.0"),
            ("Rayo saag", "150", "g", "70", "4.0", "8.0", "2.5"),
            ("Plain dahi", "100", "g", "61", "3.5", "4.7", "3.1"),
        ),
    ),
    MealTemplate(
        "Momo lunch",
        (
            ("Chicken momo", "10", "piece", "520", "28.0", "58.0", "18.0"),
            ("Jhol achar", "100", "g", None, None, None, None),
            ("Clear soup", "200", "ml", "35", "2.0", "4.0", "1.0"),
        ),
    ),
)

TRAINING_SNACKS = (
    MealTemplate(
        "Post-workout shake",
        (
            ("Whey protein", "30", "g", "120", "24.0", "3.0", "1.5"),
            ("Whole milk", "250", "ml", "153", "7.9", "12.0", "8.3"),
            ("Banana", "1", "medium", "105", "1.3", "27.0", "0.4"),
        ),
    ),
    MealTemplate(
        "Shake and peanut butter toast",
        (
            ("Whey protein", "30", "g", "120", "24.0", "3.0", "1.5"),
            ("Whole wheat bread", "2", "slice", "160", "6.0", "28.0", "2.0"),
            ("Peanut butter", "20", "g", "120", "5.0", "4.0", "10.2"),
        ),
    ),
)

REST_SNACKS = (
    MealTemplate(
        "Afternoon snack",
        (
            ("Chiura", "60", "g", "210", "4.0", "46.0", "1.0"),
            ("Plain dahi", "180", "g", "110", "6.3", "8.5", "5.5"),
            ("Milk tea", "1", "cup", None, None, None, None),
        ),
    ),
    MealTemplate(
        "Fruit and nuts",
        (
            ("Apple", "1", "medium", "95", "0.5", "25.0", "0.3"),
            ("Mixed nuts", "30", "g", "180", "5.0", "6.0", "16.0"),
            ("Black tea", "1", "cup", "2", None, "0.5", "0"),
        ),
    ),
    MealTemplate(
        "Samosa and chiya",
        (
            ("Samosa", "2", "piece", "262", "5.0", "30.0", "14.0"),
            ("Milk tea", "1", "cup", None, None, None, None),
        ),
    ),
)

DINNERS = (
    MealTemplate(
        "Dal bhat dinner",
        (
            ("Cooked rice", "250", "g", "325", "6.0", "70.5", "0.8"),
            ("Masoor dal", "200", "g", "232", "15.9", "40.0", "0.9"),
            ("Chicken curry", "150", "g", "263", "32.5", "6.7", "11.7"),
            ("Mixed tarkari", "150", "g", "104", "3.3", "16.7", "3.3"),
        ),
    ),
    MealTemplate(
        "Roti and tarkari",
        (
            ("Wheat roti", "3", "piece", "297", "9.0", "54.0", "5.7"),
            ("Chicken tarkari", "160", "g", "280", "34.0", "7.0", "12.0"),
            ("Rayo saag", "150", "g", "70", "4.0", "8.0", "2.5"),
            ("Plain dahi", "100", "g", "61", "3.5", "4.7", "3.1"),
        ),
    ),
    MealTemplate(
        "Thukpa",
        (
            ("Chicken thukpa", "500", "ml", "480", "26.0", "62.0", "14.0"),
            ("Timur achar", "40", "g", None, None, None, None),
        ),
    ),
    MealTemplate(
        "Chowmein dinner",
        (
            ("Veg chowmein", "350", "g", "520", "12.0", "72.0", "20.0"),
            ("Boiled eggs", "2", "piece", "156", "12.6", "1.2", "10.6"),
        ),
    ),
)


# --------------------------------------------------------------------------
# Generation
# --------------------------------------------------------------------------


@dataclass
class Plan:
    workouts: list[WorkoutCreate] = field(default_factory=list)
    meals: list[MealCreate] = field(default_factory=list)
    weights: list[WeightCreate] = field(default_factory=list)


def _rounded(value: Decimal, step: Decimal) -> Decimal:
    """Round a load to the nearest plate or stack increment."""
    if step == 0:
        return value
    return (value / step).quantize(Decimal("1"), rounding=ROUND_HALF_UP) * step


def _local_datetime(day: date, hour: int, minute: int, timezone: ZoneInfo) -> datetime:
    return datetime.combine(day, time(hour, minute), tzinfo=timezone)


def _client_ref(name: str) -> str:
    return name.lower().replace(" ", "_").replace("-", "_")


def _build_sets(
    spec: ExerciseSpec,
    week_index: int,
    is_deload: bool,
    session_factor: Decimal,
    rng: random.Random,
) -> list[SetCreate]:
    step = Decimal(spec.step_kg)
    top_weight = Decimal("0")
    if not spec.is_bodyweight:
        raw = (
            Decimal(spec.start_kg) + Decimal(spec.weekly_kg) * week_index
        ) * session_factor
        if is_deload:
            raw *= Decimal("0.85")
        top_weight = max(step, _rounded(raw, step))

    rep_bonus = int(spec.weekly_reps * week_index)
    top_reps = spec.top_reps + rep_bonus - (2 if is_deload else 0)

    sets: list[SetCreate] = []
    order = 1

    if not is_deload and not spec.is_bodyweight:
        for raw_fraction in spec.warmup_fractions:
            fraction = Decimal(raw_fraction)
            warmup_weight = max(
                # An empty olympic bar is the floor for barbell warm-ups.
                Decimal("20") if step == Decimal(BARBELL) else step,
                _rounded(top_weight * fraction, step),
            )
            sets.append(
                SetCreate(
                    order=order,
                    type=SetType.WARMUP,
                    weight_kg=warmup_weight,
                    reps=rng.choice((10, 12, 15)) if fraction < Decimal("0.5") else 8,
                )
            )
            order += 1

    working_sets = spec.working_sets - (1 if is_deload else 0)
    for index in range(working_sets):
        reps = max(spec.min_reps, top_reps - index + rng.choice((-1, 0, 0, 1)))
        # Back off slightly on the final set of the heavier compounds.
        weight = top_weight
        if not spec.is_bodyweight and index == working_sets - 1 and rng.random() < 0.35:
            weight = max(step, top_weight - step)

        dropsets: list[DropsetCreate] = []
        if (
            not is_deload
            and spec.dropsets
            and index == working_sets - 1
            and not spec.is_bodyweight
        ):
            drop_weight = weight
            for drop_index in range(spec.dropsets):
                drop_weight = max(step, _rounded(drop_weight * Decimal("0.7"), step))
                dropsets.append(
                    DropsetCreate(
                        order=drop_index + 1,
                        weight_kg=drop_weight,
                        reps=max(5, reps - 3 - drop_index * 2 + rng.choice((-1, 0, 1))),
                    )
                )

        sets.append(
            SetCreate(
                order=order,
                type=SetType.WORKING,
                weight_kg=None if spec.is_bodyweight else weight,
                reps=reps,
                dropsets=dropsets,
            )
        )
        order += 1

    return sets


def _build_workout(
    template: SessionTemplate,
    day: date,
    week_index: int,
    is_deload: bool,
    timezone: ZoneInfo,
    rng: random.Random,
) -> WorkoutCreate:
    session_factor = Decimal(rng.choice(("0.975", "1", "1", "1", "1.025")))

    exercises: list[ExerciseCreate] = []
    for order, spec in enumerate(template.exercises, start=1):
        exercises.append(
            ExerciseCreate(
                name=spec.name,
                order=order,
                client_ref=_client_ref(spec.name),
                sets=_build_sets(spec, week_index, is_deload, session_factor, rng),
            )
        )

    groups: list[ExerciseGroupCreate] = []
    if template.superset is not None:
        groups.append(
            ExerciseGroupCreate(
                type="superset",
                order=1,
                exercise_refs=[_client_ref(name) for name in template.superset],
            )
        )

    check_in = _local_datetime(
        day,
        template.start_hour,
        template.start_minute,
        timezone,
    ) + timedelta(minutes=rng.randint(-20, 25))
    duration = template.base_minutes + rng.randint(-9, 11)
    if is_deload:
        duration -= 12

    notes = "Deload week." if is_deload else rng.choice(SESSION_NOTES)

    return WorkoutCreate(
        check_in_at=check_in,
        check_out_at=check_in + timedelta(minutes=duration),
        title=template.title,
        notes=notes,
        exercises=exercises,
        groups=groups,
    )


def _build_meal(
    template: MealTemplate,
    day: date,
    hour: int,
    minute: int,
    timezone: ZoneInfo,
) -> MealCreate:
    return MealCreate(
        eaten_at=_local_datetime(day, hour, minute, timezone),
        name=template.name,
        items=[
            FoodItemCreate(
                name=name,
                quantity=quantity,
                unit=unit,
                calories_kcal=calories,
                protein_g=protein,
                carbohydrates_g=carbs,
                fat_g=fat,
            )
            for name, quantity, unit, calories, protein, carbs, fat in template.items
        ],
    )


def _day_meals(
    day: date,
    trained: bool,
    timezone: ZoneInfo,
    rng: random.Random,
) -> list[MealCreate]:
    slots: list[tuple[MealTemplate, int, int]] = [
        (rng.choice(BREAKFASTS), 8, rng.randint(0, 45)),
        (rng.choice(LUNCHES), 12, rng.randint(40, 59)),
        (
            rng.choice(TRAINING_SNACKS if trained else REST_SNACKS),
            rng.choice((16, 17)),
            rng.randint(0, 55),
        ),
        (rng.choice(DINNERS), rng.choice((19, 20)), rng.randint(0, 50)),
    ]

    meals: list[MealCreate] = []
    for template, hour, minute in slots:
        if rng.random() < SKIPPED_MEAL_CHANCE:
            continue
        meals.append(_build_meal(template, day, hour, minute, timezone))
    return meals


def build_plan(
    end_day: date, weeks: int, timezone: ZoneInfo, rng: random.Random
) -> Plan:
    """Generate the full history ending on `end_day` (inclusive)."""
    plan = Plan()
    start_day = end_day - timedelta(days=weeks * 7 - 1)

    for offset in range(weeks * 7):
        day = start_day + timedelta(days=offset)
        week_index = offset // 7
        is_deload = (week_index + 1) % DELOAD_INTERVAL_WEEKS == 0

        trained = False
        if day.weekday() in TRAINING_WEEKDAYS and rng.random() >= MISSED_SESSION_CHANCE:
            template = WEEK_SPLIT[TRAINING_WEEKDAYS.index(day.weekday())]
            plan.workouts.append(
                _build_workout(template, day, week_index, is_deload, timezone, rng)
            )
            trained = True

        if rng.random() >= UNLOGGED_DAY_CHANCE:
            plan.meals.extend(_day_meals(day, trained, timezone, rng))

        if rng.random() < WEIGHT_LOG_CHANCE:
            trend = START_BODY_WEIGHT_KG + WEEKLY_BODY_WEIGHT_GAIN_KG * Decimal(
                offset
            ) / Decimal(7)
            noise = Decimal(str(round(rng.uniform(-0.45, 0.45), 2)))
            plan.weights.append(
                WeightCreate(
                    measured_on=day,
                    weight_kg=(trend + noise).quantize(Decimal("0.1")),
                )
            )

    return plan


# --------------------------------------------------------------------------
# Persistence
# --------------------------------------------------------------------------


async def seed(owner_id: str, weeks: int) -> None:
    settings = get_settings()
    timezone = ZoneInfo(settings.user_timezone)
    end_day = datetime.now(timezone).date()
    rng = random.Random(f"{owner_id}:{end_day.isoformat()}:{weeks}")
    plan = build_plan(end_day, weeks, timezone, rng)

    created = {"workouts": 0, "meals": 0, "weights": 0, "sleep": 0}
    skipped = {"workouts": 0, "meals": 0, "weights": 0, "sleep": 0}
    factory = get_session_factory()

    async with factory() as session:
        workouts = WorkoutService(session, owner_id)
        meals = MealService(session, owner_id)
        weights = WeightService(session, owner_id)
        sleep = SleepService(session, owner_id)
        target_service = TargetService(session, owner_id)
        if (await target_service.get_targets()).targets is None:
            await target_service.set_targets(
                TargetPatch(
                    calorie_target_kcal="2200",
                    protein_target_g="140",
                    carb_target_g="250",
                    fat_target_g="70",
                    goal_weight_kg="72",
                    target_workout_days_per_week=4,
                )
            )

        for payload in plan.workouts:
            exists = await session.scalar(
                select(WorkoutSession.id).where(
                    WorkoutSession.owner_id == owner_id,
                    WorkoutSession.check_in_at == payload.check_in_at,
                )
            )
            if exists:
                skipped["workouts"] += 1
                continue
            await workouts.log_workout(payload)
            created["workouts"] += 1

        for payload in plan.meals:
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
            await meals.log_meal(payload)
            created["meals"] += 1

        for payload in plan.weights:
            exists = await session.scalar(
                select(BodyWeightEntry.id).where(
                    BodyWeightEntry.owner_id == owner_id,
                    BodyWeightEntry.measured_on == payload.measured_on,
                )
            )
            if exists:
                skipped["weights"] += 1
                continue
            await weights.log_weight(payload)
            created["weights"] += 1

        for days_ago in range(weeks * 7):
            wake_date = end_day - timedelta(days=days_ago)
            exists = await session.scalar(
                select(SleepEntry.id).where(
                    SleepEntry.owner_id == owner_id,
                    SleepEntry.sleep_date == wake_date,
                )
            )
            if exists:
                skipped["sleep"] += 1
                continue
            start = datetime.combine(
                wake_date - timedelta(days=1), time(22, 30), tzinfo=timezone
            )
            await sleep.log_sleep(
                SleepCreate(
                    sleep_start=start,
                    sleep_end=datetime.combine(wake_date, time(6, 30), tzinfo=timezone),
                    quality_rating=4,
                )
            )
            created["sleep"] += 1

    await dispose_engine()

    print(
        f"Seeded {weeks} weeks ending {end_day.isoformat()} "
        f"({settings.user_timezone}) for {owner_id}."
    )
    print(
        "Created "
        f"{created['workouts']} workouts, "
        f"{created['meals']} meals, "
        f"{created['weights']} weight entries, "
        f"{created['sleep']} sleep entries, and targets."
    )
    if any(skipped.values()):
        print(
            "Skipped "
            f"{skipped['workouts']} workouts, "
            f"{skipped['meals']} meals, "
            f"{skipped['weights']} weight entries, "
            f"{skipped['sleep']} sleep entries already present."
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--weeks",
        type=int,
        default=DEFAULT_WEEKS,
        help=f"Weeks of history to generate (default {DEFAULT_WEEKS})",
    )
    args = parser.parse_args()
    if args.weeks < 1:
        parser.error("--weeks must be at least 1")
    return args


if __name__ == "__main__":
    parsed = parse_args()
    asyncio.run(seed(SEED_USER_ID, parsed.weeks))
