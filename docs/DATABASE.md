# Nirantar Database Design

## Document Purpose

This document defines the initial PostgreSQL data model for Nirantar, with a detailed workout schema and a minimal nutrition extension.

The design prioritizes:

- Accurate historical data.
- Real gym semantics.
- Clear analytics.
- Safe relational constraints.
- Simple MVP implementation.
- Future extensibility without premature complexity.

## Design Principles

### Use Standard PostgreSQL

Neon is accessed through `DATABASE_URL` as a normal PostgreSQL instance. The schema and application must not depend on a Neon-specific SDK.

### Store Events, Not Derived Labels

Store gym entry and exit as timezone-aware timestamps.

```text
check_in_at  = 2026-08-16 07:05:00+05:45
check_out_at = 2026-08-16 08:12:00+05:45
```

Derive:

```text
date     -> 2026-08-16
weekday  -> Sunday
time     -> 07:05
duration -> check_out_at - check_in_at
```

Do not add duplicate `date`, `day`, `entry_time`, or `exit_time` columns.

### Keep Source Data Granular

Every physical set is stored as a row. The set type and parent relationship determine its meaning.

### Separate Domain Input From Persistence

MCP and API inputs may use natural nested objects. The service layer translates those objects into normalized relational rows inside a transaction.

## Workout Hierarchy

```text
Workout Session
├── Check-in and check-out
├── Performed Exercises
│   ├── Warm-up Sets
│   ├── Working Sets
│   │   └── Dropsets
│   └── Notes
└── Exercise Groups
    └── Ordered Superset Members
```

Example:

```text
WORKOUT SESSION
├── check-in: 07:05
├── check-out: 08:12
│
├── Bicep Curl
│   ├── Warm-up: 5 kg x 15
│   ├── Working Set 1: 10 kg x 10
│   ├── Working Set 2: 15 kg x 8
│   └── Working Set 3: 20 kg x 5
│       ├── Drop 1: 15 kg x 6
│       └── Drop 2: 10 kg x 8
│
├── Tricep Pushdown
│   └── Working sets...
│
└── Superset 1
    ├── Bicep Curl
    └── Tricep Pushdown
```

## Relationship Overview

```text
workout_sessions
├── 1:N workout_exercises
│   └── 1:N exercise_sets
│       └── 0:N child exercise_sets through parent_set_id
└── 1:N exercise_groups
    └── 1:N exercise_group_members
        └── N:1 workout_exercises
```

## PostgreSQL Extensions

Use `gen_random_uuid()` for identifiers.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## Set Type

The initial supported types are:

```text
warmup
working
dropset
```

PostgreSQL enum option:

```sql
CREATE TYPE exercise_set_type AS ENUM (
    'warmup',
    'working',
    'dropset'
);
```

If migration flexibility is preferred, use `TEXT` with a check constraint instead. Either approach is acceptable if the valid values are enforced in the database.

## Table: `workout_sessions`

One row represents one visit to the gym or one performed workout session.

```sql
CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_in_at TIMESTAMPTZ NOT NULL,
    check_out_at TIMESTAMPTZ,
    title TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT workout_sessions_valid_time
        CHECK (check_out_at IS NULL OR check_out_at > check_in_at)
);
```

Notes:

- `check_out_at` is nullable while a session is active.
- `title` may contain values such as `Arms`, `Upper Body`, or `Push Day`.
- Use `WorkoutSession` as the application model name. `Workout` may later refer to a reusable workout template.

## Table: `workout_exercises`

One row represents one exercise performed in a workout session.

```sql
CREATE TABLE workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_session_id UUID NOT NULL
        REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    exercise_order INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT workout_exercises_name_not_blank
        CHECK (btrim(exercise_name) <> ''),
    CONSTRAINT workout_exercises_order_positive
        CHECK (exercise_order > 0),
    CONSTRAINT workout_exercises_session_order_unique
        UNIQUE (workout_session_id, exercise_order)
);
```

For the MVP, `exercise_name TEXT` is intentional. A normalized exercise catalog can be introduced later when aliases, equipment, muscles, and canonical naming become necessary.

