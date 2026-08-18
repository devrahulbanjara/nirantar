from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from nirantar.auth import CurrentUserId
from nirantar.db.dependencies import DBSession
from nirantar.schemas.sleep import (
    SleepCreate,
    SleepEditRequest,
    SleepForDateResult,
    SleepHistoryQuery,
    SleepHistoryRead,
    SleepRead,
)
from nirantar.services.errors import ConflictDomainError, DomainError, NotFoundError
from nirantar.services.sleep import SleepService

router = APIRouter(prefix="/sleep", tags=["sleep"])


def _http_error(exc: DomainError) -> HTTPException:
    if isinstance(exc, NotFoundError):
        code = status.HTTP_404_NOT_FOUND
    elif isinstance(exc, ConflictDomainError):
        code = status.HTTP_409_CONFLICT
    else:
        code = status.HTTP_422_UNPROCESSABLE_CONTENT
    return HTTPException(status_code=code, detail=exc.message)


@router.post("", status_code=status.HTTP_201_CREATED)
async def log_sleep(
    payload: SleepCreate, db: DBSession, user_id: CurrentUserId
) -> SleepRead:
    try:
        return await SleepService(db, user_id).log_sleep(payload)
    except DomainError as exc:
        raise _http_error(exc) from exc


@router.get("")
async def get_sleep_history(
    db: DBSession,
    user_id: CurrentUserId,
    start_date: Annotated[date, Query()],
    end_date: Annotated[date, Query()],
) -> SleepHistoryRead:
    if end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="end_date must be on or after start_date",
        )
    query = SleepHistoryQuery(start_date=start_date, end_date=end_date)
    return await SleepService(db, user_id).get_sleep_history(query)


@router.get("/{sleep_date}")
async def get_sleep(
    sleep_date: date, db: DBSession, user_id: CurrentUserId
) -> SleepForDateResult:
    return await SleepService(db, user_id).get_sleep(sleep_date)


@router.patch("/{sleep_id}")
async def edit_sleep(
    sleep_id: UUID,
    payload: SleepEditRequest,
    db: DBSession,
    user_id: CurrentUserId,
) -> SleepRead:
    try:
        return await SleepService(db, user_id).edit_sleep(sleep_id, payload)
    except DomainError as exc:
        raise _http_error(exc) from exc
