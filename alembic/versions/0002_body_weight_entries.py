"""Add daily body weight entries.

Revision ID: 0002_body_weight_entries
Revises: 0001_workout_schema
Create Date: 2026-08-16 12:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_body_weight_entries"
down_revision: str | None = "0001_workout_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "body_weight_entries",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("measured_on", sa.Date(), nullable=False),
        sa.Column("weight_kg", sa.Numeric(7, 3), nullable=False),
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
            "weight_kg > 0",
            name=op.f("ck_body_weight_entries_weight_positive"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_body_weight_entries")),
        sa.UniqueConstraint(
            "measured_on",
            name=op.f("uq_body_weight_entries_measured_on"),
        ),
    )
    op.create_index(
        "body_weight_entries_measured_on_idx",
        "body_weight_entries",
        [sa.text("measured_on DESC")],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "body_weight_entries_measured_on_idx",
        table_name="body_weight_entries",
    )
    op.drop_table("body_weight_entries")