## Table: `exercise_sets`

Every physical set is a row.

```sql
CREATE TABLE exercise_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_exercise_id UUID NOT NULL
        REFERENCES workout_exercises(id) ON DELETE CASCADE,
    set_order INTEGER NOT NULL,
    set_type exercise_set_type NOT NULL DEFAULT 'working',
    weight_kg NUMERIC(7,3),
    reps INTEGER,
    rir NUMERIC(3,1),
    rpe NUMERIC(3,1),
    parent_set_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT exercise_sets_parent_fk
        FOREIGN KEY (parent_set_id)
        REFERENCES exercise_sets(id) ON DELETE CASCADE,
    CONSTRAINT exercise_sets_order_positive
        CHECK (set_order > 0),
    CONSTRAINT exercise_sets_weight_nonnegative
        CHECK (weight_kg IS NULL OR weight_kg >= 0),
    CONSTRAINT exercise_sets_reps_nonnegative
        CHECK (reps IS NULL OR reps >= 0),
    CONSTRAINT exercise_sets_rir_range
        CHECK (rir IS NULL OR (rir >= 0 AND rir <= 10)),
    CONSTRAINT exercise_sets_rpe_range
        CHECK (rpe IS NULL OR (rpe >= 0 AND rpe <= 10)),
    CONSTRAINT exercise_sets_not_own_parent
        CHECK (parent_set_id IS NULL OR parent_set_id <> id),
    CONSTRAINT exercise_sets_parent_shape
        CHECK (
            (set_type = 'dropset' AND parent_set_id IS NOT NULL)
            OR
            (set_type IN ('warmup', 'working') AND parent_set_id IS NULL)
        )
);
```

### Set Ordering Semantics

Use `set_order` in the appropriate sibling scope:

- A top-level warm-up or working set is ordered among the top-level sets of the exercise.
- A dropset is ordered among children of its parent working set.

This permits:

```text
Top-level set_order: 1, 2, 3, 4
Drops under working set 4: set_order 1, 2
```

Uniqueness for these scopes can be enforced with partial indexes:

```sql
CREATE UNIQUE INDEX exercise_sets_top_level_order_unique
    ON exercise_sets (workout_exercise_id, set_order)
    WHERE parent_set_id IS NULL;

CREATE UNIQUE INDEX exercise_sets_child_order_unique
    ON exercise_sets (parent_set_id, set_order)
    WHERE parent_set_id IS NOT NULL;
```

### Dropset Invariants

A dropset must:

- Have `set_type = 'dropset'`.
- Have a non-null `parent_set_id`.
- Point to a working set.
- Belong to the same `workout_exercise_id` as its parent.
- Never become the parent of another dropset in V1.

The basic shape is enforced by checks and foreign keys. Cross-row rules—same exercise, parent type, and maximum depth—must be enforced by the service layer and preferably by a deferred constraint trigger if writes may occur outside that service.

Conceptual validation:

```python
if child.set_type != "dropset":
    assert child.parent_set_id is None
else:
    assert parent is not None
    assert parent.set_type == "working"
    assert parent.workout_exercise_id == child.workout_exercise_id
    assert parent.parent_set_id is None
```

### Why Dropsets Are Not Independent Working Sets

For this performance:

```text
Working Set 1: 10 kg x 10
Working Set 2: 15 kg x 8
Working Set 3: 20 kg x 5
  Drop 1: 15 kg x 6
  Drop 2: 10 kg x 8
```

Correct analytics are:

```text
working_sets       = 3
dropsets           = 2
total_physical_sets = 5
```

Flattening the drops into Sets 4 and 5 would incorrectly report five working sets and lose the relationship to the third set.

## Table: `exercise_groups`

One row represents a grouping of exercises within a workout session.

For V1, only `superset` is required.

```sql
CREATE TABLE exercise_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_session_id UUID NOT NULL
        REFERENCES workout_sessions(id) ON DELETE CASCADE,
    group_type TEXT NOT NULL DEFAULT 'superset',
    group_order INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT exercise_groups_type_valid
        CHECK (group_type IN ('superset')),
    CONSTRAINT exercise_groups_order_positive
        CHECK (group_order > 0),
    CONSTRAINT exercise_groups_session_order_unique
        UNIQUE (workout_session_id, group_order)
);
```

