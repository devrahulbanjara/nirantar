from datetime import date, datetime
from uuid import UUID

from fastmcp import FastMCP
from fastmcp.exceptions import ToolError

from nirantar.db.session import get_session_factory
from nirantar.schemas.workouts import (
    ExerciseHistoryEntry,
    ExerciseHistoryQuery,
    RecentWorkoutsQuery,
    WorkoutCreate,
    WorkoutDeleteRequest,
    WorkoutDeleteResult,
    WorkoutEditRequest,
    WorkoutRead,
)
from nirantar.schemas.weights import (
    WeightCreate,
    WeightForDateResult,
    WeightHistoryQuery,
    WeightHistoryRead,
    WeightRead,
    WeightUpdate,
)
from nirantar.services.errors import DomainError
from nirantar.services.weights import WeightService
from nirantar.services.workouts import WorkoutService

mcp = FastMCP(
    "Nirantar",
    instructions=(
        "Personal fitness data tools for logging, retrieving, correcting, and deleting "
        "workouts and daily body weight. Read a record before changing it, use its "
        "updated_at value, and "
        "obtain explicit user confirmation before irreversible deletion. Use high-level "
        "tools only; do not invent SQL or bypass structured inputs."
    ),
)


def _tool_error(exc: DomainError) -> ToolError:
    return ToolError(exc.message)


@mcp.tool(
    annotations={
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": False,
    }
)
async def log_workout(workout: WorkoutCreate) -> WorkoutRead:
    """Save a complete workout session, including exercises, sets, dropsets, and supersets."""
    factory = get_session_factory()
    async with factory() as session:
        service = WorkoutService(session)
        try:
            return await service.log_workout(workout)
        except DomainError as exc:
            raise _tool_error(exc) from exc


@mcp.tool(
    annotations={
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
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


@mcp.tool(
    annotations={
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
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


@mcp.tool(
    annotations={
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
async def get_workout(workout_id: UUID) -> WorkoutRead:
    """Return one complete workout by its stable identifier."""
    factory = get_session_factory()
    async with factory() as session:
        service = WorkoutService(session)
        try:
            return await service.get_workout(workout_id)
        except DomainError as exc:
            raise _tool_error(exc) from exc


@mcp.tool(
    annotations={
        "readOnlyHint": False,
        "destructiveHint": True,
        "idempotentHint": False,
        "openWorldHint": False,
    }
)
async def edit_workout(
    workout_id: UUID,
    edit: WorkoutEditRequest,
) -> WorkoutRead:
    """Atomically correct a workout using stable exercise and set identifiers."""
    factory = get_session_factory()
    async with factory() as session:
        service = WorkoutService(session)
        try:
            return await service.edit_workout(workout_id, edit)
        except DomainError as exc:
            raise _tool_error(exc) from exc


@mcp.tool(
    annotations={
        "readOnlyHint": False,
        "destructiveHint": True,
        "idempotentHint": False,
        "openWorldHint": False,
    }
)
async def delete_workout(
    workout_id: UUID,
    deletion: WorkoutDeleteRequest,
) -> WorkoutDeleteResult:
    """Permanently delete a workout after exact-ID confirmation."""
    factory = get_session_factory()
    async with factory() as session:
        service = WorkoutService(session)
        try:
            return await service.delete_workout(workout_id, deletion)
        except DomainError as exc:
            raise _tool_error(exc) from exc


@mcp.tool(
    annotations={
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": False,
    }
)
async def log_weight(weight: WeightCreate) -> WeightRead:
    """Log one body-weight value for a date, defaulting to today in the user timezone."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            return await WeightService(session).log_weight(weight)
        except DomainError as exc:
            raise _tool_error(exc) from exc


@mcp.tool(
    annotations={
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
async def get_weight(measured_on: date) -> WeightForDateResult:
    """Return the body-weight entry for one calendar date, if present."""
    factory = get_session_factory()
    async with factory() as session:
        return await WeightService(session).get_weight(measured_on)


@mcp.tool(
    annotations={
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
async def get_weight_history(
    start_date: date,
    end_date: date,
) -> WeightHistoryRead:
    """Return ordered body weights and deterministic change for an inclusive date range."""
    query = WeightHistoryQuery(start_date=start_date, end_date=end_date)
    factory = get_session_factory()
    async with factory() as session:
        return await WeightService(session).get_weight_history(query)


@mcp.tool(
    annotations={
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": False,
    }
)
async def edit_weight(
    measured_on: date,
    edit: WeightUpdate,
) -> WeightRead:
    """Correct the body-weight value or notes for one date using stale-write protection."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            return await WeightService(session).edit_weight(measured_on, edit)
        except DomainError as exc:
            raise _tool_error(exc) from exc
