from datetime import date

import pytest
from fastmcp import Client

from nirantar.mcp.server import mcp


def _mapping(value: object) -> dict:
    if isinstance(value, dict):
        return value.get("result", value)
    if hasattr(value, "model_dump"):
        dumped = value.model_dump(mode="json")
        if isinstance(dumped, dict):
            return dumped.get("result", dumped)
    if hasattr(value, "root"):
        root = value.root
        if isinstance(root, dict):
            return root
    raise AssertionError(f"Unexpected MCP payload type: {type(value)!r}")


@pytest.mark.asyncio
async def test_weight_mcp_tools() -> None:
    async with Client(mcp) as client:
        tools = await client.list_tools()
        names = {tool.name for tool in tools}
        assert {"log_weight", "get_weight", "get_weight_history", "edit_weight"} <= names

        created_result = await client.call_tool(
            "log_weight",
            {
                "weight": {
                    "weight_kg": "73",
                    "measured_on": "2026-08-16",
                    "notes": "AM",
                }
            },
        )
        created = _mapping(created_result.structured_content or created_result.data)

        exact_result = await client.call_tool(
            "get_weight",
            {"measured_on": "2026-08-16"},
        )
        exact = _mapping(exact_result.structured_content or exact_result.data)
        assert exact["entry"]["id"] == created["id"]

        edited_result = await client.call_tool(
            "edit_weight",
            {
                "measured_on": "2026-08-16",
                "edit": {
                    "expected_updated_at": created["updated_at"],
                    "weight_kg": "72.8",
                },
            },
        )
        edited = _mapping(edited_result.structured_content or edited_result.data)
        assert edited["weight_kg"] == "72.800"

        history_result = await client.call_tool(
            "get_weight_history",
            {"start_date": "2026-08-16", "end_date": "2026-08-20"},
        )
        history = _mapping(history_result.structured_content or history_result.data)
        assert history["measurement_count"] == 1
        assert history["entries"][0]["measured_on"] == date(2026, 8, 16).isoformat()
