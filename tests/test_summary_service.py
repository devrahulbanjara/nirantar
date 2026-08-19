from datetime import date, datetime, timezone

import pytest

from nirantar.schemas.sleep import SleepCreate
from nirantar.schemas.summaries import WorkoutActivityQuery
from nirantar.schemas.targets import TargetPatch
from nirantar.schemas.weights import WeightCreate
from nirantar.services.meals import MealService
from nirantar.services.sleep import SleepService
from nirantar.services.summaries import DailySummaryService
from nirantar.services.targets import TargetService
from nirantar.services.weights import WeightService
from nirantar.services.workouts import WorkoutService
from tests.helpers import NEPAL, TEST_USER_ID, sample_meal, sample_workout


@pytest.mark.asyncio
async def test_daily_summary_combines_workouts_meals_nutrition_and_weight(
    db_session,
) -> None:
    complete = sample_workout()
    open_workout = sample_workout().model_copy(update={"check_out_at": None})
    await WorkoutService(db_session, TEST_USER_ID).log_workout(complete)
    await WorkoutService(db_session, TEST_USER_ID).log_workout(open_workout)
    await MealService(db_session, TEST_USER_ID).log_meal(sample_meal())
    await WeightService(db_session, TEST_USER_ID).log_weight(
        WeightCreate(weight_kg="73", measured_on=date(2026, 8, 16))
    )
    await TargetService(db_session, TEST_USER_ID).set_targets(
        TargetPatch(
            calorie_target_kcal="2100",
            protein_target_g="140",
            goal_weight_kg="70",
            target_workout_days_per_week=4,
        )
    )
    await SleepService(db_session, TEST_USER_ID).log_sleep(
        SleepCreate(
            sleep_start=datetime(2026, 8, 15, 22, tzinfo=timezone.utc),
            sleep_end=datetime(2026, 8, 16, 5, tzinfo=timezone.utc),
        )
    )

    summary = await DailySummaryService(db_session, TEST_USER_ID).get_daily_summary(
        date(2026, 8, 16)
    )

    assert summary.timezone == "Asia/Kathmandu"
    assert summary.workouts.workout_count == 2
    assert summary.workouts.completed_workout_count == 1
    assert summary.workouts.open_workout_count == 1
    assert summary.workouts.gym_duration_seconds == 4020
    assert summary.workouts.working_set_count == 8
    assert summary.workouts.dropset_count == 4
    assert summary.workouts.physical_set_count == 14
    assert summary.meals.meal_count == 1
    assert summary.meals.food_item_count == 3

    calories = summary.meals.nutrition.calories_kcal
    assert calories.known_total == 210
    assert calories.known_item_count == 1
    assert calories.missing_item_count == 2
    assert calories.complete is False
    assert calories.target_value == 2100
    assert calories.percentage_of_target == 10
    assert summary.meals.nutrition.protein_g.target_value == 140
    assert summary.sleep is not None
    assert summary.sleep.hours_slept == 7
    assert summary.body_weight is not None
    assert summary.body_weight.weight_kg == 73
    assert summary.body_weight_goal is not None
    assert summary.body_weight_goal.weight_difference_from_goal_kg == 3
    assert summary.body_weight_goal.is_at_goal is False


@pytest.mark.asyncio
async def test_daily_summary_uses_kathmandu_boundaries(db_session) -> None:
    await MealService(db_session, TEST_USER_ID).log_meal(
        sample_meal(eaten_at=datetime(2026, 8, 16, 18, 14, 59, tzinfo=timezone.utc))
    )
    await MealService(db_session, TEST_USER_ID).log_meal(
        sample_meal(eaten_at=datetime(2026, 8, 16, 18, 15, tzinfo=timezone.utc))
    )
    await WorkoutService(db_session, TEST_USER_ID).log_workout(
        sample_workout(check_in_at=datetime(2026, 8, 15, 18, 20, tzinfo=timezone.utc))
    )

    summary = await DailySummaryService(db_session, TEST_USER_ID).get_daily_summary(
        date(2026, 8, 16)
    )

    assert summary.meals.meal_count == 1
    assert summary.workouts.workout_count == 1


@pytest.mark.asyncio
async def test_empty_daily_summary_reports_no_invented_values(db_session) -> None:
    summary = await DailySummaryService(db_session, TEST_USER_ID).get_daily_summary(
        date(2026, 8, 20)
    )

    assert summary.workouts.workout_count == 0
    assert summary.workouts.gym_duration_seconds == 0
    assert summary.meals.meal_count == 0
    assert summary.meals.nutrition.protein_g.known_total is None
    assert summary.meals.nutrition.protein_g.complete is True
    assert summary.body_weight is None


@pytest.mark.asyncio
async def test_workout_activity_groups_by_kathmandu_day(db_session) -> None:
    service = DailySummaryService(db_session, TEST_USER_ID)
    # 18:20 UTC on Aug 15 → 00:05 NPT on Aug 16
    await WorkoutService(db_session, TEST_USER_ID).log_workout(
        sample_workout(
            check_in_at=datetime(2026, 8, 15, 18, 20, tzinfo=timezone.utc),
        )
    )
    await WorkoutService(db_session, TEST_USER_ID).log_workout(
        sample_workout(
            check_in_at=datetime(2026, 8, 16, 7, 5, tzinfo=NEPAL),
        )
    )
    await WorkoutService(db_session, TEST_USER_ID).log_workout(
        sample_workout(
            check_in_at=datetime(2026, 8, 15, 7, 5, tzinfo=NEPAL),
        )
    )

    activity = await service.get_workout_activity(
        WorkoutActivityQuery(start_date=date(2026, 8, 15), end_date=date(2026, 8, 16))
    )

    assert activity.timezone == "Asia/Kathmandu"
    assert activity.active_day_count == 2
    assert [(day.date, day.workout_count) for day in activity.days] == [
        (date(2026, 8, 15), 1),
        (date(2026, 8, 16), 2),
    ]


@pytest.mark.asyncio
async def test_workout_activity_empty_range(db_session) -> None:
    activity = await DailySummaryService(db_session, TEST_USER_ID).get_workout_activity(
        WorkoutActivityQuery(start_date=date(2026, 1, 1), end_date=date(2026, 1, 31))
    )
    assert activity.active_day_count == 0
    assert activity.days == []


@pytest.mark.asyncio
async def test_workout_activity_is_owner_scoped(db_session) -> None:
    await WorkoutService(db_session, TEST_USER_ID).log_workout(sample_workout())
    activity = await DailySummaryService(db_session, "user_friend").get_workout_activity(
        WorkoutActivityQuery(start_date=date(2026, 8, 16), end_date=date(2026, 8, 16))
    )
    assert activity.active_day_count == 0
    assert activity.days == []
