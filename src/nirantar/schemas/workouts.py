from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class SetType(str, Enum):
    WARMUP = "warmup"
    WORKING = "working"
    DROPSET = "dropset"


class DropsetCreate(BaseModel):
    order: int = Field(gt=0)
    weight_kg: Decimal | None = Field(default=None, ge=0)
    reps: int | None = Field(default=None, ge=0)
    notes: str | None = None
    client_ref: str | None = None


class SetCreate(BaseModel):
    order: int = Field(gt=0)
    type: SetType
    weight_kg: Decimal | None = Field(default=None, ge=0)
    reps: int | None = Field(default=None, ge=0)
    notes: str | None = None
    client_ref: str | None = None
    dropsets: list[DropsetCreate] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_dropset_rules(self) -> "SetCreate":
        if self.type == SetType.DROPSET:
            raise ValueError(
                "Top-level sets cannot use type 'dropset'; nest them under a working set"
            )
        if self.dropsets and self.type != SetType.WORKING:
            raise ValueError("Only working sets may include nested dropsets")
        drop_orders = [item.order for item in self.dropsets]
        if len(drop_orders) != len(set(drop_orders)):
            raise ValueError("Dropset order values must be unique under a working set")
        return self


class ExerciseCreate(BaseModel):
    name: str = Field(min_length=1)
    order: int = Field(gt=0)
    notes: str | None = None
    client_ref: str | None = None
    sets: list[SetCreate] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Exercise name must not be blank")
        return value

    @model_validator(mode="after")
    def unique_set_orders(self) -> "ExerciseCreate":
        orders = [item.order for item in self.sets]
        if len(orders) != len(set(orders)):
            raise ValueError("Top-level set order values must be unique within an exercise")
        return self


class ExerciseGroupCreate(BaseModel):
    type: str = Field(default="superset")
    order: int = Field(gt=0)
    notes: str | None = None
    exercise_refs: list[str] = Field(min_length=2)

    @field_validator("type")
    @classmethod
    def only_superset(cls, value: str) -> str:
        if value != "superset":
            raise ValueError("Only group type 'superset' is supported in V1")
        return value

    @model_validator(mode="after")
    def unique_refs(self) -> "ExerciseGroupCreate":
        if len(self.exercise_refs) != len(set(self.exercise_refs)):
            raise ValueError("Group exercise_refs must be unique")
        return self


class WorkoutCreate(BaseModel):
    check_in_at: datetime
    check_out_at: datetime | None = None
    title: str | None = None
    notes: str | None = None
    exercises: list[ExerciseCreate] = Field(default_factory=list)
    groups: list[ExerciseGroupCreate] = Field(default_factory=list)

    @field_validator("check_in_at", "check_out_at")
    @classmethod
    def require_timezone(cls, value: datetime | None) -> datetime | None:
        if value is not None and value.tzinfo is None:
            raise ValueError("Timestamps must be timezone-aware")
        return value

    @model_validator(mode="after")
    def validate_workout(self) -> "WorkoutCreate":
        if self.check_out_at is not None and self.check_out_at <= self.check_in_at:
            raise ValueError("check_out_at must be later than check_in_at")

        exercise_orders = [item.order for item in self.exercises]
        if len(exercise_orders) != len(set(exercise_orders)):
            raise ValueError("Exercise order values must be unique within a workout")

        refs = [item.client_ref for item in self.exercises if item.client_ref]
        if len(refs) != len(set(refs)):
            raise ValueError("Exercise client_ref values must be unique")

        group_orders = [item.order for item in self.groups]
        if len(group_orders) != len(set(group_orders)):
            raise ValueError("Group order values must be unique within a workout")

        known_refs = {item.client_ref for item in self.exercises if item.client_ref}
        for group in self.groups:
            missing = [ref for ref in group.exercise_refs if ref not in known_refs]
            if missing:
                raise ValueError(
                    f"Unknown exercise_refs in group order {group.order}: {', '.join(missing)}"
                )
        return self


class UpdateWorkoutOperation(BaseModel):
    operation: Literal["update_workout"]
    check_in_at: datetime | None = None
    check_out_at: datetime | None = None
    title: str | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def validate_patch(self) -> "UpdateWorkoutOperation":
        changed = self.model_fields_set - {"operation"}
        if not changed:
            raise ValueError("update_workout requires at least one changed field")
        if "check_in_at" in changed and self.check_in_at is None:
            raise ValueError("check_in_at cannot be null")
        for field_name in ("check_in_at", "check_out_at"):
            value = getattr(self, field_name)
            if value is not None and value.tzinfo is None:
                raise ValueError(f"{field_name} must be timezone-aware")
        return self


class AddExerciseOperation(BaseModel):
    operation: Literal["add_exercise"]
    exercise: ExerciseCreate


class UpdateExerciseOperation(BaseModel):
    operation: Literal["update_exercise"]
    exercise_id: UUID
    name: str | None = None
    order: int | None = Field(default=None, gt=0)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_patch(self) -> "UpdateExerciseOperation":
        changed = self.model_fields_set - {"operation", "exercise_id"}
        if not changed:
            raise ValueError("update_exercise requires at least one changed field")
        if "name" in changed and (self.name is None or not self.name.strip()):
            raise ValueError("Exercise name cannot be null or blank")
        if "order" in changed and self.order is None:
            raise ValueError("Exercise order cannot be null")
        return self


