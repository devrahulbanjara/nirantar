from datetime import datetime

import pytest
from httpx import AsyncClient

from tests.helpers import NEPAL, sample_workout


@pytest.mark.asyncio
async def test_api_log_and_retrieve_workout(api_client: AsyncClient) -> None:
    payload = sample_workout().model_dump(mode="json")
    create_response = await api_client.post("/workouts", json=payload)
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["title"] == "Arms"
    assert created["working_set_count"] == 4
    assert created["dropset_count"] == 2
    assert created["exercises"][0]["sets"][-1]["dropsets"][0]["reps"] == 6

    recent_response = await api_client.get("/workouts/recent", params={"limit": 5})
    assert recent_response.status_code == 200
    recent = recent_response.json()
    assert len(recent) == 1
    assert recent[0]["id"] == created["id"]

    history_response = await api_client.get(
        "/workouts/exercise-history",
        params={"exercise_name": "Bicep Curl"},
    )
    assert history_response.status_code == 200
    history = history_response.json()
    assert history[0]["exercise_name"] == "Bicep Curl"
    assert len(history[0]["sets"][-1]["dropsets"]) == 2


@pytest.mark.asyncio
async def test_api_rejects_invalid_workout(api_client: AsyncClient) -> None:
    payload = sample_workout().model_dump(mode="json")
    payload["check_out_at"] = datetime(2026, 8, 16, 6, 0, tzinfo=NEPAL).isoformat()
    response = await api_client.post("/workouts", json=payload)
    assert response.status_code == 422
