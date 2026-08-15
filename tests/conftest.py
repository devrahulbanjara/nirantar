from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from nirantar.db.session import dispose_engine, get_session_factory
from nirantar.main import app


@pytest.fixture(autouse=True)
async def clean_workout_tables() -> AsyncIterator[None]:
    factory = get_session_factory()
    async with factory() as session:
        await session.execute(
            text(
                """
                TRUNCATE TABLE
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
