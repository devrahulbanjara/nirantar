from datetime import date, datetime, timedelta, timezone

import pytest

from nirantar.schemas.meals import (
    MealDeleteRequest,
    MealEditRequest,
    MealHistoryQuery,
)
from nirantar.services.errors import (
    ConflictDomainError,
    NotFoundError,
    ValidationDomainError,
)
from nirantar.services.meals import MealService
from tests.helpers import NEPAL, TEST_USER_ID, sample_meal


@pytest.mark.asyncio
async def test_log_and_get_meal_preserves_order_and_unknown_nutrition(db_session) -> None:
    service = MealService(db_session, TEST_USER_ID)
    created = await service.log_meal(sample_meal())

    assert [item.order for item in created.items] == [1, 2, 3]
    assert created.items[0].protein_g == 18
    assert created.items[1].calories_kcal is None

    exact = await service.get_meal(created.id)
    assert exact == created


@pytest.mark.asyncio
async def test_get_meals_uses_kathmandu_calendar_boundaries(db_session) -> None:
    service = MealService(db_session, TEST_USER_ID)
    await service.log_meal(
        sample_meal(eaten_at=datetime(2026, 8, 15, 18, 20, tzinfo=timezone.utc))
    )
    await service.log_meal(
        sample_meal(eaten_at=datetime(2026, 8, 16, 18, 20, tzinfo=timezone.utc))
    )

    history = await service.get_meals(
        MealHistoryQuery(start_date=date(2026, 8, 16), end_date=date(2026, 8, 16))
    )

    assert history.meal_count == 1
    assert history.meals[0].eaten_at.astimezone(NEPAL).date() == date(2026, 8, 16)


@pytest.mark.asyncio
async def test_edit_meal_updates_fields_and_items_atomically(db_session) -> None:
    service = MealService(db_session, TEST_USER_ID)
    created = await service.log_meal(sample_meal())
    egg, bread, banana = created.items
    edited = await service.edit_meal(
        created.id,
        MealEditRequest.model_validate(
            {
                "expected_updated_at": created.updated_at,
                "operations": [
                    {"operation": "update_meal", "name": "Brunch", "notes": None},
                    {
                        "operation": "update_food_item",
                        "item_id": str(egg.id),
                        "order": 2,
                        "protein_g": "19",
                    },
                    {
                        "operation": "update_food_item",
                        "item_id": str(bread.id),
                        "order": 1,
                        "calories_kcal": "160",
                    },
                    {"operation": "remove_food_item", "item_id": str(banana.id)},
                    {
                        "operation": "add_food_item",
                        "order": 3,
                        "item": {"name": "Milk", "quantity": "250", "unit": "ml"},
                    },
                ],
            }
        ),
    )

    assert edited.name == "Brunch"
    assert edited.notes is None
    assert [item.name for item in edited.items] == ["Bread", "Egg", "Milk"]
    assert edited.items[0].calories_kcal == 160
    assert edited.items[1].protein_g == 19

    with pytest.raises(ConflictDomainError):
        await service.edit_meal(
            created.id,
            MealEditRequest.model_validate(
                {
                    "expected_updated_at": created.updated_at,
                    "operations": [{"operation": "update_meal", "notes": "stale"}],
                }
            ),
        )


@pytest.mark.asyncio
async def test_invalid_edit_rolls_back_and_meal_cannot_be_empty(db_session) -> None:
    service = MealService(db_session, TEST_USER_ID)
    created = await service.log_meal(sample_meal())

    with pytest.raises(ValidationDomainError):
        await service.edit_meal(
            created.id,
            MealEditRequest.model_validate(
                {
                    "expected_updated_at": created.updated_at,
                    "operations": [
                        {
                            "operation": "update_food_item",
                            "item_id": str(created.items[0].id),
                            "order": 2,
                        }
                    ],
                }
            ),
        )
    unchanged = await service.get_meal(created.id)
    assert [item.order for item in unchanged.items] == [1, 2, 3]

    single = await service.log_meal(
        sample_meal().model_copy(update={"items": [sample_meal().items[0]]})
    )
    with pytest.raises(ValidationDomainError):
        await service.edit_meal(
            single.id,
            MealEditRequest.model_validate(
                {
                    "expected_updated_at": single.updated_at,
                    "operations": [
                        {
                            "operation": "remove_food_item",
                            "item_id": str(single.items[0].id),
                        }
                    ],
                }
            ),
        )


@pytest.mark.asyncio
async def test_delete_meal_requires_confirmation_and_cascades(db_session) -> None:
    service = MealService(db_session, TEST_USER_ID)
    created = await service.log_meal(sample_meal())

    with pytest.raises(ValidationDomainError):
        await service.delete_meal(
            created.id,
            MealDeleteRequest(
                expected_updated_at=created.updated_at,
                confirmation="DELETE wrong",
            ),
        )

    result = await service.delete_meal(
        created.id,
        MealDeleteRequest(
            expected_updated_at=created.updated_at,
            confirmation=f"DELETE {created.id}",
        ),
    )
    assert result.deleted is True
    with pytest.raises(NotFoundError):
        await service.get_meal(created.id)
