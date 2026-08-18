from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, Integer, Numeric, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from nirantar.db.base import Base


class UserTarget(Base):
    __tablename__ = "user_targets"
    __table_args__ = (
        CheckConstraint(
            "calorie_target_kcal IS NULL OR calorie_target_kcal > 0",
            name="calorie_target_positive",
        ),
        CheckConstraint(
            "protein_target_g IS NULL OR protein_target_g > 0",
            name="protein_target_positive",
        ),
        CheckConstraint(
            "carb_target_g IS NULL OR carb_target_g > 0",
            name="carb_target_positive",
        ),
        CheckConstraint(
            "fat_target_g IS NULL OR fat_target_g > 0",
            name="fat_target_positive",
        ),
        CheckConstraint(
            "goal_weight_kg IS NULL OR goal_weight_kg > 0",
            name="goal_weight_positive",
        ),
        CheckConstraint(
            "target_workout_days_per_week IS NULL OR "
            "target_workout_days_per_week BETWEEN 0 AND 7",
            name="workout_days_range",
        ),
    )

    owner_id: Mapped[str] = mapped_column(Text, primary_key=True)
    calorie_target_kcal: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    protein_target_g: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    carb_target_g: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    fat_target_g: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    goal_weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(7, 3))
    target_workout_days_per_week: Mapped[int | None] = mapped_column(Integer)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
