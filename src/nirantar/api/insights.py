from fastapi import APIRouter

from nirantar.auth import CurrentUserId
from nirantar.db.dependencies import DBSession
from nirantar.schemas.insights import StreaksRead
from nirantar.services.insights import InsightService

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/streaks")
async def get_streaks(db: DBSession, user_id: CurrentUserId) -> StreaksRead:
    return await InsightService(db, user_id).get_streaks()
