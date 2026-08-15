"""Create workout session schema.

Revision ID: 0001_workout_schema
Revises:
Create Date: 2026-08-15 23:45:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001_workout_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

exercise_set_type = postgresql.ENUM(
    "warmup",
    "working",
    "dropset",
    name="exercise_set_type",
    create_type=False,
)


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    exercise_set_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "workout_sessions",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("check_in_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("check_out_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("title", sa.Text(), nullable=True),
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
            "check_out_at IS NULL OR check_out_at > check_in_at",
            name=op.f("ck_workout_sessions_valid_time"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_workout_sessions")),
    )
    op.create_index(
        "workout_sessions_check_in_at_idx",
        "workout_sessions",
        [sa.text("check_in_at DESC")],
        unique=False,
    )

    op.create_table(
        "workout_exercises",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("workout_session_id", sa.UUID(), nullable=False),
        sa.Column("exercise_name", sa.Text(), nullable=False),
        sa.Column("exercise_order", sa.Integer(), nullable=False),
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
            "btrim(exercise_name) <> ''",
            name=op.f("ck_workout_exercises_name_not_blank"),
        ),
        sa.CheckConstraint(
            "exercise_order > 0",
            name=op.f("ck_workout_exercises_order_positive"),
        ),
        sa.ForeignKeyConstraint(
            ["workout_session_id"],
            ["workout_sessions.id"],
            name=op.f("fk_workout_exercises_workout_session_id_workout_sessions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_workout_exercises")),
        sa.UniqueConstraint(
            "workout_session_id",
            "exercise_order",
            name="workout_exercises_session_order_unique",
        ),
    )
    op.create_index(
        "workout_exercises_session_order_idx",
        "workout_exercises",
        ["workout_session_id", "exercise_order"],
        unique=False,
    )
    op.create_index(
        "workout_exercises_name_history_idx",
        "workout_exercises",
        [sa.text("lower(exercise_name)"), "workout_session_id"],
        unique=False,
    )

    op.create_table(
        "exercise_groups",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("workout_session_id", sa.UUID(), nullable=False),
        sa.Column(
            "group_type",
            sa.Text(),
            server_default="superset",
            nullable=False,
        ),
        sa.Column("group_order", sa.Integer(), nullable=False),
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
            "group_type IN ('superset')",
            name=op.f("ck_exercise_groups_type_valid"),
        ),
        sa.CheckConstraint(
            "group_order > 0",
            name=op.f("ck_exercise_groups_order_positive"),
        ),
        sa.ForeignKeyConstraint(
            ["workout_session_id"],
            ["workout_sessions.id"],
            name=op.f("fk_exercise_groups_workout_session_id_workout_sessions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_exercise_groups")),
        sa.UniqueConstraint(
            "workout_session_id",
            "group_order",
            name="exercise_groups_session_order_unique",
        ),
    )
    op.create_index(
        "exercise_groups_session_order_idx",
        "exercise_groups",
        ["workout_session_id", "group_order"],
        unique=False,
    )

    op.create_table(
        "exercise_sets",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("workout_exercise_id", sa.UUID(), nullable=False),
        sa.Column("set_order", sa.Integer(), nullable=False),
        sa.Column(
            "set_type",
            exercise_set_type,
            server_default="working",
            nullable=False,
        ),
        sa.Column("weight_kg", sa.Numeric(7, 3), nullable=True),
        sa.Column("reps", sa.Integer(), nullable=True),
        sa.Column("rir", sa.Numeric(3, 1), nullable=True),
        sa.Column("rpe", sa.Numeric(3, 1), nullable=True),
        sa.Column("parent_set_id", sa.UUID(), nullable=True),
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
            "set_order > 0",
            name=op.f("ck_exercise_sets_order_positive"),
        ),
        sa.CheckConstraint(
            "weight_kg IS NULL OR weight_kg >= 0",
            name=op.f("ck_exercise_sets_weight_nonnegative"),
        ),
        sa.CheckConstraint(
            "reps IS NULL OR reps >= 0",
            name=op.f("ck_exercise_sets_reps_nonnegative"),
        ),
        sa.CheckConstraint(
            "rir IS NULL OR (rir >= 0 AND rir <= 10)",
            name=op.f("ck_exercise_sets_rir_range"),
        ),
        sa.CheckConstraint(
            "rpe IS NULL OR (rpe >= 0 AND rpe <= 10)",
            name=op.f("ck_exercise_sets_rpe_range"),
        ),
        sa.CheckConstraint(
            "parent_set_id IS NULL OR parent_set_id <> id",
            name=op.f("ck_exercise_sets_not_own_parent"),
        ),
        sa.CheckConstraint(
            "(set_type = 'dropset' AND parent_set_id IS NOT NULL) OR "
            "(set_type IN ('warmup', 'working') AND parent_set_id IS NULL)",
            name=op.f("ck_exercise_sets_parent_shape"),
        ),
        sa.ForeignKeyConstraint(
            ["parent_set_id"],
            ["exercise_sets.id"],
            name=op.f("fk_exercise_sets_parent_set_id_exercise_sets"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["workout_exercise_id"],
            ["workout_exercises.id"],
            name=op.f("fk_exercise_sets_workout_exercise_id_workout_exercises"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_exercise_sets")),
    )
    op.create_index(
        "exercise_sets_top_level_order_unique",
        "exercise_sets",
        ["workout_exercise_id", "set_order"],
        unique=True,
        postgresql_where=sa.text("parent_set_id IS NULL"),
    )
    op.create_index(
        "exercise_sets_child_order_unique",
        "exercise_sets",
        ["parent_set_id", "set_order"],
        unique=True,
        postgresql_where=sa.text("parent_set_id IS NOT NULL"),
    )
    op.create_index(
        "exercise_sets_exercise_order_idx",
        "exercise_sets",
        ["workout_exercise_id", "set_order"],
        unique=False,
    )
    op.create_index(
        "exercise_sets_parent_order_idx",
        "exercise_sets",
        ["parent_set_id", "set_order"],
        unique=False,
        postgresql_where=sa.text("parent_set_id IS NOT NULL"),
    )

    op.create_table(
        "exercise_group_members",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("exercise_group_id", sa.UUID(), nullable=False),
        sa.Column("workout_exercise_id", sa.UUID(), nullable=False),
        sa.Column("member_order", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "member_order > 0",
            name=op.f("ck_exercise_group_members_order_positive"),
        ),
        sa.ForeignKeyConstraint(
            ["exercise_group_id"],
            ["exercise_groups.id"],
            name=op.f("fk_exercise_group_members_exercise_group_id_exercise_groups"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["workout_exercise_id"],
            ["workout_exercises.id"],
            name=op.f(
                "fk_exercise_group_members_workout_exercise_id_workout_exercises"
            ),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_exercise_group_members")),
        sa.UniqueConstraint(
            "exercise_group_id",
            "workout_exercise_id",
            name="exercise_group_members_group_exercise_unique",
        ),
        sa.UniqueConstraint(
            "exercise_group_id",
            "member_order",
            name="exercise_group_members_order_unique",
        ),
    )
    op.create_index(
        "exercise_group_members_exercise_idx",
        "exercise_group_members",
        ["workout_exercise_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "exercise_group_members_exercise_idx",
        table_name="exercise_group_members",
    )
    op.drop_table("exercise_group_members")
    op.drop_index(
        "exercise_sets_parent_order_idx",
        table_name="exercise_sets",
        postgresql_where=sa.text("parent_set_id IS NOT NULL"),
    )
    op.drop_index("exercise_sets_exercise_order_idx", table_name="exercise_sets")
    op.drop_index(
        "exercise_sets_child_order_unique",
        table_name="exercise_sets",
        postgresql_where=sa.text("parent_set_id IS NOT NULL"),
    )
    op.drop_index(
        "exercise_sets_top_level_order_unique",
        table_name="exercise_sets",
        postgresql_where=sa.text("parent_set_id IS NULL"),
    )
    op.drop_table("exercise_sets")
    op.drop_index("exercise_groups_session_order_idx", table_name="exercise_groups")
    op.drop_table("exercise_groups")
    op.drop_index(
        "workout_exercises_name_history_idx",
        table_name="workout_exercises",
    )
    op.drop_index(
        "workout_exercises_session_order_idx",
        table_name="workout_exercises",
    )
    op.drop_table("workout_exercises")
    op.drop_index("workout_sessions_check_in_at_idx", table_name="workout_sessions")
    op.drop_table("workout_sessions")
    exercise_set_type.drop(op.get_bind(), checkfirst=True)
