from datetime import date, datetime, time, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from sqlalchemy import Date, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from nirantar.config import get_settings
from nirantar.models.meals import FoodItem, Meal
from nirantar.models.sleep import SleepEntry
from nirantar.models.targets import UserTarget
from nirantar.models.weights import BodyWeightEntry
from nirantar.models.workouts import (
    ExerciseSetType,
    WorkoutExercise,
    WorkoutSession,
)
from nirantar.schemas.sleep import SleepRead
from nirantar.schemas.summaries import (
    BodyWeightGoalRead,
    DailySummaryRead,
    MealDailySummaryRead,
    NutrientTotalRead,
    NutritionSummaryRead,
    WorkoutActivityDayRead,
    WorkoutActivityQuery,
    WorkoutActivityRead,
    WorkoutDailySummaryRead,
)
from nirantar.schemas.weights import WeightRead


class DailySummaryService:
    """Calculate deterministic facts for one local calendar date."""

    def __init__(
        self,
        session: AsyncSession,
        owner_id: str,
        *,
        user_timezone: str | None = None,
    ) -> None:
        self.session = session
        self.owner_id = owner_id
        self.user_timezone = user_timezone or get_settings().user_timezone

    async def get_daily_summary(self, summary_date: date) -> DailySummaryRead:
        start_at, end_at = self._date_bounds(summary_date)
        workouts = await self._get_workouts(start_at, end_at)
        meals = await self._get_meals(start_at, end_at)
        weight = await self.session.scalar(
            select(BodyWeightEntry).where(
                BodyWeightEntry.owner_id == self.owner_id,
                BodyWeightEntry.measured_on == summary_date
            )
        )
        sleep = await self.session.scalar(
            select(SleepEntry).where(
                SleepEntry.owner_id == self.owner_id,
                SleepEntry.sleep_date == summary_date,
            )
        )
        targets = await self.session.get(UserTarget, self.owner_id)

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
                        targets.calorie_target_kcal if targets is not None else None,
                    ),
                    protein_g=self._nutrient_total(
                        food_items,
                        "protein_g",
                        targets.protein_target_g if targets is not None else None,
                    ),
                    carbohydrates_g=self._nutrient_total(
                        food_items,
                        "carbohydrates_g",
                        targets.carb_target_g if targets is not None else None,
                    ),
                    fat_g=self._nutrient_total(
                        food_items,
                        "fat_g",
                        targets.fat_target_g if targets is not None else None,
                    ),
                ),
            ),
            sleep=SleepRead.model_validate(sleep) if sleep is not None else None,
            body_weight=WeightRead.model_validate(weight) if weight is not None else None,
            body_weight_goal=(
                BodyWeightGoalRead(
                    goal_weight_kg=targets.goal_weight_kg,
                    weight_difference_from_goal_kg=weight.weight_kg - targets.goal_weight_kg,
                    is_at_goal=abs(weight.weight_kg - targets.goal_weight_kg) <= Decimal("0.3"),
                )
                if weight is not None
                and targets is not None
                and targets.goal_weight_kg is not None
                else None
            ),
        )

    async def get_workout_activity(
        self,
        query: WorkoutActivityQuery,
    ) -> WorkoutActivityRead:
        start_at, _ = self._date_bounds(query.start_date)
        _, end_at = self._date_bounds(query.end_date)
        local_day = cast(
            func.timezone(self.user_timezone, WorkoutSession.check_in_at),
            Date,
        )
        result = await self.session.execute(
            select(local_day.label("activity_date"), func.count())
            .where(
                WorkoutSession.owner_id == self.owner_id,
                WorkoutSession.check_in_at >= start_at,
                WorkoutSession.check_in_at < end_at,
            )
            .group_by(local_day)
            .order_by(local_day.asc())
        )
        days = [
            WorkoutActivityDayRead(date=activity_date, workout_count=int(count))
            for activity_date, count in result.all()
            if int(count) > 0
        ]
        return WorkoutActivityRead(
            start_date=query.start_date,
            end_date=query.end_date,
            timezone=self.user_timezone,
            active_day_count=len(days),
            days=days,
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
                WorkoutSession.owner_id == self.owner_id,
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
            .where(Meal.owner_id == self.owner_id)
            .options(selectinload(Meal.items))
            .order_by(Meal.eaten_at.asc(), Meal.id.asc())
        )
        return list(result.all())

    @staticmethod
    def _nutrient_total(
        items: list[FoodItem],
        field_name: str,
        target_value: Decimal | None = None,
    ) -> NutrientTotalRead:
        values = [getattr(item, field_name) for item in items]
        known_values = [value for value in values if value is not None]
        known_total = sum(known_values, start=Decimal("0")) if known_values else None
        return NutrientTotalRead(
            known_total=known_total,
            known_item_count=len(known_values),
            missing_item_count=len(values) - len(known_values),
            complete=len(known_values) == len(values),
            target_value=target_value,
            percentage_of_target=(
                known_total / target_value * Decimal("100")
                if known_total is not None and target_value is not None
                else None
            ),
        )
