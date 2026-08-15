from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from nirantar.db.dependencies import DBSession
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
from nirantar.services.errors import (
    ConflictDomainError,
    DomainError,
    NotFoundError,
    ValidationDomainError,
)
from nirantar.services.workouts import WorkoutService

router = APIRouter(prefix="/workouts", tags=["workouts"])


def _http_error(exc: DomainError) -> HTTPException:
    if isinstance(exc, NotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(exc, ConflictDomainError):
        status_code = status.HTTP_409_CONFLICT
    elif isinstance(exc, ValidationDomainError):
        status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    else:
        status_code = status.HTTP_400_BAD_REQUEST
    return HTTPException(status_code=status_code, detail=exc.message)


@router.post("", status_code=status.HTTP_201_CREATED)
async def log_workout(payload: WorkoutCreate, db: DBSession) -> WorkoutRead:
    service = WorkoutService(db)
    try:
        return await service.log_workout(payload)
    except DomainError as exc:
        raise _http_error(exc) from exc


@router.get("/recent")
async def get_recent_workouts(
    db: DBSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
    before: Annotated[datetime | None, Query()] = None,
) -> list[WorkoutRead]:
    query = RecentWorkoutsQuery(limit=limit, before=before)
    service = WorkoutService(db)
    return await service.get_recent_workouts(query)


@router.get("/exercise-history")
async def get_exercise_history(
    db: DBSession,
    exercise_name: Annotated[str, Query(min_length=1)],
    start_at: Annotated[datetime | None, Query()] = None,
    end_at: Annotated[datetime | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> list[ExerciseHistoryEntry]:
    query = ExerciseHistoryQuery(
        exercise_name=exercise_name,
        start_at=start_at,
        end_at=end_at,
        limit=limit,
    )
    service = WorkoutService(db)
    return await service.get_exercise_history(query)


@router.get("/{workout_id}")
async def get_workout(workout_id: UUID, db: DBSession) -> WorkoutRead:
    service = WorkoutService(db)
    try:
        return await service.get_workout(workout_id)
    except DomainError as exc:
        raise _http_error(exc) from exc


@router.patch("/{workout_id}")
async def edit_workout(
    workout_id: UUID,
    payload: WorkoutEditRequest,
    db: DBSession,
) -> WorkoutRead:
    service = WorkoutService(db)
    try:
        return await service.edit_workout(workout_id, payload)
    except DomainError as exc:
        raise _http_error(exc) from exc


@router.delete("/{workout_id}")
async def delete_workout(
    workout_id: UUID,
    payload: WorkoutDeleteRequest,
    db: DBSession,
) -> WorkoutDeleteResult:
    service = WorkoutService(db)
    try:
        return await service.delete_workout(workout_id, payload)
    except DomainError as exc:
        raise _http_error(exc) from exc
