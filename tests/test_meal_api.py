import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_meal_api_create_read_list_edit_and_delete(api_client: AsyncClient) -> None:
    created_response = await api_client.post(
        "/meals",
        json={
            "eaten_at": "2026-08-16T09:10:00+05:45",
            "name": "Breakfast",
            "items": [
                {"name": "Egg", "quantity": "3", "unit": "piece"},
                {"name": "Bread", "quantity": "2", "unit": "slice"},
            ],
        },
    )
    assert created_response.status_code == 201
    created = created_response.json()

    exact = await api_client.get(f"/meals/{created['id']}")
    assert exact.status_code == 200
    assert exact.json()["items"][0]["name"] == "Egg"

    history = await api_client.get(
        "/meals",
        params={"start_date": "2026-08-16", "end_date": "2026-08-16"},
    )
    assert history.status_code == 200
    assert history.json()["meal_count"] == 1

    edited = await api_client.patch(
        f"/meals/{created['id']}",
        json={
            "expected_updated_at": created["updated_at"],
            "operations": [
                {"operation": "update_meal", "name": "Brunch"},
                {
                    "operation": "update_food_item",
                    "item_id": created["items"][0]["id"],
                    "protein_g": "18",
                },
            ],
        },
    )
    assert edited.status_code == 200
    edited_meal = edited.json()
    assert edited_meal["name"] == "Brunch"
    assert edited_meal["items"][0]["protein_g"] == "18.00"

    stale = await api_client.patch(
        f"/meals/{created['id']}",
        json={
            "expected_updated_at": created["updated_at"],
            "operations": [{"operation": "update_meal", "notes": "stale"}],
        },
    )
    assert stale.status_code == 409

    wrong_confirmation = await api_client.request(
        "DELETE",
        f"/meals/{created['id']}",
        json={
            "expected_updated_at": edited_meal["updated_at"],
            "confirmation": "DELETE wrong",
        },
    )
    assert wrong_confirmation.status_code == 422

    deleted = await api_client.request(
        "DELETE",
        f"/meals/{created['id']}",
        json={
            "expected_updated_at": edited_meal["updated_at"],
            "confirmation": f"DELETE {created['id']}",
        },
    )
    assert deleted.status_code == 200
    assert deleted.json()["deleted"] is True
