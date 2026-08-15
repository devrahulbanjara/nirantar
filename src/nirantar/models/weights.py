import uuid
from datetime import date
from decimal import Decimal
from typing import Optional

from sqlalchemy import CheckConstraint, Date, Index, Numeric, Text, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from nirantar.db.base import Base, TimestampMixin


class BodyWeightEntry(Base, TimestampMixin):
    __tablename__ = "body_weight_entries"
    __table_args__ = (
        CheckConstraint("weight_kg > 0", name="weight_positive"),
        Index("body_weight_entries_measured_on_idx", text("measured_on DESC")),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    measured_on: Mapped[date] = mapped_column(Date, nullable=False, unique=True)
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(7, 3), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
