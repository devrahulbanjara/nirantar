from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class WeightCreate(BaseModel):
    weight_kg: Decimal = Field(gt=0)
    measured_on: date | None = None
    notes: str | None = None


class WeightUpdate(BaseModel):
    expected_updated_at: datetime
    weight_kg: Decimal | None = Field(default=None, gt=0)
    notes: str | None = None

    @field_validator("expected_updated_at")
    @classmethod
    def require_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            raise ValueError("expected_updated_at must be timezone-aware")
        return value

    @model_validator(mode="after")
    def require_change(self) -> "WeightUpdate":
        changed = self.model_fields_set - {"expected_updated_at"}
        if not changed:
            raise ValueError("edit_weight requires at least one changed field")
        if "weight_kg" in changed and self.weight_kg is None:
            raise ValueError("weight_kg cannot be null")
        return self


class WeightRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    measured_on: date
    weight_kg: Decimal
    notes: str | None
    created_at: datetime
    updated_at: datetime


class WeightForDateResult(BaseModel):
    measured_on: date
    entry: WeightRead | None


class WeightHistoryQuery(BaseModel):
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def validate_range(self) -> "WeightHistoryQuery":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class WeightHistoryRead(BaseModel):
    start_date: date
    end_date: date
    measurement_count: int
    first_weight_kg: Decimal | None
    last_weight_kg: Decimal | None
    change_kg: Decimal | None
    entries: list[WeightRead]
