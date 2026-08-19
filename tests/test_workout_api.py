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
        "/workouts",
        params={"start_date": "2026-08-16", "end_date": "2026-08-16"},
    )
    assert history_response.status_code == 200
    history = history_response.json()
    assert history["workout_count"] == 1
    assert history["workouts"][0]["id"] == created["id"]

    invalid_range = await api_client.get(
        "/workouts",
        params={"start_date": "2026-08-17", "end_date": "2026-08-16"},
    )
    assert invalid_range.status_code == 422

    exercise_history_response = await api_client.get(
        "/workouts/exercise-history",
        params={"exercise_name": "Bicep Curl"},
    )
    assert exercise_history_response.status_code == 200
    exercise_history = exercise_history_response.json()
    assert exercise_history[0]["exercise_name"] == "Bicep Curl"
    assert len(exercise_history[0]["sets"][-1]["dropsets"]) == 2


@pytest.mark.asyncio
async def test_api_rejects_invalid_workout(api_client: AsyncClient) -> None:
    payload = sample_workout().model_dump(mode="json")
    payload["check_out_at"] = datetime(2026, 8, 16, 6, 0, tzinfo=NEPAL).isoformat()
    response = await api_client.post("/workouts", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_api_get_edit_and_delete_workout(api_client: AsyncClient) -> None:
    created = (
        await api_client.post(
            "/workouts",
            json=sample_workout().model_dump(mode="json"),
        )
    ).json()

    fetched = await api_client.get(f"/workouts/{created['id']}")
    assert fetched.status_code == 200

    edited = await api_client.patch(
        f"/workouts/{created['id']}",
        json={
            "expected_updated_at": created["updated_at"],
            "operations": [{"operation": "update_workout", "title": "API edit"}],
        },
    )
    assert edited.status_code == 200
    edited_payload = edited.json()
    assert edited_payload["title"] == "API edit"

    stale = await api_client.patch(
        f"/workouts/{created['id']}",
        json={
            "expected_updated_at": created["updated_at"],
            "operations": [{"operation": "update_workout", "notes": "stale"}],
        },
    )
    assert stale.status_code == 409

    deleted = await api_client.request(
        "DELETE",
        f"/workouts/{created['id']}",
        json={
            "expected_updated_at": edited_payload["updated_at"],
            "confirmation": f"DELETE {created['id']}",
        },
    )
    assert deleted.status_code == 200
    assert deleted.json() == {"workout_id": created["id"], "deleted": True}
    assert (await api_client.get(f"/workouts/{created['id']}")).status_code == 404
