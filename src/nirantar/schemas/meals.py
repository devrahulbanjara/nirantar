from datetime import date, datetime
from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class FoodItemCreate(BaseModel):
    name: str
    quantity: Decimal | None = Field(default=None, ge=0)
    unit: str | None = None
    calories_kcal: Decimal | None = Field(default=None, ge=0)
    protein_g: Decimal | None = Field(default=None, ge=0)
    carbohydrates_g: Decimal | None = Field(default=None, ge=0)
    fat_g: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Food item name cannot be blank")
        return value.strip()


class MealCreate(BaseModel):
    eaten_at: datetime
    name: str
    notes: str | None = None
    items: list[FoodItemCreate] = Field(min_length=1)

    @field_validator("eaten_at")
    @classmethod
    def require_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            raise ValueError("eaten_at must be timezone-aware")
        return value

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Meal name cannot be blank")
        return value.strip()


class UpdateMealOperation(BaseModel):
    operation: Literal["update_meal"]
    eaten_at: datetime | None = None
    name: str | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def validate_patch(self) -> "UpdateMealOperation":
        changed = self.model_fields_set - {"operation"}
        if not changed:
            raise ValueError("update_meal requires at least one changed field")
        if "eaten_at" in changed:
            if self.eaten_at is None:
                raise ValueError("eaten_at cannot be null")
            if self.eaten_at.tzinfo is None:
                raise ValueError("eaten_at must be timezone-aware")
        if "name" in changed and (self.name is None or not self.name.strip()):
            raise ValueError("Meal name cannot be null or blank")
        return self


class AddFoodItemOperation(BaseModel):
    operation: Literal["add_food_item"]
    order: int = Field(gt=0)
    item: FoodItemCreate


class UpdateFoodItemOperation(BaseModel):
    operation: Literal["update_food_item"]
    item_id: UUID
    order: int | None = Field(default=None, gt=0)
    name: str | None = None
    quantity: Decimal | None = Field(default=None, ge=0)
    unit: str | None = None
    calories_kcal: Decimal | None = Field(default=None, ge=0)
    protein_g: Decimal | None = Field(default=None, ge=0)
    carbohydrates_g: Decimal | None = Field(default=None, ge=0)
    fat_g: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_patch(self) -> "UpdateFoodItemOperation":
        changed = self.model_fields_set - {"operation", "item_id"}
        if not changed:
            raise ValueError("update_food_item requires at least one changed field")
        if "order" in changed and self.order is None:
            raise ValueError("Food item order cannot be null")
        if "name" in changed and (self.name is None or not self.name.strip()):
            raise ValueError("Food item name cannot be null or blank")
        return self


class RemoveFoodItemOperation(BaseModel):
    operation: Literal["remove_food_item"]
    item_id: UUID


MealEditOperation = Annotated[
    UpdateMealOperation
    | AddFoodItemOperation
    | UpdateFoodItemOperation
    | RemoveFoodItemOperation,
    Field(discriminator="operation"),
]


class MealEditRequest(BaseModel):
    expected_updated_at: datetime
    operations: list[MealEditOperation] = Field(min_length=1)

    @field_validator("expected_updated_at")
    @classmethod
    def require_expected_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            raise ValueError("expected_updated_at must be timezone-aware")
        return value


class MealDeleteRequest(BaseModel):
    expected_updated_at: datetime
    confirmation: str

    @field_validator("expected_updated_at")
    @classmethod
    def require_expected_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            raise ValueError("expected_updated_at must be timezone-aware")
        return value


class MealDeleteResult(BaseModel):
    meal_id: UUID
    deleted: Literal[True] = True


class FoodItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order: int
    name: str
    quantity: Decimal | None
    unit: str | None
    calories_kcal: Decimal | None
    protein_g: Decimal | None
    carbohydrates_g: Decimal | None
    fat_g: Decimal | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class MealRead(BaseModel):
    id: UUID
    eaten_at: datetime
    name: str
    notes: str | None
    items: list[FoodItemRead]
    created_at: datetime
    updated_at: datetime


class MealHistoryQuery(BaseModel):
    start_date: date
    end_date: date
    limit: int = Field(default=100, ge=1, le=200)

    @model_validator(mode="after")
    def validate_range(self) -> "MealHistoryQuery":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class MealHistoryRead(BaseModel):
    start_date: date
    end_date: date
    meal_count: int
    meals: list[MealRead]
