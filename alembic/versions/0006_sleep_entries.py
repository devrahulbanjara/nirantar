"""Add one derived sleep entry per user wake date.

Revision ID: 0006_sleep_entries
Revises: 0005_user_targets
Create Date: 2026-08-18 00:10:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0006_sleep_entries"
down_revision: str | None = "0005_user_targets"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "sleep_entries",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("owner_id", sa.Text(), nullable=False),
        sa.Column("sleep_date", sa.Date(), nullable=False),
        sa.Column("sleep_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sleep_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("hours_slept", sa.Numeric(7, 3), nullable=False),
        sa.Column("quality_rating", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "sleep_end > sleep_start", name=op.f("ck_sleep_entries_end_after_start")
        ),
        sa.CheckConstraint(
            "hours_slept > 0", name=op.f("ck_sleep_entries_hours_positive")
        ),
        sa.CheckConstraint(
            "quality_rating IS NULL OR quality_rating BETWEEN 1 AND 5",
            name=op.f("ck_sleep_entries_quality_range"),
        ),
        sa.PrimaryKeyConstraint("id", name="pk_sleep_entries"),
        sa.UniqueConstraint(
            "owner_id", "sleep_date", name="uq_sleep_entries_owner_sleep_date_unique"
        ),
    )
    op.create_index(
        "sleep_entries_owner_date_idx",
        "sleep_entries",
        ["owner_id", sa.text("sleep_date DESC")],
    )


def downgrade() -> None:
    op.drop_index("sleep_entries_owner_date_idx", table_name="sleep_entries")
    op.drop_table("sleep_entries")
