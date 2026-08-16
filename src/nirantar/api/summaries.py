from datetime import date

from fastapi import APIRouter

from nirantar.auth import CurrentUserId
from nirantar.db.dependencies import DBSession
from nirantar.schemas.summaries import DailySummaryRead
from nirantar.services.summaries import DailySummaryService

router = APIRouter(prefix="/summaries", tags=["summaries"])


@router.get("/daily/{summary_date}")
async def get_daily_summary(
    summary_date: date,
    db: DBSession,
    user_id: CurrentUserId,
) -> DailySummaryRead:
    return await DailySummaryService(db, user_id).get_daily_summary(summary_date)
