import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from nirantar.db.base import Base, TimestampMixin


class Meal(Base, TimestampMixin):
    __tablename__ = "meals"
    __table_args__ = (
        CheckConstraint("btrim(name) <> ''", name="name_not_blank"),
        Index("meals_owner_eaten_at_idx", "owner_id", text("eaten_at DESC")),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    owner_id: Mapped[str] = mapped_column(Text, nullable=False)
    eaten_at: Mapped[datetime] = mapped_column(nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    items: Mapped[list["FoodItem"]] = relationship(
        back_populates="meal",
        cascade="all, delete-orphan",
        order_by="FoodItem.item_order",
        lazy="selectin",
    )


class FoodItem(Base, TimestampMixin):
    __tablename__ = "food_items"
    __table_args__ = (
        CheckConstraint("item_order > 0", name="order_positive"),
        CheckConstraint("btrim(name) <> ''", name="name_not_blank"),
        CheckConstraint(
            "quantity IS NULL OR quantity >= 0",
            name="quantity_nonnegative",
        ),
        CheckConstraint(
            "calories_kcal IS NULL OR calories_kcal >= 0",
            name="calories_nonnegative",
        ),
        CheckConstraint(
            "protein_g IS NULL OR protein_g >= 0",
            name="protein_nonnegative",
        ),
        CheckConstraint(
            "carbohydrates_g IS NULL OR carbohydrates_g >= 0",
            name="carbohydrates_nonnegative",
        ),
        CheckConstraint("fat_g IS NULL OR fat_g >= 0", name="fat_nonnegative"),
        UniqueConstraint("meal_id", "item_order", name="meal_order_unique"),
        Index("food_items_meal_order_idx", "meal_id", "item_order"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    meal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("meals.id", ondelete="CASCADE"),
        nullable=False,
    )
    item_order: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    quantity: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 3))
    unit: Mapped[Optional[str]] = mapped_column(Text)
    calories_kcal: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    protein_g: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    carbohydrates_g: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    fat_g: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    notes: Mapped[Optional[str]] = mapped_column(Text)

    meal: Mapped[Meal] = relationship(back_populates="items")
