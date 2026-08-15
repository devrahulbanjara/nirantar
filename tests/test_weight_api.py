from datetime import date

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_weight_api_log_read_history_and_edit(api_client: AsyncClient) -> None:
    created_response = await api_client.post(
        "/weights",
        json={"weight_kg": "73", "measured_on": "2026-08-16", "notes": "AM"},
    )
    assert created_response.status_code == 201
    created = created_response.json()

    exact = await api_client.get("/weights/2026-08-16")
    assert exact.status_code == 200
    assert exact.json()["entry"]["id"] == created["id"]

    history = await api_client.get(
        "/weights",
        params={"start_date": "2026-08-16", "end_date": "2026-08-20"},
    )
    assert history.status_code == 200
    assert history.json()["measurement_count"] == 1

    edited = await api_client.patch(
        "/weights/2026-08-16",
        json={"expected_updated_at": created["updated_at"], "weight_kg": "72.8"},
    )
    assert edited.status_code == 200
    assert edited.json()["weight_kg"] == "72.800"

    stale = await api_client.patch(
        "/weights/2026-08-16",
        json={"expected_updated_at": created["updated_at"], "notes": "stale"},
    )
    assert stale.status_code == 409

    missing = await api_client.get(f"/weights/{date(2026, 8, 17).isoformat()}")
    assert missing.status_code == 200
    assert missing.json()["entry"] is None

    invalid_range = await api_client.get(
        "/weights",
        params={"start_date": "2026-08-20", "end_date": "2026-08-16"},
    )
    assert invalid_range.status_code == 422
