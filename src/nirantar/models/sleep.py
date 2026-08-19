import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Date,
    Index,
    Integer,
    Numeric,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from nirantar.db.base import Base, TimestampMixin


class SleepEntry(Base, TimestampMixin):
    __tablename__ = "sleep_entries"
    __table_args__ = (
        CheckConstraint("sleep_end > sleep_start", name="end_after_start"),
        CheckConstraint("hours_slept > 0", name="hours_positive"),
        CheckConstraint(
            "quality_rating IS NULL OR quality_rating BETWEEN 1 AND 5",
            name="quality_range",
        ),
        UniqueConstraint(
            "owner_id", "sleep_date", name="uq_sleep_entries_owner_sleep_date_unique"
        ),
        Index("sleep_entries_owner_date_idx", "owner_id", text("sleep_date DESC")),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    owner_id: Mapped[str] = mapped_column(Text, nullable=False)
    sleep_date: Mapped[date] = mapped_column(Date, nullable=False)
    sleep_start: Mapped[datetime] = mapped_column(nullable=False)
    sleep_end: Mapped[datetime] = mapped_column(nullable=False)
    hours_slept: Mapped[Decimal] = mapped_column(Numeric(7, 3), nullable=False)
    quality_rating: Mapped[int | None] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text)
