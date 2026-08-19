from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TargetPatch(BaseModel):
    calorie_target_kcal: Decimal | None = Field(default=None, gt=0)
    protein_target_g: Decimal | None = Field(default=None, gt=0)
    carb_target_g: Decimal | None = Field(default=None, gt=0)
    fat_target_g: Decimal | None = Field(default=None, gt=0)
    goal_weight_kg: Decimal | None = Field(default=None, gt=0)
    target_workout_days_per_week: int | None = Field(default=None, ge=0, le=7)

    @model_validator(mode="after")
    def require_change(self) -> "TargetPatch":
        if not self.model_fields_set:
            raise ValueError("set_targets requires at least one target field")
        return self


class TargetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    calorie_target_kcal: Decimal | None
    protein_target_g: Decimal | None
    carb_target_g: Decimal | None
    fat_target_g: Decimal | None
    goal_weight_kg: Decimal | None
    target_workout_days_per_week: int | None
    updated_at: datetime


class TargetResult(BaseModel):
    targets: TargetRead | None
