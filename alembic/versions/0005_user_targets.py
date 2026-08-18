"""Add one mutable targets row per user.

Revision ID: 0005_user_targets
Revises: 0004_user_ownership
Create Date: 2026-08-18 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005_user_targets"
down_revision: str | None = "0004_user_ownership"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_targets",
        sa.Column("owner_id", sa.Text(), nullable=False),
        sa.Column("calorie_target_kcal", sa.Numeric(10, 2), nullable=True),
        sa.Column("protein_target_g", sa.Numeric(10, 2), nullable=True),
        sa.Column("carb_target_g", sa.Numeric(10, 2), nullable=True),
        sa.Column("fat_target_g", sa.Numeric(10, 2), nullable=True),
        sa.Column("goal_weight_kg", sa.Numeric(7, 3), nullable=True),
        sa.Column("target_workout_days_per_week", sa.Integer(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "calorie_target_kcal IS NULL OR calorie_target_kcal > 0",
            name=op.f("ck_user_targets_calorie_target_positive"),
        ),
        sa.CheckConstraint(
            "protein_target_g IS NULL OR protein_target_g > 0",
            name=op.f("ck_user_targets_protein_target_positive"),
        ),
        sa.CheckConstraint(
            "carb_target_g IS NULL OR carb_target_g > 0",
            name=op.f("ck_user_targets_carb_target_positive"),
        ),
        sa.CheckConstraint(
            "fat_target_g IS NULL OR fat_target_g > 0",
            name=op.f("ck_user_targets_fat_target_positive"),
        ),
        sa.CheckConstraint(
            "goal_weight_kg IS NULL OR goal_weight_kg > 0",
            name=op.f("ck_user_targets_goal_weight_positive"),
        ),
        sa.CheckConstraint(
            "target_workout_days_per_week IS NULL OR target_workout_days_per_week BETWEEN 0 AND 7",
            name=op.f("ck_user_targets_workout_days_range"),
        ),
        sa.PrimaryKeyConstraint("owner_id", name="pk_user_targets"),
    )


def downgrade() -> None:
    op.drop_table("user_targets")
