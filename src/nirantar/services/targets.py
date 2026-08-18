from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from nirantar.models.targets import UserTarget
from nirantar.schemas.targets import TargetPatch, TargetRead, TargetResult
from nirantar.services.errors import ValidationDomainError


class TargetService:
    """Read and partially update one mutable target row per user."""

    def __init__(self, session: AsyncSession, owner_id: str) -> None:
        self.session = session
        self.owner_id = owner_id

    async def get_targets(self) -> TargetResult:
        target = await self.session.get(UserTarget, self.owner_id)
        return TargetResult(
            targets=TargetRead.model_validate(target) if target is not None else None
        )

    async def set_targets(self, payload: TargetPatch) -> TargetResult:
        result = await self.session.execute(
            select(UserTarget)
            .where(UserTarget.owner_id == self.owner_id)
            .with_for_update()
        )
        target = result.scalar_one_or_none()
        if target is None:
            target = UserTarget(owner_id=self.owner_id)
            self.session.add(target)
        for field_name in payload.model_fields_set:
            setattr(target, field_name, getattr(payload, field_name))
        target.updated_at = func.now()
        try:
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise ValidationDomainError("Targets could not be updated") from exc
        await self.session.refresh(target)
        return TargetResult(targets=TargetRead.model_validate(target))
