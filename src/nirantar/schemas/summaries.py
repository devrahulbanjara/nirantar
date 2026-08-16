from datetime import date
from decimal import Decimal

from pydantic import BaseModel

from nirantar.schemas.weights import WeightRead


class NutrientTotalRead(BaseModel):
    known_total: Decimal | None
    known_item_count: int
    missing_item_count: int
    complete: bool


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


class DailySummaryRead(BaseModel):
    date: date
    timezone: str
    workouts: WorkoutDailySummaryRead
    meals: MealDailySummaryRead
    body_weight: WeightRead | None
