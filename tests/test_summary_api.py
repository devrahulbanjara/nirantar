from datetime import date

import pytest
from httpx import AsyncClient

from nirantar.schemas.weights import WeightCreate
from nirantar.services.meals import MealService
from nirantar.services.weights import WeightService
from nirantar.services.workouts import WorkoutService
from tests.helpers import sample_meal, sample_workout


@pytest.mark.asyncio
async def test_daily_summary_api(api_client: AsyncClient, db_session) -> None:
    await WorkoutService(db_session).log_workout(sample_workout())
    await MealService(db_session).log_meal(sample_meal())
    await WeightService(db_session).log_weight(
        WeightCreate(weight_kg="73", measured_on=date(2026, 8, 16))
    )

    response = await api_client.get("/summaries/daily/2026-08-16")

    assert response.status_code == 200
    summary = response.json()
    assert summary["date"] == "2026-08-16"
    assert summary["workouts"]["working_set_count"] == 4
    assert summary["meals"]["nutrition"]["calories_kcal"] == {
        "known_total": "210.00",
        "known_item_count": 1,
        "missing_item_count": 2,
        "complete": False,
    }
    assert summary["body_weight"]["weight_kg"] == "73.000"


@pytest.mark.asyncio
async def test_daily_summary_api_rejects_invalid_date(api_client: AsyncClient) -> None:
    response = await api_client.get("/summaries/daily/not-a-date")
    assert response.status_code == 422
