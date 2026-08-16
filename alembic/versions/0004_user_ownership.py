"""Scope fitness records to a Clerk user.

Revision ID: 0004_user_ownership
Revises: 0003_meals
Create Date: 2026-08-16 22:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004_user_ownership"
down_revision: str | None = "0003_meals"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

def _add_owner(table_name: str) -> None:
    op.add_column(
        table_name,
        sa.Column("owner_id", sa.Text(), nullable=False),
    )


def upgrade() -> None:
    _add_owner("workout_sessions")
    _add_owner("meals")
    _add_owner("body_weight_entries")

    op.drop_index("workout_sessions_check_in_at_idx", table_name="workout_sessions")
    op.create_index(
        "workout_sessions_owner_check_in_idx",
        "workout_sessions",
        ["owner_id", sa.text("check_in_at DESC")],
    )

    op.drop_index("meals_eaten_at_idx", table_name="meals")
    op.create_index(
        "meals_owner_eaten_at_idx",
        "meals",
        ["owner_id", sa.text("eaten_at DESC")],
    )

    op.drop_index(
        "body_weight_entries_measured_on_idx",
        table_name="body_weight_entries",
    )
    op.drop_constraint(
        "uq_body_weight_entries_measured_on",
        "body_weight_entries",
        type_="unique",
    )
    op.create_unique_constraint(
        "uq_body_weight_entries_owner_measured_on_unique",
        "body_weight_entries",
        ["owner_id", "measured_on"],
    )
    op.create_index(
        "body_weight_entries_owner_measured_on_idx",
        "body_weight_entries",
        ["owner_id", sa.text("measured_on DESC")],
    )


def downgrade() -> None:
    op.drop_index(
        "body_weight_entries_owner_measured_on_idx",
        table_name="body_weight_entries",
    )
    op.drop_constraint(
        "uq_body_weight_entries_owner_measured_on_unique",
        "body_weight_entries",
        type_="unique",
    )
    op.create_unique_constraint(
        "uq_body_weight_entries_measured_on",
        "body_weight_entries",
        ["measured_on"],
    )
    op.create_index(
        "body_weight_entries_measured_on_idx",
        "body_weight_entries",
        [sa.text("measured_on DESC")],
    )

    op.drop_index("meals_owner_eaten_at_idx", table_name="meals")
    op.create_index("meals_eaten_at_idx", "meals", [sa.text("eaten_at DESC")])
    op.drop_index("workout_sessions_owner_check_in_idx", table_name="workout_sessions")
    op.create_index(
        "workout_sessions_check_in_at_idx",
        "workout_sessions",
        [sa.text("check_in_at DESC")],
    )

    op.drop_column("body_weight_entries", "owner_id")
    op.drop_column("meals", "owner_id")
    op.drop_column("workout_sessions", "owner_id")
