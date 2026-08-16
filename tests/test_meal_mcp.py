import pytest
from fastmcp import Client

from nirantar.mcp.server import mcp
from tests.test_weight_mcp import _mapping


@pytest.mark.asyncio
async def test_meal_mcp_tools() -> None:
    async with Client(mcp) as client:
        tools = await client.list_tools()
        names = {tool.name for tool in tools}
        assert {
            "log_meal",
            "get_meal",
            "get_meals",
            "edit_meal",
            "delete_meal",
        } <= names

        created_result = await client.call_tool(
            "log_meal",
            {
                "meal": {
                    "eaten_at": "2026-08-16T09:10:00+05:45",
                    "name": "Breakfast",
                    "items": [{"name": "Egg", "quantity": "3", "unit": "piece"}],
                }
            },
        )
        created = _mapping(created_result.structured_content or created_result.data)

        edited_result = await client.call_tool(
            "edit_meal",
            {
                "meal_id": created["id"],
                "edit": {
                    "expected_updated_at": created["updated_at"],
                    "operations": [
                        {"operation": "update_meal", "name": "Brunch"},
                        {
                            "operation": "add_food_item",
                            "order": 2,
                            "item": {"name": "Banana", "quantity": "1", "unit": "piece"},
                        },
                    ],
                },
            },
        )
        edited = _mapping(edited_result.structured_content or edited_result.data)
        assert edited["name"] == "Brunch"
        assert [item["name"] for item in edited["items"]] == ["Egg", "Banana"]

        history_result = await client.call_tool(
            "get_meals",
            {"start_date": "2026-08-16", "end_date": "2026-08-16"},
        )
        history = _mapping(history_result.structured_content or history_result.data)
        assert history["meal_count"] == 1

        deleted_result = await client.call_tool(
            "delete_meal",
            {
                "meal_id": created["id"],
                "deletion": {
                    "expected_updated_at": edited["updated_at"],
                    "confirmation": f"DELETE {created['id']}",
                },
            },
        )
        deleted = _mapping(deleted_result.structured_content or deleted_result.data)
        assert deleted["deleted"] is True
