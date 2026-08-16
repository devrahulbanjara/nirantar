from datetime import date, datetime, timezone

import pytest

from nirantar.schemas.weights import WeightCreate
from nirantar.services.meals import MealService
from nirantar.services.summaries import DailySummaryService
from nirantar.services.weights import WeightService
from nirantar.services.workouts import WorkoutService
from tests.helpers import sample_meal, sample_workout


@pytest.mark.asyncio
async def test_daily_summary_combines_workouts_meals_nutrition_and_weight(
    db_session,
) -> None:
    complete = sample_workout()
    open_workout = sample_workout().model_copy(update={"check_out_at": None})
    await WorkoutService(db_session).log_workout(complete)
    await WorkoutService(db_session).log_workout(open_workout)
    await MealService(db_session).log_meal(sample_meal())
    await WeightService(db_session).log_weight(
        WeightCreate(weight_kg="73", measured_on=date(2026, 8, 16))
    )

    summary = await DailySummaryService(db_session).get_daily_summary(
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
    assert summary.body_weight is not None
    assert summary.body_weight.weight_kg == 73


@pytest.mark.asyncio
async def test_daily_summary_uses_kathmandu_boundaries(db_session) -> None:
    await MealService(db_session).log_meal(
        sample_meal(eaten_at=datetime(2026, 8, 16, 18, 14, 59, tzinfo=timezone.utc))
    )
    await MealService(db_session).log_meal(
        sample_meal(eaten_at=datetime(2026, 8, 16, 18, 15, tzinfo=timezone.utc))
    )
    await WorkoutService(db_session).log_workout(
        sample_workout(
            check_in_at=datetime(2026, 8, 15, 18, 20, tzinfo=timezone.utc)
        )
    )

    summary = await DailySummaryService(db_session).get_daily_summary(
        date(2026, 8, 16)
    )

    assert summary.meals.meal_count == 1
    assert summary.workouts.workout_count == 1


@pytest.mark.asyncio
async def test_empty_daily_summary_reports_no_invented_values(db_session) -> None:
    summary = await DailySummaryService(db_session).get_daily_summary(
        date(2026, 8, 20)
    )

    assert summary.workouts.workout_count == 0
    assert summary.workouts.gym_duration_seconds == 0
    assert summary.meals.meal_count == 0
    assert summary.meals.nutrition.protein_g.known_total is None
    assert summary.meals.nutrition.protein_g.complete is True
    assert summary.body_weight is None
