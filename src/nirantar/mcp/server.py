from datetime import date, datetime
from uuid import UUID

from fastmcp import FastMCP
from fastmcp.exceptions import ToolError
from fastmcp.server.auth import RemoteAuthProvider
from fastmcp.server.auth.providers.jwt import JWTVerifier
from fastmcp.server.dependencies import get_access_token

from nirantar.config import get_settings
from nirantar.db.session import get_session_factory
from nirantar.schemas.meals import (
    MealCreate,
    MealDeleteRequest,
    MealDeleteResult,
    MealEditRequest,
    MealHistoryQuery,
    MealHistoryRead,
    MealRead,
)
from nirantar.schemas.summaries import DailySummaryRead
from nirantar.schemas.workouts import (
    ExerciseHistoryEntry,
    ExerciseHistoryQuery,
    RecentWorkoutsQuery,
    WorkoutCreate,
    WorkoutDeleteRequest,
    WorkoutDeleteResult,
    WorkoutEditRequest,
    WorkoutHistoryQuery,
    WorkoutHistoryRead,
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
from nirantar.services.meals import MealService
from nirantar.services.summaries import DailySummaryService
from nirantar.services.weights import WeightService
from nirantar.services.workouts import WorkoutService

_settings = get_settings()
_issuer = (_settings.clerk_issuer_url or "https://clerk.invalid").rstrip("/")
_token_verifier = JWTVerifier(
    jwks_uri=f"{_issuer}/.well-known/jwks.json",
    issuer=_issuer,
    algorithm="RS256",
)
_auth = RemoteAuthProvider(
    token_verifier=_token_verifier,
    authorization_servers=[_issuer],
    base_url=_settings.mcp_base_url,
    scopes_supported=["openid", "profile", "email"],
    resource_name="Nirantar",
)
mcp_well_known_routes = _auth.get_well_known_routes(mcp_path="/")

mcp = FastMCP(
    "Nirantar",
    instructions=(
        "Log, retrieve, correct, and delete workouts, meals, and daily body-weight "
        "records. Read a record before editing or deleting it, pass its updated_at "
        "value, and obtain explicit confirmation before deletion."
    ),
    auth=_auth,
)


def _tool_error(exc: DomainError) -> ToolError:
    return ToolError(exc.message)


def _current_user_id() -> str:
    token = get_access_token()
    if token is None:
        raise ToolError("Authentication is required")
    subject = token.subject or token.claims.get("sub")
    if not isinstance(subject, str) or not subject:
        raise ToolError("Authentication subject is missing")
    return subject


@mcp.tool(
    annotations={
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
async def get_daily_summary(summary_date: date) -> DailySummaryRead:
    """Summarize workouts, meals, nutrition, and body weight for a local date."""
    factory = get_session_factory()
    async with factory() as session:
        return await DailySummaryService(session, _current_user_id()).get_daily_summary(
            summary_date
        )


@mcp.tool(
    annotations={
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": False,
    }
)
async def log_meal(meal: MealCreate) -> MealRead:
    """Log a meal with ordered food items in one transaction."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            return await MealService(session, _current_user_id()).log_meal(meal)
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
async def get_meals(
    start_date: date,
    end_date: date,
    limit: int = 100,
) -> MealHistoryRead:
    """List meals chronologically for an inclusive local-date range."""
    query = MealHistoryQuery(
        start_date=start_date,
        end_date=end_date,
        limit=limit,
    )
    factory = get_session_factory()
    async with factory() as session:
        return await MealService(session, _current_user_id()).get_meals(query)


@mcp.tool(
    annotations={
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
async def get_meal(meal_id: UUID) -> MealRead:
    """Get a meal and its ordered food items by ID."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            return await MealService(session, _current_user_id()).get_meal(meal_id)
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
async def edit_meal(meal_id: UUID, edit: MealEditRequest) -> MealRead:
    """Atomically edit a meal and its food items using stable IDs."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            return await MealService(session, _current_user_id()).edit_meal(meal_id, edit)
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
async def delete_meal(
    meal_id: UUID,
    deletion: MealDeleteRequest,
) -> MealDeleteResult:
    """Permanently delete a meal after exact-ID confirmation."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            return await MealService(session, _current_user_id()).delete_meal(
                meal_id, deletion
            )
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
async def log_workout(workout: WorkoutCreate) -> WorkoutRead:
    """Log a workout with exercises, sets, dropsets, and supersets."""
    factory = get_session_factory()
    async with factory() as session:
        service = WorkoutService(session, _current_user_id())
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
    """List recent workouts with ordered exercises and sets."""
    query = RecentWorkoutsQuery(limit=limit, before=before)
    factory = get_session_factory()
    async with factory() as session:
        service = WorkoutService(session, _current_user_id())
        return await service.get_recent_workouts(query)


@mcp.tool(
    annotations={
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
async def get_workouts(
    start_date: date,
    end_date: date,
    limit: int = 100,
) -> WorkoutHistoryRead:
    """List workouts for an inclusive local-date range."""
    query = WorkoutHistoryQuery(
        start_date=start_date,
        end_date=end_date,
        limit=limit,
    )
    factory = get_session_factory()
    async with factory() as session:
        return await WorkoutService(session, _current_user_id()).get_workouts(query)


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
    """Get an exercise's history with each set type distinguished."""
    query = ExerciseHistoryQuery(
        exercise_name=exercise_name,
        start_at=start_at,
        end_at=end_at,
        limit=limit,
    )
    factory = get_session_factory()
    async with factory() as session:
        service = WorkoutService(session, _current_user_id())
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
    """Get a complete workout by ID."""
    factory = get_session_factory()
    async with factory() as session:
        service = WorkoutService(session, _current_user_id())
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
    """Atomically edit a workout using stable exercise and set IDs."""
    factory = get_session_factory()
    async with factory() as session:
        service = WorkoutService(session, _current_user_id())
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
        service = WorkoutService(session, _current_user_id())
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
    """Log body weight for a date, defaulting to today locally."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            return await WeightService(session, _current_user_id()).log_weight(weight)
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
    """Get the body-weight entry for a date, if present."""
    factory = get_session_factory()
    async with factory() as session:
        return await WeightService(session, _current_user_id()).get_weight(measured_on)


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
    """List body weights and change for an inclusive date range."""
    query = WeightHistoryQuery(start_date=start_date, end_date=end_date)
    factory = get_session_factory()
    async with factory() as session:
        return await WeightService(session, _current_user_id()).get_weight_history(query)


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
    """Edit body weight or notes for one date."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            return await WeightService(session, _current_user_id()).edit_weight(
                measured_on, edit
            )
        except DomainError as exc:
            raise _tool_error(exc) from exc
