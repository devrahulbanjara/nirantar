from datetime import date
from decimal import Decimal

from pydantic import BaseModel, model_validator


class WorkoutTargetProgressRead(BaseModel):
    expected_workout_days: Decimal
    percentage_of_target: Decimal | None


class TrendsRead(BaseModel):
    start_date: date
    end_date: date
    average_daily_calories_kcal: Decimal | None
    average_daily_protein_g: Decimal | None
    calorie_target_percentage: Decimal | None
    weight_change_kg: Decimal | None
    workout_days_logged: int
    workout_target_progress: WorkoutTargetProgressRead | None
    average_sleep_hours: Decimal | None
    days_with_any_data: int


class TrendsQuery(BaseModel):
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def validate_range(self) -> "TrendsQuery":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class DailyStreakRead(BaseModel):
    current_streak_days: int
    longest_streak_days: int


class WorkoutConsistencyRead(BaseModel):
    days_since_last_workout: int | None
    workout_days_logged_this_week: int
    target_workout_days_per_week: int | None


class StreaksRead(BaseModel):
    as_of_date: date
    meals: DailyStreakRead
    sleep: DailyStreakRead
    weight: DailyStreakRead
    workouts: WorkoutConsistencyRead
