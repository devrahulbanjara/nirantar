from datetime import date, datetime
from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class SleepCreate(BaseModel):
    sleep_start: datetime
    sleep_end: datetime
    quality_rating: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = None

    @field_validator("sleep_start", "sleep_end")
    @classmethod
    def require_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            raise ValueError("Sleep timestamps must be timezone-aware")
        return value

    @model_validator(mode="after")
    def validate_times(self) -> "SleepCreate":
        if self.sleep_end <= self.sleep_start:
            raise ValueError("sleep_end must be later than sleep_start")
        return self


class UpdateSleepOperation(BaseModel):
    operation: Literal["update_sleep"]
    sleep_start: datetime | None = None
    sleep_end: datetime | None = None
    quality_rating: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_patch(self) -> "UpdateSleepOperation":
        changed = self.model_fields_set - {"operation"}
        if not changed:
            raise ValueError("update_sleep requires at least one changed field")
        for field_name in ("sleep_start", "sleep_end"):
            if field_name in changed:
                value = getattr(self, field_name)
                if value is None:
                    raise ValueError(f"{field_name} cannot be null")
                if value.tzinfo is None:
                    raise ValueError(f"{field_name} must be timezone-aware")
        return self


SleepEditOperation = Annotated[UpdateSleepOperation, Field(discriminator="operation")]


class SleepEditRequest(BaseModel):
    expected_updated_at: datetime
    operations: list[SleepEditOperation] = Field(min_length=1)

    @field_validator("expected_updated_at")
    @classmethod
    def require_expected_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            raise ValueError("expected_updated_at must be timezone-aware")
        return value


class SleepRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    sleep_date: date
    sleep_start: datetime
    sleep_end: datetime
    hours_slept: Decimal
    quality_rating: int | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class SleepForDateResult(BaseModel):
    sleep_date: date
    entry: SleepRead | None


class SleepHistoryQuery(BaseModel):
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def validate_range(self) -> "SleepHistoryQuery":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class SleepHistoryRead(BaseModel):
    start_date: date
    end_date: date
    entries: list[SleepRead]
