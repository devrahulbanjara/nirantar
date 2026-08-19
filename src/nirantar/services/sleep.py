from datetime import date
from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from nirantar.config import get_settings
from nirantar.models.sleep import SleepEntry
from nirantar.schemas.sleep import (
    SleepCreate,
    SleepEditRequest,
    SleepForDateResult,
    SleepHistoryQuery,
    SleepHistoryRead,
    SleepRead,
)
from nirantar.services.errors import (
    ConflictDomainError,
    NotFoundError,
    ValidationDomainError,
)


class SleepService:
    """Store complete sleep intervals and derive wake-date duration facts."""

    def __init__(
        self,
        session: AsyncSession,
        owner_id: str,
        *,
        user_timezone: str | None = None,
    ) -> None:
        self.session = session
        self.owner_id = owner_id
        self.user_timezone = user_timezone or get_settings().user_timezone

    def _derived(self, sleep_start, sleep_end) -> tuple[date, Decimal]:
        if sleep_end <= sleep_start:
            raise ValidationDomainError("sleep_end must be later than sleep_start")
        sleep_date = sleep_end.astimezone(ZoneInfo(self.user_timezone)).date()
        hours = (
            Decimal(str((sleep_end - sleep_start).total_seconds())) / Decimal(3600)
        ).quantize(Decimal("0.001"), rounding=ROUND_HALF_UP)
        return sleep_date, hours

    async def log_sleep(self, payload: SleepCreate) -> SleepRead:
        sleep_date, hours = self._derived(payload.sleep_start, payload.sleep_end)
        entry = SleepEntry(
            owner_id=self.owner_id,
            sleep_date=sleep_date,
            sleep_start=payload.sleep_start,
            sleep_end=payload.sleep_end,
            hours_slept=hours,
            quality_rating=payload.quality_rating,
            notes=payload.notes,
        )
        self.session.add(entry)
        try:
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise ValidationDomainError(
                f"Sleep is already logged for {sleep_date}; use edit_sleep instead"
            ) from exc
        await self.session.refresh(entry)
        return SleepRead.model_validate(entry)

    async def get_sleep(self, sleep_date: date) -> SleepForDateResult:
        entry = await self.session.scalar(
            select(SleepEntry).where(
                SleepEntry.owner_id == self.owner_id,
                SleepEntry.sleep_date == sleep_date,
            )
        )
        return SleepForDateResult(
            sleep_date=sleep_date,
            entry=SleepRead.model_validate(entry) if entry is not None else None,
        )

    async def get_sleep_history(self, query: SleepHistoryQuery) -> SleepHistoryRead:
        result = await self.session.scalars(
            select(SleepEntry)
            .where(
                SleepEntry.owner_id == self.owner_id,
                SleepEntry.sleep_date >= query.start_date,
                SleepEntry.sleep_date <= query.end_date,
            )
            .order_by(SleepEntry.sleep_date.desc())
        )
        return SleepHistoryRead(
            start_date=query.start_date,
            end_date=query.end_date,
            entries=[SleepRead.model_validate(item) for item in result.all()],
        )

    async def edit_sleep(self, sleep_id: UUID, payload: SleepEditRequest) -> SleepRead:
        result = await self.session.execute(
            select(SleepEntry)
            .where(SleepEntry.id == sleep_id, SleepEntry.owner_id == self.owner_id)
            .with_for_update()
        )
        entry = result.scalar_one_or_none()
        if entry is None:
            await self.session.rollback()
            raise NotFoundError(f"Sleep entry {sleep_id} was not found")
        if entry.updated_at != payload.expected_updated_at:
            await self.session.rollback()
            raise ConflictDomainError(
                "Sleep entry has changed since it was read; retrieve it again before editing"
            )

        for operation in payload.operations:
            for field_name in ("sleep_start", "sleep_end", "quality_rating", "notes"):
                if field_name in operation.model_fields_set:
                    setattr(entry, field_name, getattr(operation, field_name))
        entry.sleep_date, entry.hours_slept = self._derived(
            entry.sleep_start, entry.sleep_end
        )
        entry.updated_at = func.now()
        try:
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise ValidationDomainError(
                f"Sleep is already logged for {entry.sleep_date}"
            ) from exc
        await self.session.refresh(entry)
        return SleepRead.model_validate(entry)
