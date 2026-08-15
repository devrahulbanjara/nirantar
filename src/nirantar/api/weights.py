from datetime import date
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from nirantar.db.dependencies import DBSession
from nirantar.schemas.weights import (
    WeightCreate,
    WeightForDateResult,
    WeightHistoryQuery,
    WeightHistoryRead,
    WeightRead,
    WeightUpdate,
)
from nirantar.services.errors import (
    ConflictDomainError,
    DomainError,
    NotFoundError,
    ValidationDomainError,
)
from nirantar.services.weights import WeightService

router = APIRouter(prefix="/weights", tags=["weights"])


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
async def log_weight(payload: WeightCreate, db: DBSession) -> WeightRead:
    try:
        return await WeightService(db).log_weight(payload)
    except DomainError as exc:
        raise _http_error(exc) from exc


@router.get("")
async def get_weight_history(
    db: DBSession,
    start_date: Annotated[date, Query()],
    end_date: Annotated[date, Query()],
) -> WeightHistoryRead:
    if end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="end_date must be on or after start_date",
        )
    query = WeightHistoryQuery(start_date=start_date, end_date=end_date)
    return await WeightService(db).get_weight_history(query)


@router.get("/{measured_on}")
async def get_weight(measured_on: date, db: DBSession) -> WeightForDateResult:
    return await WeightService(db).get_weight(measured_on)


@router.patch("/{measured_on}")
async def edit_weight(
    measured_on: date,
    payload: WeightUpdate,
    db: DBSession,
) -> WeightRead:
    try:
        return await WeightService(db).edit_weight(measured_on, payload)
    except DomainError as exc:
        raise _http_error(exc) from exc
