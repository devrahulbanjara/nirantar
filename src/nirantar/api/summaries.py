from datetime import date

from fastapi import APIRouter

from nirantar.db.dependencies import DBSession
from nirantar.schemas.summaries import DailySummaryRead
from nirantar.services.summaries import DailySummaryService

router = APIRouter(prefix="/summaries", tags=["summaries"])


@router.get("/daily/{summary_date}")
async def get_daily_summary(
    summary_date: date,
    db: DBSession,
) -> DailySummaryRead:
    return await DailySummaryService(db).get_daily_summary(summary_date)
