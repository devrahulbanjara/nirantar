from datetime import date
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from starlette.requests import Request

import nirantar.auth as auth_module
from nirantar.auth import require_user
from nirantar.config import Settings
from nirantar.schemas.meals import MealHistoryQuery
from nirantar.schemas.weights import WeightCreate, WeightHistoryQuery
from nirantar.schemas.workouts import RecentWorkoutsQuery
from nirantar.services.errors import NotFoundError
from nirantar.services.meals import MealService
from nirantar.services.weights import WeightService
from nirantar.services.workouts import WorkoutService
from tests.helpers import sample_meal, sample_workout


def _request() -> Request:
    return Request({"type": "http", "method": "GET", "path": "/workouts"})


def test_api_auth_uses_verified_clerk_subject(monkeypatch) -> None:
    settings = Settings(
        DATABASE_URL="postgresql://test:test@localhost/test",
        CLERK_SECRET_KEY="sk_test_placeholder",
    )
    monkeypatch.setattr(auth_module, "get_settings", lambda: settings)
    monkeypatch.setattr(
        auth_module,
        "authenticate_request",
        lambda *_args, **_kwargs: SimpleNamespace(
            is_signed_in=True,
            payload={"sub": "user_verified"},
        ),
    )

    assert require_user(_request()) == "user_verified"


def test_api_auth_rejects_unsigned_requests(monkeypatch) -> None:
    settings = Settings(
        DATABASE_URL="postgresql://test:test@localhost/test",
        CLERK_SECRET_KEY="sk_test_placeholder",
    )
    monkeypatch.setattr(auth_module, "get_settings", lambda: settings)
    monkeypatch.setattr(
        auth_module,
        "authenticate_request",
        lambda *_args, **_kwargs: SimpleNamespace(
            is_signed_in=False,
            payload=None,
        ),
    )

    with pytest.raises(HTTPException) as exc_info:
        require_user(_request())
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_fitness_history_is_scoped_to_the_verified_user(db_session) -> None:
    owner = "user_owner"
    friend = "user_friend"

    workout = await WorkoutService(db_session, owner).log_workout(sample_workout())
    meal = await MealService(db_session, owner).log_meal(sample_meal())
    await WeightService(db_session, owner).log_weight(
        WeightCreate(measured_on=date(2026, 8, 16), weight_kg="74.2")
    )

    assert await WorkoutService(db_session, friend).get_recent_workouts(
        RecentWorkoutsQuery()
    ) == []
    assert (
        await MealService(db_session, friend).get_meals(
            MealHistoryQuery(
                start_date=date(2026, 8, 16),
                end_date=date(2026, 8, 16),
            )
        )
    ).meal_count == 0
    assert (
        await WeightService(db_session, friend).get_weight_history(
            WeightHistoryQuery(
                start_date=date(2026, 8, 16),
                end_date=date(2026, 8, 16),
            )
        )
    ).measurement_count == 0

    with pytest.raises(NotFoundError):
        await WorkoutService(db_session, friend).get_workout(workout.id)
    with pytest.raises(NotFoundError):
        await MealService(db_session, friend).get_meal(meal.id)


@pytest.mark.asyncio
async def test_each_user_can_log_weight_on_the_same_date(db_session) -> None:
    measured_on = date(2026, 8, 16)
    await WeightService(db_session, "user_one").log_weight(
        WeightCreate(measured_on=measured_on, weight_kg="74.2")
    )
    await WeightService(db_session, "user_two").log_weight(
        WeightCreate(measured_on=measured_on, weight_kg="81.5")
    )

    one = await WeightService(db_session, "user_one").get_weight(measured_on)
    two = await WeightService(db_session, "user_two").get_weight(measured_on)
    assert one.entry is not None and str(one.entry.weight_kg) == "74.200"
    assert two.entry is not None and str(two.entry.weight_kg) == "81.500"


@pytest.mark.asyncio
async def test_mcp_oauth_discovery_is_public(api_client) -> None:
    response = await api_client.get("/.well-known/oauth-protected-resource/mcp/")

    assert response.status_code == 200
    metadata = response.json()
    assert metadata["resource"].endswith("/mcp/")
    assert metadata["authorization_servers"]
