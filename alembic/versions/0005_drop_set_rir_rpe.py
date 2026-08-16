"""Drop RIR and RPE from exercise sets.

Revision ID: 0005_drop_set_rir_rpe
Revises: 0004_user_ownership
Create Date: 2026-08-16 20:35:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005_drop_set_rir_rpe"
down_revision: str | None = "0004_user_ownership"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint(
        op.f("ck_exercise_sets_rir_range"),
        "exercise_sets",
        type_="check",
    )
    op.drop_constraint(
        op.f("ck_exercise_sets_rpe_range"),
        "exercise_sets",
        type_="check",
    )
    op.drop_column("exercise_sets", "rir")
    op.drop_column("exercise_sets", "rpe")


def downgrade() -> None:
    op.add_column(
        "exercise_sets",
        sa.Column("rpe", sa.Numeric(3, 1), nullable=True),
    )
    op.add_column(
        "exercise_sets",
        sa.Column("rir", sa.Numeric(3, 1), nullable=True),
    )
    op.create_check_constraint(
        op.f("ck_exercise_sets_rpe_range"),
        "exercise_sets",
        "rpe IS NULL OR (rpe >= 0 AND rpe <= 10)",
    )
    op.create_check_constraint(
        op.f("ck_exercise_sets_rir_range"),
        "exercise_sets",
        "rir IS NULL OR (rir >= 0 AND rir <= 10)",
    )
