from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from nirantar.db.dependencies import DBSession
from nirantar.schemas.meals import (
    MealCreate,
    MealDeleteRequest,
    MealDeleteResult,
    MealEditRequest,
    MealHistoryQuery,
    MealHistoryRead,
    MealRead,
)
from nirantar.services.errors import (
    ConflictDomainError,
    DomainError,
    NotFoundError,
    ValidationDomainError,
)
from nirantar.services.meals import MealService

router = APIRouter(prefix="/meals", tags=["meals"])


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
async def log_meal(payload: MealCreate, db: DBSession) -> MealRead:
    try:
        return await MealService(db).log_meal(payload)
    except DomainError as exc:
        raise _http_error(exc) from exc


@router.get("")
async def get_meals(
    db: DBSession,
    start_date: Annotated[date, Query()],
    end_date: Annotated[date, Query()],
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
) -> MealHistoryRead:
    if end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="end_date must be on or after start_date",
        )
    query = MealHistoryQuery(
        start_date=start_date,
        end_date=end_date,
        limit=limit,
    )
    return await MealService(db).get_meals(query)


@router.get("/{meal_id}")
async def get_meal(meal_id: UUID, db: DBSession) -> MealRead:
    try:
        return await MealService(db).get_meal(meal_id)
    except DomainError as exc:
        raise _http_error(exc) from exc


@router.patch("/{meal_id}")
async def edit_meal(
    meal_id: UUID,
    payload: MealEditRequest,
    db: DBSession,
) -> MealRead:
    try:
        return await MealService(db).edit_meal(meal_id, payload)
    except DomainError as exc:
        raise _http_error(exc) from exc


@router.delete("/{meal_id}")
async def delete_meal(
    meal_id: UUID,
    payload: MealDeleteRequest,
    db: DBSession,
) -> MealDeleteResult:
    try:
        return await MealService(db).delete_meal(meal_id, payload)
    except DomainError as exc:
        raise _http_error(exc) from exc
