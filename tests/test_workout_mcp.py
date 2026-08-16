import pytest
from fastmcp import Client

from nirantar.mcp.server import mcp
from tests.helpers import sample_workout


def _as_mapping(value: object) -> dict:
    if isinstance(value, dict):
        if "result" in value and isinstance(value["result"], dict):
            return value["result"]
        return value
    if hasattr(value, "model_dump"):
        dumped = value.model_dump(mode="json")
        if isinstance(dumped, dict):
            if "result" in dumped and isinstance(dumped["result"], dict):
                return dumped["result"]
            return dumped
        if hasattr(value, "root"):
            root = value.root
            if hasattr(root, "model_dump"):
                return root.model_dump(mode="json")
            if isinstance(root, dict):
                return root
    if hasattr(value, "root"):
        root = value.root
        if hasattr(root, "model_dump"):
            return root.model_dump(mode="json")
        if isinstance(root, dict):
            return root
    raise AssertionError(f"Unexpected MCP payload type: {type(value)!r}")


def _as_list(value: object) -> list:
    if isinstance(value, list):
        return value
    if isinstance(value, dict) and isinstance(value.get("result"), list):
        return value["result"]
    if hasattr(value, "root") and isinstance(value.root, list):
        return value.root
    if hasattr(value, "model_dump"):
        dumped = value.model_dump(mode="json")
        if isinstance(dumped, list):
            return dumped
        if isinstance(dumped, dict) and isinstance(dumped.get("result"), list):
            return dumped["result"]
    raise AssertionError(f"Unexpected MCP list payload type: {type(value)!r}")


@pytest.mark.asyncio
async def test_mcp_tools_log_and_retrieve_workout() -> None:
    payload = sample_workout().model_dump(mode="json")

    async with Client(mcp) as client:
        tools = await client.list_tools()
        names = {tool.name for tool in tools}
        assert {
            "log_workout",
            "get_recent_workouts",
            "get_workouts",
            "get_exercise_history",
            "get_workout",
            "edit_workout",
            "delete_workout",
        } <= names

        created_result = await client.call_tool("log_workout", {"workout": payload})
        created = _as_mapping(created_result.structured_content or created_result.data)
        assert created["title"] == "Arms"
        assert created["working_set_count"] == 4
        assert created["dropset_count"] == 2

        recent_result = await client.call_tool("get_recent_workouts", {"limit": 5})
        recent = _as_list(recent_result.structured_content or recent_result.data)
        assert len(recent) == 1
        assert recent[0]["id"] == created["id"]

        range_result = await client.call_tool(
            "get_workouts",
            {"start_date": "2026-08-16", "end_date": "2026-08-16"},
        )
        ranged = _as_mapping(range_result.structured_content or range_result.data)
        assert ranged["workout_count"] == 1
        assert ranged["workouts"][0]["id"] == created["id"]

        history_result = await client.call_tool(
            "get_exercise_history",
            {"exercise_name": "Bicep Curl"},
        )
        history = _as_list(history_result.structured_content or history_result.data)
        assert history[0]["exercise_name"] == "Bicep Curl"
        assert len(history[0]["sets"][-1]["dropsets"]) == 2

        fetched_result = await client.call_tool(
            "get_workout",
            {"workout_id": created["id"]},
        )
        fetched = _as_mapping(fetched_result.structured_content or fetched_result.data)
        assert fetched["id"] == created["id"]

        edited_result = await client.call_tool(
            "edit_workout",
            {
                "workout_id": created["id"],
                "edit": {
                    "expected_updated_at": created["updated_at"],
                    "operations": [
                        {"operation": "update_workout", "title": "MCP edit"}
                    ],
                },
            },
        )
        edited = _as_mapping(edited_result.structured_content or edited_result.data)
        assert edited["title"] == "MCP edit"

        deleted_result = await client.call_tool(
            "delete_workout",
            {
                "workout_id": created["id"],
                "deletion": {
                    "expected_updated_at": edited["updated_at"],
                    "confirmation": f"DELETE {created['id']}",
                },
            },
        )
        deleted = _as_mapping(deleted_result.structured_content or deleted_result.data)
        assert deleted == {"workout_id": created["id"], "deleted": True}
