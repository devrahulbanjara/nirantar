from datetime import UTC, date, datetime

from nirantar.schemas.meals import FoodItemCreate, MealCreate
from nirantar.schemas.sleep import SleepCreate
from nirantar.schemas.targets import TargetPatch
from nirantar.schemas.weights import WeightCreate
from nirantar.services.insights import InsightService
from nirantar.services.meals import MealService
from nirantar.services.sleep import SleepService
from nirantar.services.targets import TargetService
from nirantar.services.weights import WeightService
from nirantar.services.workouts import WorkoutService
from tests.helpers import NEPAL, TEST_USER_ID, sample_workout


async def test_trends_use_local_days_known_subtotals_and_targets(db_session) -> None:
    owner = TEST_USER_ID
    await TargetService(db_session, owner).set_targets(
        TargetPatch(calorie_target_kcal="2000", target_workout_days_per_week=4)
    )
    await MealService(db_session, owner).log_meal(
        MealCreate(
            eaten_at=datetime(2026, 8, 16, 23, 30, tzinfo=NEPAL),
            name="Late meal",
            items=[FoodItemCreate(name="Known", calories_kcal="1000", protein_g="50")],
        )
    )
    await MealService(db_session, owner).log_meal(
        MealCreate(
            eaten_at=datetime(2026, 8, 17, 8, 0, tzinfo=NEPAL),
            name="Unknown",
            items=[FoodItemCreate(name="Unknown nutrition")],
        )
    )
    await WeightService(db_session, owner).log_weight(
        WeightCreate(measured_on=date(2026, 8, 16), weight_kg="75")
    )
    await WeightService(db_session, owner).log_weight(
        WeightCreate(measured_on=date(2026, 8, 22), weight_kg="74")
    )
    await WorkoutService(db_session, owner).log_workout(sample_workout())
    await SleepService(db_session, owner).log_sleep(
        SleepCreate(
            sleep_start=datetime(2026, 8, 16, 22, 0, tzinfo=NEPAL),
            sleep_end=datetime(2026, 8, 17, 6, 0, tzinfo=NEPAL),
        )
    )

    trends = await InsightService(db_session, owner).get_trends(
        date(2026, 8, 16), date(2026, 8, 22)
    )
    assert trends.average_daily_calories_kcal == 1000
    assert trends.average_daily_protein_g == 50
    assert trends.calorie_target_percentage == 50
    assert trends.weight_change_kg == -1
    assert trends.workout_days_logged == 1
    assert trends.workout_target_progress.expected_workout_days == 4
    assert trends.workout_target_progress.percentage_of_target == 25
    assert trends.average_sleep_hours == 8
    assert trends.days_with_any_data == 3


async def test_streaks_allow_today_to_be_pending_and_week_starts_sunday(
    db_session,
) -> None:
    owner = TEST_USER_ID
    meal_service = MealService(db_session, owner)
    for day in (15, 16, 17):
        await meal_service.log_meal(
            MealCreate(
                eaten_at=datetime(2026, 8, day, 8, tzinfo=NEPAL),
                name="Breakfast",
                items=[FoodItemCreate(name="Breakfast item")],
            )
        )
    await TargetService(db_session, owner).set_targets(
        TargetPatch(target_workout_days_per_week=4)
    )
    await WorkoutService(db_session, owner).log_workout(sample_workout())

    streaks = await InsightService(
        db_session,
        owner,
        clock=lambda: datetime(2026, 8, 18, 10, tzinfo=NEPAL),
    ).get_streaks()
    assert streaks.meals.current_streak_days == 3
    assert streaks.meals.longest_streak_days == 3
    assert streaks.sleep.current_streak_days == 0
    assert streaks.workouts.days_since_last_workout == 2
    assert streaks.workouts.workout_days_logged_this_week == 1
    assert streaks.workouts.target_workout_days_per_week == 4


async def test_trends_bucket_utc_timestamps_to_local_date_and_exclude_other_owners(
    db_session,
) -> None:
    await MealService(db_session, TEST_USER_ID).log_meal(
        MealCreate(
            eaten_at=datetime(2026, 8, 16, 18, 30, tzinfo=UTC),
            name="After midnight locally",
            items=[FoodItemCreate(name="Known", calories_kcal="600")],
        )
    )
    await MealService(db_session, "user_other").log_meal(
        MealCreate(
            eaten_at=datetime(2026, 8, 16, 19, 0, tzinfo=UTC),
            name="Other user's meal",
            items=[FoodItemCreate(name="Known", calories_kcal="1400")],
        )
    )

    trends = await InsightService(db_session, TEST_USER_ID).get_trends(
        date(2026, 8, 17), date(2026, 8, 17)
    )

    assert trends.average_daily_calories_kcal == 600
    assert trends.days_with_any_data == 1