Using `TEXT` makes later additions straightforward:

```text
tri_set
giant_set
circuit
```

The check constraint can be expanded through a migration when those types are supported.

## Table: `exercise_group_members`

This join table links ordered performed exercises to a group.

```sql
CREATE TABLE exercise_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_group_id UUID NOT NULL
        REFERENCES exercise_groups(id) ON DELETE CASCADE,
    workout_exercise_id UUID NOT NULL
        REFERENCES workout_exercises(id) ON DELETE CASCADE,
    member_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT exercise_group_members_order_positive
        CHECK (member_order > 0),
    CONSTRAINT exercise_group_members_group_exercise_unique
        UNIQUE (exercise_group_id, workout_exercise_id),
    CONSTRAINT exercise_group_members_order_unique
        UNIQUE (exercise_group_id, member_order)
);
```

The referenced exercise and group must belong to the same workout session. Enforce this in the service layer and optionally with a database trigger.

Do not add `superset_with_exercise_id` to `workout_exercises`. A group plus ordered join rows supports two or more exercises cleanly and enables later analysis of recurring combinations.

## Superset Rounds

Example:

```text
Round 1
  Bicep Curl: 10 kg x 10
  Tricep Pushdown: 20 kg x 12

Round 2
  Bicep Curl: 12.5 kg x 8
  Tricep Pushdown: 25 kg x 10
```

For the MVP, corresponding top-level working-set order may be used to infer rounds. Do not create a `superset_rounds` table yet.

Add explicit round or sequence tables later only if real workouts expose ambiguity that set order cannot represent.

## Recommended Workout Indexes

```sql
CREATE INDEX workout_sessions_check_in_at_idx
    ON workout_sessions (check_in_at DESC);

CREATE INDEX workout_exercises_session_order_idx
    ON workout_exercises (workout_session_id, exercise_order);

CREATE INDEX workout_exercises_name_history_idx
    ON workout_exercises (lower(exercise_name), workout_session_id);

CREATE INDEX exercise_sets_exercise_order_idx
    ON exercise_sets (workout_exercise_id, set_order);

CREATE INDEX exercise_sets_parent_order_idx
    ON exercise_sets (parent_set_id, set_order)
    WHERE parent_set_id IS NOT NULL;

CREATE INDEX exercise_groups_session_order_idx
    ON exercise_groups (workout_session_id, group_order);

CREATE INDEX exercise_group_members_exercise_idx
    ON exercise_group_members (workout_exercise_id);
```

For precise exercise-history queries at larger scale, denormalization is unnecessary initially. Join `workout_exercises` to `workout_sessions` and order by `check_in_at`.

## Complete Workout Example

Logical records:

```text
workout_sessions
  id = SESSION_1
  check_in_at = 2026-08-16T07:05:00+05:45
  check_out_at = 2026-08-16T08:12:00+05:45
  title = Arms

workout_exercises
  CURL
    session = SESSION_1
    name = Bicep Curl
    order = 1

  PUSHDOWN
    session = SESSION_1
    name = Tricep Pushdown
    order = 2

exercise_sets
  CURL_WARMUP
    exercise = CURL
    order = 1
    type = warmup
    weight = 5
    reps = 15
    parent = NULL

  CURL_WORK_1
    exercise = CURL
    order = 2
    type = working
    weight = 10
    reps = 10
    parent = NULL

  CURL_WORK_2
    exercise = CURL
    order = 3
    type = working
    weight = 15
    reps = 8
    parent = NULL

  CURL_WORK_3
    exercise = CURL
    order = 4
    type = working
    weight = 20
    reps = 5
    parent = NULL

  CURL_DROP_1
    exercise = CURL
    order = 1
    type = dropset
    weight = 15
    reps = 6
    parent = CURL_WORK_3

  CURL_DROP_2
    exercise = CURL
    order = 2
    type = dropset
    weight = 10
    reps = 8
    parent = CURL_WORK_3

exercise_groups
  SUPERSET_1
    session = SESSION_1
    type = superset
    order = 1

exercise_group_members
  SUPERSET_1 -> CURL, member_order = 1
  SUPERSET_1 -> PUSHDOWN, member_order = 2
```

