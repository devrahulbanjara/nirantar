from __future__ import annotations

import enum
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
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from nirantar.db.base import Base, TimestampMixin


class ExerciseSetType(str, enum.Enum):
    WARMUP = "warmup"
    WORKING = "working"
    DROPSET = "dropset"


exercise_set_type_enum = ENUM(
    ExerciseSetType,
    name="exercise_set_type",
    create_type=False,
    values_callable=lambda enum_cls: [member.value for member in enum_cls],
)


class WorkoutSession(Base, TimestampMixin):
    __tablename__ = "workout_sessions"
    __table_args__ = (
        CheckConstraint(
            "check_out_at IS NULL OR check_out_at > check_in_at",
            name="valid_time",
        ),
        Index(
            "workout_sessions_owner_check_in_idx",
            "owner_id",
            text("check_in_at DESC"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    owner_id: Mapped[str] = mapped_column(Text, nullable=False)
    check_in_at: Mapped[datetime] = mapped_column(nullable=False)
    check_out_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    title: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    exercises: Mapped[list[WorkoutExercise]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="WorkoutExercise.exercise_order",
    )
    groups: Mapped[list[ExerciseGroup]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ExerciseGroup.group_order",
    )


class WorkoutExercise(Base, TimestampMixin):
    __tablename__ = "workout_exercises"
    __table_args__ = (
        CheckConstraint("btrim(exercise_name) <> ''", name="name_not_blank"),
        CheckConstraint("exercise_order > 0", name="order_positive"),
        UniqueConstraint(
            "workout_session_id",
            "exercise_order",
            name="workout_exercises_session_order_unique",
        ),
        Index(
            "workout_exercises_session_order_idx",
            "workout_session_id",
            "exercise_order",
        ),
        Index(
            "workout_exercises_name_history_idx",
            text("lower(exercise_name)"),
            "workout_session_id",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    workout_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workout_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    exercise_name: Mapped[str] = mapped_column(Text, nullable=False)
    exercise_order: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    session: Mapped[WorkoutSession] = relationship(back_populates="exercises")
    sets: Mapped[list[ExerciseSet]] = relationship(
        back_populates="exercise",
        cascade="all, delete-orphan",
        foreign_keys="ExerciseSet.workout_exercise_id",
    )
    group_memberships: Mapped[list[ExerciseGroupMember]] = relationship(
        back_populates="exercise",
        cascade="all, delete-orphan",
    )


class ExerciseSet(Base, TimestampMixin):
    __tablename__ = "exercise_sets"
    __table_args__ = (
        CheckConstraint("set_order > 0", name="order_positive"),
        CheckConstraint(
            "weight_kg IS NULL OR weight_kg >= 0",
            name="weight_nonnegative",
        ),
        CheckConstraint("reps IS NULL OR reps >= 0", name="reps_nonnegative"),
        CheckConstraint(
            "rir IS NULL OR (rir >= 0 AND rir <= 10)",
            name="rir_range",
        ),
        CheckConstraint(
            "rpe IS NULL OR (rpe >= 0 AND rpe <= 10)",
            name="rpe_range",
        ),
        CheckConstraint(
            "parent_set_id IS NULL OR parent_set_id <> id",
            name="not_own_parent",
        ),
        CheckConstraint(
            "(set_type = 'dropset' AND parent_set_id IS NOT NULL) OR "
            "(set_type IN ('warmup', 'working') AND parent_set_id IS NULL)",
            name="parent_shape",
        ),
        Index(
            "exercise_sets_top_level_order_unique",
            "workout_exercise_id",
            "set_order",
            unique=True,
            postgresql_where=text("parent_set_id IS NULL"),
        ),
        Index(
            "exercise_sets_child_order_unique",
            "parent_set_id",
            "set_order",
            unique=True,
            postgresql_where=text("parent_set_id IS NOT NULL"),
        ),
        Index(
            "exercise_sets_exercise_order_idx",
            "workout_exercise_id",
            "set_order",
        ),
        Index(
            "exercise_sets_parent_order_idx",
            "parent_set_id",
            "set_order",
            postgresql_where=text("parent_set_id IS NOT NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    workout_exercise_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workout_exercises.id", ondelete="CASCADE"),
        nullable=False,
    )
    set_order: Mapped[int] = mapped_column(Integer, nullable=False)
    set_type: Mapped[ExerciseSetType] = mapped_column(
        exercise_set_type_enum,
        nullable=False,
        server_default=ExerciseSetType.WORKING.value,
    )
    weight_kg: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(7, 3),
        nullable=True,
    )
    reps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rir: Mapped[Optional[Decimal]] = mapped_column(Numeric(3, 1), nullable=True)
    rpe: Mapped[Optional[Decimal]] = mapped_column(Numeric(3, 1), nullable=True)
    parent_set_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("exercise_sets.id", ondelete="CASCADE"),
        nullable=True,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    exercise: Mapped[WorkoutExercise] = relationship(
        back_populates="sets",
        foreign_keys=[workout_exercise_id],
    )
    parent: Mapped[Optional[ExerciseSet]] = relationship(
        remote_side="ExerciseSet.id",
        back_populates="dropsets",
        foreign_keys=[parent_set_id],
    )
    dropsets: Mapped[list[ExerciseSet]] = relationship(
        back_populates="parent",
        cascade="all, delete-orphan",
        foreign_keys=[parent_set_id],
        order_by="ExerciseSet.set_order",
    )


class ExerciseGroup(Base, TimestampMixin):
    __tablename__ = "exercise_groups"
    __table_args__ = (
        CheckConstraint("group_type IN ('superset')", name="type_valid"),
        CheckConstraint("group_order > 0", name="order_positive"),
        UniqueConstraint(
            "workout_session_id",
            "group_order",
            name="exercise_groups_session_order_unique",
        ),
        Index(
            "exercise_groups_session_order_idx",
            "workout_session_id",
            "group_order",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    workout_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workout_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    group_type: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        server_default="superset",
    )
    group_order: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    session: Mapped[WorkoutSession] = relationship(back_populates="groups")
    members: Mapped[list[ExerciseGroupMember]] = relationship(
        back_populates="group",
        cascade="all, delete-orphan",
        order_by="ExerciseGroupMember.member_order",
    )


class ExerciseGroupMember(Base):
    __tablename__ = "exercise_group_members"
    __table_args__ = (
        CheckConstraint("member_order > 0", name="order_positive"),
        UniqueConstraint(
            "exercise_group_id",
            "workout_exercise_id",
            name="exercise_group_members_group_exercise_unique",
        ),
        UniqueConstraint(
            "exercise_group_id",
            "member_order",
            name="exercise_group_members_order_unique",
        ),
        Index(
            "exercise_group_members_exercise_idx",
            "workout_exercise_id",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    exercise_group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("exercise_groups.id", ondelete="CASCADE"),
        nullable=False,
    )
    workout_exercise_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workout_exercises.id", ondelete="CASCADE"),
        nullable=False,
    )
    member_order: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        nullable=False,
    )

    group: Mapped[ExerciseGroup] = relationship(back_populates="members")
    exercise: Mapped[WorkoutExercise] = relationship(
        back_populates="group_memberships",
    )
