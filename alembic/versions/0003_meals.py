"""Add meals and ordered food items.

Revision ID: 0003_meals
Revises: 0002_body_weight_entries
Create Date: 2026-08-16 18:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003_meals"
down_revision: str | None = "0002_body_weight_entries"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "meals",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("eaten_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "btrim(name) <> ''",
            name=op.f("ck_meals_name_not_blank"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_meals")),
    )
    op.create_index(
        "meals_eaten_at_idx",
        "meals",
        [sa.text("eaten_at DESC")],
        unique=False,
    )

    op.create_table(
        "food_items",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("meal_id", sa.UUID(), nullable=False),
        sa.Column("item_order", sa.Integer(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("quantity", sa.Numeric(10, 3), nullable=True),
        sa.Column("unit", sa.Text(), nullable=True),
        sa.Column("calories_kcal", sa.Numeric(10, 2), nullable=True),
        sa.Column("protein_g", sa.Numeric(10, 2), nullable=True),
        sa.Column("carbohydrates_g", sa.Numeric(10, 2), nullable=True),
        sa.Column("fat_g", sa.Numeric(10, 2), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "item_order > 0",
            name=op.f("ck_food_items_order_positive"),
        ),
        sa.CheckConstraint(
            "btrim(name) <> ''",
            name=op.f("ck_food_items_name_not_blank"),
        ),
        sa.CheckConstraint(
            "quantity IS NULL OR quantity >= 0",
            name=op.f("ck_food_items_quantity_nonnegative"),
        ),
        sa.CheckConstraint(
            "calories_kcal IS NULL OR calories_kcal >= 0",
            name=op.f("ck_food_items_calories_nonnegative"),
        ),
        sa.CheckConstraint(
            "protein_g IS NULL OR protein_g >= 0",
            name=op.f("ck_food_items_protein_nonnegative"),
        ),
        sa.CheckConstraint(
            "carbohydrates_g IS NULL OR carbohydrates_g >= 0",
            name=op.f("ck_food_items_carbohydrates_nonnegative"),
        ),
        sa.CheckConstraint(
            "fat_g IS NULL OR fat_g >= 0",
            name=op.f("ck_food_items_fat_nonnegative"),
        ),
        sa.ForeignKeyConstraint(
            ["meal_id"],
            ["meals.id"],
            name=op.f("fk_food_items_meal_id_meals"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_food_items")),
        sa.UniqueConstraint(
            "meal_id",
            "item_order",
            name="meal_order_unique",
        ),
    )
    op.create_index(
        "food_items_meal_order_idx",
        "food_items",
        ["meal_id", "item_order"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("food_items_meal_order_idx", table_name="food_items")
    op.drop_table("food_items")
    op.drop_index("meals_eaten_at_idx", table_name="meals")
    op.drop_table("meals")
