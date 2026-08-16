from collections.abc import Callable
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from nirantar.config import get_settings
from nirantar.models.weights import BodyWeightEntry
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
    NotFoundError,
    ValidationDomainError,
)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class WeightService:
    """Shared daily body-weight operations for FastAPI and MCP."""

    def __init__(
        self,
        session: AsyncSession,
        owner_id: str,
        *,
        user_timezone: str | None = None,
        clock: Callable[[], datetime] = _utc_now,
    ) -> None:
        self.session = session
        self.owner_id = owner_id
        self.user_timezone = user_timezone or get_settings().user_timezone
        self.clock = clock

    def today(self) -> date:
        now = self.clock()
        if now.tzinfo is None:
            raise RuntimeError("WeightService clock must return a timezone-aware datetime")
        return now.astimezone(ZoneInfo(self.user_timezone)).date()

    async def log_weight(self, payload: WeightCreate) -> WeightRead:
        measured_on = payload.measured_on or self.today()
        entry = BodyWeightEntry(
            owner_id=self.owner_id,
            measured_on=measured_on,
            weight_kg=payload.weight_kg,
            notes=payload.notes,
        )
        self.session.add(entry)
        try:
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise ValidationDomainError(
                f"Weight is already logged for {measured_on}; use edit_weight instead"
            ) from exc
        await self.session.refresh(entry)
        return WeightRead.model_validate(entry)

    async def get_weight(self, measured_on: date) -> WeightForDateResult:
        entry = await self.session.scalar(
            select(BodyWeightEntry).where(
                BodyWeightEntry.owner_id == self.owner_id,
                BodyWeightEntry.measured_on == measured_on,
            )
        )
        return WeightForDateResult(
            measured_on=measured_on,
            entry=WeightRead.model_validate(entry) if entry is not None else None,
        )

    async def get_weight_history(
        self,
        query: WeightHistoryQuery,
    ) -> WeightHistoryRead:
        result = await self.session.scalars(
            select(BodyWeightEntry)
            .where(
                BodyWeightEntry.owner_id == self.owner_id,
                BodyWeightEntry.measured_on >= query.start_date,
                BodyWeightEntry.measured_on <= query.end_date,
            )
            .order_by(BodyWeightEntry.measured_on.asc())
        )
        entries = [WeightRead.model_validate(item) for item in result.all()]
        first = entries[0].weight_kg if entries else None
        last = entries[-1].weight_kg if entries else None
        return WeightHistoryRead(
            start_date=query.start_date,
            end_date=query.end_date,
            measurement_count=len(entries),
            first_weight_kg=first,
            last_weight_kg=last,
            change_kg=last - first if first is not None and last is not None else None,
            entries=entries,
        )

    async def edit_weight(
        self,
        measured_on: date,
        payload: WeightUpdate,
    ) -> WeightRead:
        result = await self.session.execute(
            select(BodyWeightEntry)
            .where(
                BodyWeightEntry.owner_id == self.owner_id,
                BodyWeightEntry.measured_on == measured_on,
            )
            .with_for_update()
        )
        entry = result.scalar_one_or_none()
        if entry is None:
            await self.session.rollback()
            raise NotFoundError(f"No weight is logged for {measured_on}")
        if entry.updated_at != payload.expected_updated_at:
            await self.session.rollback()
            raise ConflictDomainError(
                "Weight entry has changed since it was read; retrieve it again before editing"
            )

        if "weight_kg" in payload.model_fields_set:
            entry.weight_kg = payload.weight_kg
        if "notes" in payload.model_fields_set:
            entry.notes = payload.notes
        entry.updated_at = func.now()
        try:
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise ValidationDomainError("Weight entry could not be updated") from exc
        await self.session.refresh(entry)
        return WeightRead.model_validate(entry)
