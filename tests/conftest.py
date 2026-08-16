from collections.abc import AsyncIterator, Iterator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from fastmcp.server.auth import AccessToken

from nirantar.auth import require_user
from nirantar.db.session import dispose_engine, get_session_factory
from nirantar.main import app
import nirantar.mcp.server as mcp_server
from tests.helpers import TEST_USER_ID


@pytest.fixture(autouse=True)
def authenticated_test_user(monkeypatch) -> Iterator[None]:
    app.dependency_overrides[require_user] = lambda: TEST_USER_ID
    monkeypatch.setattr(
        mcp_server,
        "get_access_token",
        lambda: AccessToken(
            token="test-token",
            client_id="test-client",
            scopes=["openid"],
            claims={"sub": TEST_USER_ID},
        ),
    )
    try:
        yield
    finally:
        app.dependency_overrides.pop(require_user, None)


@pytest.fixture(autouse=True)
async def clean_workout_tables() -> AsyncIterator[None]:
    factory = get_session_factory()
    async with factory() as session:
        await session.execute(
            text(
                """
                TRUNCATE TABLE
                    food_items,
                    meals,
                    body_weight_entries,
                    exercise_group_members,
                    exercise_groups,
                    exercise_sets,
                    workout_exercises,
                    workout_sessions
                RESTART IDENTITY CASCADE
                """
            )
        )
        await session.commit()
    try:
        yield
    finally:
        factory = get_session_factory()
        async with factory() as session:
            await session.execute(
                text(
                    """
                    TRUNCATE TABLE
                        food_items,
                        meals,
                        body_weight_entries,
                        exercise_group_members,
                        exercise_groups,
                        exercise_sets,
                        workout_exercises,
                        workout_sessions
                    RESTART IDENTITY CASCADE
                    """
                )
            )
            await session.commit()
        await dispose_engine()


@pytest.fixture
async def db_session() -> AsyncIterator:
    factory = get_session_factory()
    async with factory() as session:
        yield session


@pytest.fixture
async def api_client() -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
