from datetime import datetime
from uuid import uuid4

import pytest
from pydantic import ValidationError

from nirantar.schemas.meals import MealCreate, MealEditRequest


def test_meal_requires_aware_timestamp_nonblank_names_and_items() -> None:
    with pytest.raises(ValidationError):
        MealCreate(eaten_at=datetime(2026, 8, 16, 9), name="Breakfast", items=[])

    with pytest.raises(ValidationError):
        MealCreate.model_validate(
            {
                "eaten_at": "2026-08-16T09:00:00+05:45",
                "name": "Breakfast",
                "items": [{"name": "   "}],
            }
        )


def test_food_item_nutrition_cannot_be_negative() -> None:
    with pytest.raises(ValidationError):
        MealCreate.model_validate(
            {
                "eaten_at": "2026-08-16T09:00:00+05:45",
                "name": "Breakfast",
                "items": [{"name": "Egg", "protein_g": -1}],
            }
        )


def test_meal_edit_requires_aware_version_and_changed_operation() -> None:
    item_id = uuid4()
    with pytest.raises(ValidationError):
        MealEditRequest.model_validate(
            {
                "expected_updated_at": "2026-08-16T09:00:00",
                "operations": [
                    {"operation": "update_food_item", "item_id": str(item_id)}
                ],
            }
        )

    with pytest.raises(ValidationError):
        MealEditRequest.model_validate(
            {
                "expected_updated_at": "2026-08-16T09:00:00+05:45",
                "operations": [
                    {
                        "operation": "update_food_item",
                        "item_id": str(item_id),
                        "name": None,
                    }
                ],
            }
        )
