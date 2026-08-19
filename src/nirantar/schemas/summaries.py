from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator

from nirantar.schemas.sleep import SleepRead
from nirantar.schemas.weights import WeightRead


class NutrientTotalRead(BaseModel):
    known_total: Decimal | None
    known_item_count: int
    missing_item_count: int
    complete: bool
    target_value: Decimal | None = None
    percentage_of_target: Decimal | None = None


class NutritionSummaryRead(BaseModel):
    calories_kcal: NutrientTotalRead
    protein_g: NutrientTotalRead
    carbohydrates_g: NutrientTotalRead
    fat_g: NutrientTotalRead


class WorkoutDailySummaryRead(BaseModel):
    workout_count: int
    completed_workout_count: int
    open_workout_count: int
    gym_duration_seconds: int
    working_set_count: int
    dropset_count: int
    physical_set_count: int


class MealDailySummaryRead(BaseModel):
    meal_count: int
    food_item_count: int
    nutrition: NutritionSummaryRead


class BodyWeightGoalRead(BaseModel):
    goal_weight_kg: Decimal
    weight_difference_from_goal_kg: Decimal
    is_at_goal: bool


class DailySummaryRead(BaseModel):
    date: date
    timezone: str
    workouts: WorkoutDailySummaryRead
    meals: MealDailySummaryRead
    sleep: SleepRead | None
    body_weight: WeightRead | None
    body_weight_goal: BodyWeightGoalRead | None


class WorkoutActivityQuery(BaseModel):
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def validate_range(self) -> "WorkoutActivityQuery":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        if (self.end_date - self.start_date).days > 400:
            raise ValueError("date range must be 400 days or fewer")
        return self


class WorkoutActivityDayRead(BaseModel):
    date: date
    workout_count: int = Field(ge=0)


class WorkoutActivityRead(BaseModel):
    start_date: date
    end_date: date
    timezone: str
    active_day_count: int
    days: list[WorkoutActivityDayRead]