## Example Analytics

### Count Working Sets

```sql
SELECT count(*) AS working_sets
FROM exercise_sets
WHERE set_type = 'working';
```

### Count All Main Effort Sets Including Dropsets

```sql
SELECT count(*) AS effort_sets
FROM exercise_sets
WHERE set_type IN ('working', 'dropset');
```

### Session Duration

```sql
SELECT
    id,
    check_out_at - check_in_at AS duration
FROM workout_sessions
WHERE id = :session_id;
```

### Exercise History

```sql
SELECT
    ws.check_in_at,
    we.exercise_name,
    es.id,
    es.set_order,
    es.set_type,
    es.weight_kg,
    es.reps,
    es.rir,
    es.rpe,
    es.parent_set_id
FROM workout_exercises AS we
JOIN workout_sessions AS ws
    ON ws.id = we.workout_session_id
JOIN exercise_sets AS es
    ON es.workout_exercise_id = we.id
WHERE lower(we.exercise_name) = lower(:exercise_name)
ORDER BY
    ws.check_in_at DESC,
    CASE WHEN es.parent_set_id IS NULL THEN es.set_order ELSE 2147483647 END,
    es.parent_set_id NULLS FIRST,
    es.set_order;
```

For API responses, assemble dropsets beneath their parent in application code for a predictable hierarchical representation.

### Most Common Superset Pairings

```sql
SELECT
    lower(we1.exercise_name) AS exercise_1,
    lower(we2.exercise_name) AS exercise_2,
    count(*) AS times_paired
FROM exercise_group_members AS gm1
JOIN exercise_group_members AS gm2
    ON gm2.exercise_group_id = gm1.exercise_group_id
   AND gm2.member_order > gm1.member_order
JOIN workout_exercises AS we1
    ON we1.id = gm1.workout_exercise_id
JOIN workout_exercises AS we2
    ON we2.id = gm2.workout_exercise_id
JOIN exercise_groups AS eg
    ON eg.id = gm1.exercise_group_id
WHERE eg.group_type = 'superset'
GROUP BY lower(we1.exercise_name), lower(we2.exercise_name)
ORDER BY times_paired DESC;
```

## Minimal Nutrition Extension

The immediate MVP also needs simple meal logging. Nutrition is intentionally less normalized than the workout model.

### Table: `meals`

```sql
CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eaten_at TIMESTAMPTZ NOT NULL,
    name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT meals_name_not_blank
        CHECK (btrim(name) <> '')
);
```

### Table: `food_items`

```sql
CREATE TABLE food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL
        REFERENCES meals(id) ON DELETE CASCADE,
    item_order INTEGER NOT NULL,
    name TEXT NOT NULL,
    quantity NUMERIC(10,3),
    unit TEXT,
    calories_kcal NUMERIC(10,2),
    protein_g NUMERIC(10,2),
    carbohydrates_g NUMERIC(10,2),
    fat_g NUMERIC(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT food_items_order_positive
        CHECK (item_order > 0),
    CONSTRAINT food_items_name_not_blank
        CHECK (btrim(name) <> ''),
    CONSTRAINT food_items_quantity_nonnegative
        CHECK (quantity IS NULL OR quantity >= 0),
    CONSTRAINT food_items_calories_nonnegative
        CHECK (calories_kcal IS NULL OR calories_kcal >= 0),
    CONSTRAINT food_items_protein_nonnegative
        CHECK (protein_g IS NULL OR protein_g >= 0),
    CONSTRAINT food_items_carbohydrates_nonnegative
        CHECK (carbohydrates_g IS NULL OR carbohydrates_g >= 0),
    CONSTRAINT food_items_fat_nonnegative
        CHECK (fat_g IS NULL OR fat_g >= 0),
    CONSTRAINT food_items_meal_order_unique
        UNIQUE (meal_id, item_order)
);
```

