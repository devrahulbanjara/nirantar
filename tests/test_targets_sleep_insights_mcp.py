from fastmcp import Client

from nirantar.mcp.server import mcp
from tests.test_weight_mcp import _mapping


async def test_targets_sleep_trends_and_streak_tools() -> None:
    async with Client(mcp) as client:
        names = {tool.name for tool in await client.list_tools()}
        assert {
            "get_targets",
            "set_targets",
            "log_sleep",
            "get_sleep",
            "get_sleep_history",
            "edit_sleep",
            "get_trends",
            "get_streaks",
        } <= names

        target_result = await client.call_tool(
            "set_targets", {"targets": {"calorie_target_kcal": "2000"}}
        )
        targets = _mapping(target_result.structured_content or target_result.data)
        assert targets["targets"]["calorie_target_kcal"] == "2000.00"

        sleep_result = await client.call_tool(
            "log_sleep",
            {
                "sleep": {
                    "sleep_start": "2026-08-16T22:00:00+05:45",
                    "sleep_end": "2026-08-17T06:00:00+05:45",
                }
            },
        )
        sleep = _mapping(sleep_result.structured_content or sleep_result.data)
        assert sleep["sleep_date"] == "2026-08-17"

        trends_result = await client.call_tool(
            "get_trends", {"start_date": "2026-08-16", "end_date": "2026-08-22"}
        )
        trends = _mapping(trends_result.structured_content or trends_result.data)
        assert trends["average_sleep_hours"] == "8.00"

        streak_result = await client.call_tool("get_streaks", {})
        streaks = _mapping(streak_result.structured_content or streak_result.data)
        assert "workouts" in streaks
