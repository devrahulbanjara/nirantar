from datetime import date

import pytest
from fastmcp import Client

from nirantar.mcp.server import mcp
from nirantar.services.meals import MealService
from nirantar.services.workouts import WorkoutService
from tests.helpers import sample_meal, sample_workout
from tests.test_weight_mcp import _mapping


@pytest.mark.asyncio
async def test_daily_summary_mcp_tool(db_session) -> None:
    await WorkoutService(db_session).log_workout(sample_workout())
    await MealService(db_session).log_meal(sample_meal())

    async with Client(mcp) as client:
        tools = await client.list_tools()
        summary_tool = next(tool for tool in tools if tool.name == "get_daily_summary")
        assert summary_tool.description == (
            "Summarize workouts, meals, nutrition, and body weight for a local date."
        )
        assert summary_tool.annotations.readOnlyHint is True

        result = await client.call_tool(
            "get_daily_summary",
            {"summary_date": "2026-08-16"},
        )
        summary = _mapping(result.structured_content or result.data)

    assert summary["date"] == date(2026, 8, 16).isoformat()
    assert summary["workouts"]["physical_set_count"] == 7
    assert summary["meals"]["food_item_count"] == 3
    assert summary["meals"]["nutrition"]["protein_g"]["complete"] is False
