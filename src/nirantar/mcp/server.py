from datetime import datetime

from fastmcp import FastMCP
from fastmcp.exceptions import ToolError

from nirantar.db.session import get_session_factory
from nirantar.schemas.workouts import (
    ExerciseHistoryEntry,
    ExerciseHistoryQuery,
    RecentWorkoutsQuery,
    WorkoutCreate,
    WorkoutRead,
)
from nirantar.services.errors import DomainError
from nirantar.services.workouts import WorkoutService

mcp = FastMCP(
    "Nirantar",
    instructions=(
        "Personal fitness data tools for logging and retrieving workouts. "
        "Use high-level tools only; do not invent SQL or bypass structured inputs."
    ),
)


def _tool_error(exc: DomainError) -> ToolError:
    return ToolError(exc.message)


@mcp.tool
async def log_workout(workout: WorkoutCreate) -> WorkoutRead:
    """Save a complete workout session, including exercises, sets, dropsets, and supersets."""
    factory = get_session_factory()
    async with factory() as session:
        service = WorkoutService(session)
        try:
            return await service.log_workout(workout)
        except DomainError as exc:
            raise _tool_error(exc) from exc


@mcp.tool
async def get_recent_workouts(
    limit: int = 10,
    before: datetime | None = None,
) -> list[WorkoutRead]:
    """Return recent workout sessions with ordered exercises and nested sets."""
    query = RecentWorkoutsQuery(limit=limit, before=before)
    factory = get_session_factory()
    async with factory() as session:
        service = WorkoutService(session)
        return await service.get_recent_workouts(query)


@mcp.tool
async def get_exercise_history(
    exercise_name: str,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
    limit: int = 20,
) -> list[ExerciseHistoryEntry]:
    """Return history for an exercise name with warm-ups, working sets, and dropsets distinguished."""
    query = ExerciseHistoryQuery(
        exercise_name=exercise_name,
        start_at=start_at,
        end_at=end_at,
        limit=limit,
    )
    factory = get_session_factory()
    async with factory() as session:
        service = WorkoutService(session)
        return await service.get_exercise_history(query)
