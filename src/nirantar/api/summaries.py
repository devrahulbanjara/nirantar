from datetime import date
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from nirantar.auth import CurrentUserId
from nirantar.db.dependencies import DBSession
from nirantar.schemas.summaries import (
    DailySummaryRead,
    WorkoutActivityQuery,
    WorkoutActivityRead,
)
from nirantar.services.summaries import DailySummaryService

router = APIRouter(prefix="/summaries", tags=["summaries"])


@router.get("/daily/{summary_date}")
async def get_daily_summary(
    summary_date: date,
    db: DBSession,
    user_id: CurrentUserId,
) -> DailySummaryRead:
    return await DailySummaryService(db, user_id).get_daily_summary(summary_date)


@router.get("/workout-activity")
async def get_workout_activity(
    db: DBSession,
    user_id: CurrentUserId,
    start_date: Annotated[date, Query()],
    end_date: Annotated[date, Query()],
) -> WorkoutActivityRead:
    if end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="end_date must be on or after start_date",
        )
    if (end_date - start_date).days > 400:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="date range must be 400 days or fewer",
        )
    query = WorkoutActivityQuery(start_date=start_date, end_date=end_date)
    return await DailySummaryService(db, user_id).get_workout_activity(query)
