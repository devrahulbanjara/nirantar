"""Merge targets/sleep and RIR/RPE migration branches.

Revision ID: 0007_merge_targets_rir_heads
Revises: 0005_drop_set_rir_rpe, 0006_sleep_entries
Create Date: 2026-08-19 00:00:00.000000
"""

from collections.abc import Sequence

revision: str = "0007_merge_targets_rir_heads"
down_revision: tuple[str, str] = (
    "0005_drop_set_rir_rpe",
    "0006_sleep_entries",
)
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
