from datetime import date, datetime, time, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from nirantar.config import get_settings
from nirantar.models.meals import FoodItem, Meal
from nirantar.models.weights import BodyWeightEntry
from nirantar.models.workouts import (
    ExerciseSetType,
    WorkoutExercise,
    WorkoutSession,
)
from nirantar.schemas.summaries import (
    DailySummaryRead,
    MealDailySummaryRead,
    NutrientTotalRead,
    NutritionSummaryRead,
    WorkoutDailySummaryRead,
)
from nirantar.schemas.weights import WeightRead


class DailySummaryService:
    """Calculate deterministic facts for one local calendar date."""

    def __init__(
        self,
        session: AsyncSession,
        *,
        user_timezone: str | None = None,
    ) -> None:
        self.session = session
        self.user_timezone = user_timezone or get_settings().user_timezone

    async def get_daily_summary(self, summary_date: date) -> DailySummaryRead:
        start_at, end_at = self._date_bounds(summary_date)
        workouts = await self._get_workouts(start_at, end_at)
        meals = await self._get_meals(start_at, end_at)
        weight = await self.session.scalar(
            select(BodyWeightEntry).where(
                BodyWeightEntry.measured_on == summary_date
            )
        )

        completed = [item for item in workouts if item.check_out_at is not None]
        duration_seconds = sum(
            int((item.check_out_at - item.check_in_at).total_seconds())
            for item in completed
            if item.check_out_at is not None
        )
        sets = [
            exercise_set
            for workout in workouts
            for exercise in workout.exercises
            for exercise_set in exercise.sets
        ]
        food_items = [item for meal in meals for item in meal.items]

        return DailySummaryRead(
            date=summary_date,
            timezone=self.user_timezone,
            workouts=WorkoutDailySummaryRead(
                workout_count=len(workouts),
                completed_workout_count=len(completed),
                open_workout_count=len(workouts) - len(completed),
                gym_duration_seconds=duration_seconds,
                working_set_count=sum(
                    item.set_type == ExerciseSetType.WORKING for item in sets
                ),
                dropset_count=sum(
                    item.set_type == ExerciseSetType.DROPSET for item in sets
                ),
                physical_set_count=len(sets),
            ),
            meals=MealDailySummaryRead(
                meal_count=len(meals),
                food_item_count=len(food_items),
                nutrition=NutritionSummaryRead(
                    calories_kcal=self._nutrient_total(
                        food_items,
                        "calories_kcal",
                    ),
                    protein_g=self._nutrient_total(food_items, "protein_g"),
                    carbohydrates_g=self._nutrient_total(
                        food_items,
                        "carbohydrates_g",
                    ),
                    fat_g=self._nutrient_total(food_items, "fat_g"),
                ),
            ),
            body_weight=WeightRead.model_validate(weight) if weight is not None else None,
        )

    def _date_bounds(self, summary_date: date) -> tuple[datetime, datetime]:
        timezone = ZoneInfo(self.user_timezone)
        start_at = datetime.combine(summary_date, time.min, tzinfo=timezone)
        return start_at, start_at + timedelta(days=1)

    async def _get_workouts(
        self,
        start_at: datetime,
        end_at: datetime,
    ) -> list[WorkoutSession]:
        result = await self.session.scalars(
            select(WorkoutSession)
            .where(
                WorkoutSession.check_in_at >= start_at,
                WorkoutSession.check_in_at < end_at,
            )
            .options(
                selectinload(WorkoutSession.exercises).selectinload(
                    WorkoutExercise.sets
                )
            )
            .order_by(WorkoutSession.check_in_at.asc(), WorkoutSession.id.asc())
        )
        return list(result.all())

    async def _get_meals(
        self,
        start_at: datetime,
        end_at: datetime,
    ) -> list[Meal]:
        result = await self.session.scalars(
            select(Meal)
            .where(Meal.eaten_at >= start_at, Meal.eaten_at < end_at)
            .options(selectinload(Meal.items))
            .order_by(Meal.eaten_at.asc(), Meal.id.asc())
        )
        return list(result.all())

    @staticmethod
    def _nutrient_total(
        items: list[FoodItem],
        field_name: str,
    ) -> NutrientTotalRead:
        values = [getattr(item, field_name) for item in items]
        known_values = [value for value in values if value is not None]
        return NutrientTotalRead(
            known_total=(
                sum(known_values, start=Decimal("0")) if known_values else None
            ),
            known_item_count=len(known_values),
            missing_item_count=len(values) - len(known_values),
            complete=len(known_values) == len(values),
        )
