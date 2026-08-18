from datetime import date
from decimal import Decimal

from pydantic import BaseModel

from nirantar.schemas.weights import WeightRead
from nirantar.schemas.sleep import SleepRead


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