class RemoveExerciseOperation(BaseModel):
    operation: Literal["remove_exercise"]
    exercise_id: UUID


class AddSetOperation(BaseModel):
    operation: Literal["add_set"]
    exercise_id: UUID
    set: SetCreate


class AddDropsetOperation(BaseModel):
    operation: Literal["add_dropset"]
    parent_set_id: UUID
    dropset: DropsetCreate


class UpdateSetOperation(BaseModel):
    operation: Literal["update_set"]
    set_id: UUID
    order: int | None = Field(default=None, gt=0)
    weight_kg: Decimal | None = Field(default=None, ge=0)
    reps: int | None = Field(default=None, ge=0)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_patch(self) -> "UpdateSetOperation":
        changed = self.model_fields_set - {"operation", "set_id"}
        if not changed:
            raise ValueError("update_set requires at least one changed field")
        if "order" in changed and self.order is None:
            raise ValueError("Set order cannot be null")
        return self


class RemoveSetOperation(BaseModel):
    operation: Literal["remove_set"]
    set_id: UUID
    cascade_dropsets: bool = False


WorkoutEditOperation = Annotated[
    UpdateWorkoutOperation
    | AddExerciseOperation
    | UpdateExerciseOperation
    | RemoveExerciseOperation
    | AddSetOperation
    | AddDropsetOperation
    | UpdateSetOperation
    | RemoveSetOperation,
    Field(discriminator="operation"),
]


class WorkoutEditRequest(BaseModel):
    expected_updated_at: datetime
    operations: list[WorkoutEditOperation] = Field(min_length=1)

    @field_validator("expected_updated_at")
    @classmethod
    def require_expected_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            raise ValueError("expected_updated_at must be timezone-aware")
        return value


class WorkoutDeleteRequest(BaseModel):
    expected_updated_at: datetime
    confirmation: str

    @field_validator("expected_updated_at")
    @classmethod
    def require_expected_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            raise ValueError("expected_updated_at must be timezone-aware")
        return value


class WorkoutDeleteResult(BaseModel):
    workout_id: UUID
    deleted: Literal[True] = True


class DropsetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    set_order: int
    set_type: SetType
    weight_kg: Decimal | None
    reps: int | None
    notes: str | None
    parent_set_id: UUID


class SetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    set_order: int
    set_type: SetType
    weight_kg: Decimal | None
    reps: int | None
    notes: str | None
    parent_set_id: UUID | None = None
    dropsets: list[DropsetRead] = Field(default_factory=list)


class ExerciseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    exercise_name: str
    exercise_order: int
    notes: str | None
    sets: list[SetRead] = Field(default_factory=list)


class GroupMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workout_exercise_id: UUID
    exercise_name: str
    member_order: int


class ExerciseGroupRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    group_type: str
    group_order: int
    notes: str | None
    members: list[GroupMemberRead] = Field(default_factory=list)


class WorkoutRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    check_in_at: datetime
    check_out_at: datetime | None
    title: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    exercises: list[ExerciseRead] = Field(default_factory=list)
    groups: list[ExerciseGroupRead] = Field(default_factory=list)
    working_set_count: int = 0
    dropset_count: int = 0
    physical_set_count: int = 0


class ExerciseHistorySetRead(BaseModel):
    id: UUID
    set_order: int
    set_type: SetType
    weight_kg: Decimal | None
    reps: int | None
    notes: str | None
    parent_set_id: UUID | None
    dropsets: list[DropsetRead] = Field(default_factory=list)


class ExerciseHistoryEntry(BaseModel):
    workout_session_id: UUID
    check_in_at: datetime
    workout_title: str | None
    workout_exercise_id: UUID
    exercise_name: str
    exercise_order: int
    sets: list[ExerciseHistorySetRead] = Field(default_factory=list)


class RecentWorkoutsQuery(BaseModel):
    limit: int = Field(default=10, ge=1, le=100)
    before: datetime | None = None

    @field_validator("before")
    @classmethod
    def require_timezone(cls, value: datetime | None) -> datetime | None:
        if value is not None and value.tzinfo is None:
            raise ValueError("before must be timezone-aware")
        return value


class ExerciseHistoryQuery(BaseModel):
    exercise_name: str = Field(min_length=1)
    start_at: datetime | None = None
    end_at: datetime | None = None
    limit: int = Field(default=20, ge=1, le=100)

    @field_validator("exercise_name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("exercise_name must not be blank")
        return value

    @field_validator("start_at", "end_at")
    @classmethod
    def require_timezone(cls, value: datetime | None) -> datetime | None:
        if value is not None and value.tzinfo is None:
            raise ValueError("Timestamps must be timezone-aware")
        return value

    @model_validator(mode="after")
    def validate_range(self) -> "ExerciseHistoryQuery":
        if (
            self.start_at is not None
            and self.end_at is not None
            and self.end_at < self.start_at
        ):
            raise ValueError("end_at must be greater than or equal to start_at")
        return self
