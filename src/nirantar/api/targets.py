from fastapi import APIRouter, HTTPException, status

from nirantar.auth import CurrentUserId
from nirantar.db.dependencies import DBSession
from nirantar.schemas.targets import TargetPatch, TargetResult
from nirantar.services.errors import ValidationDomainError
from nirantar.services.targets import TargetService

router = APIRouter(prefix="/targets", tags=["targets"])


@router.get("")
async def get_targets(db: DBSession, user_id: CurrentUserId) -> TargetResult:
    return await TargetService(db, user_id).get_targets()


@router.patch("")
async def set_targets(
    payload: TargetPatch, db: DBSession, user_id: CurrentUserId
) -> TargetResult:
    try:
        return await TargetService(db, user_id).set_targets(payload)
    except ValidationDomainError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=exc.message,
        ) from exc