Recommended nutrition indexes:

```sql
CREATE INDEX meals_eaten_at_idx
    ON meals (eaten_at DESC);

CREATE INDEX food_items_meal_order_idx
    ON food_items (meal_id, item_order);
```

Nutrition values remain nullable because early records may contain only human-readable food descriptions. Missing nutrition must remain unknown rather than silently becoming zero in source records.

## Update Timestamp Strategy

Either update `updated_at` explicitly in the service layer or use one shared trigger.

Example trigger function:

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Apply it consistently to mutable tables. Do not mix trigger-managed and application-managed timestamps without a clear convention.

## Deletion Behavior

The initial foreign keys use `ON DELETE CASCADE` for owned child records:

- Deleting a workout session deletes its exercises, sets, groups, and group memberships.
- Deleting an exercise deletes its sets and group memberships.
- Deleting a parent working set deletes its dropsets.
- Deleting a meal deletes its food items.

The application should still require explicit confirmation for user-facing destructive operations. Cascades preserve relational integrity; they are not authorization to delete silently.

## Application Model Names

Recommended Python names:

```text
WorkoutSession
WorkoutExercise
ExerciseSet
ExerciseGroup
ExerciseGroupMember
Meal
FoodItem
```

Use `WorkoutSession`, not `Workout`, so a future reusable `WorkoutTemplate` remains unambiguous.

## Future Extensions

Add these only when real use requires them.

### Exercise Catalog

```text
exercises
exercise_aliases
equipment
muscle_groups
```

`workout_exercises` may later reference a canonical exercise while preserving the performed display name.

### Additional Set Metrics

```text
duration_seconds
distance_meters
bodyweight_kg
assistance_kg
tempo
rest_seconds
completed
```

These support planks, running, cycling, pull-ups, assisted movements, and more detailed lifting analysis.

### More Group Types and Explicit Rounds

```text
tri_set
giant_set
circuit
exercise_group_rounds
exercise_group_round_members
```

### Workout Templates and Programs

Keep reusable plans separate from performed history.

```text
workout_templates
workout_template_exercises
programs
program_days
```

### Recovery and Measurements

```text
recovery_entries
measurements
goals
preferences
```

All should be timestamped or validity-ranged to preserve history.

### AI Observations

```text
derived_observations
├── observation
├── evidence/provenance
├── confidence
├── created_at
└── superseded_at
```

Never store AI inference as an unqualified fact.

### Multi-User Support

The product is currently personal. Do not add `user_id` everywhere solely for hypothetical scale.

If multi-user support becomes a genuine goal, introduce an owner/account model through a deliberate migration and apply row-level authorization consistently.

## Schema Non-Goals

- A comprehensive exercise taxonomy in V1.
- A comprehensive food catalog in V1.
- Separate tables for every set type.
- Flat numbering that treats dropsets as working sets.
- Pairwise `superset_with` columns.
- Explicit superset rounds before they are needed.
- Duplicated date and weekday columns.
- Provider-specific Neon database features.
- Vector storage before a defined retrieval need exists.

## Migration Order

Recommended creation order:

```text
1. pgcrypto extension
2. exercise_set_type
3. workout_sessions
4. workout_exercises
5. exercise_sets
6. exercise_groups
7. exercise_group_members
8. meals
9. food_items
10. indexes and update triggers
11. optional cross-row validation triggers
```

## Database Definition of Done

The V1 database design is implemented correctly when:

- All tables are created through migrations.
- Session timestamps are timezone-aware.
- Checkout-before-check-in is rejected.
- Exercise and member order is deterministic and unique in scope.
- Warm-up and working sets cannot have parents.
- Dropsets require a parent working set from the same exercise.
- Nested dropsets beyond one level are rejected.
- Superset groups and members belong to the same session.
- Deleting owned parents does not leave orphan rows.
- Working sets, dropsets, and total physical sets can be counted independently.
- Exercise history and common superset pairings are queryable.
- Meal and food-item records can be stored even when nutrition values are unknown.

