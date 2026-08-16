# Nirantar MVP Goal

## Document Purpose

This document defines the immediate, deliberately constrained Nirantar MVP.

The MVP is not the full fitness intelligence platform. Its purpose is to collect the first trustworthy workout and meal records through a small backend and MCP surface, then support iterative improvement using real data.

## MVP Outcome

The MVP is successful when the user can:

1. Log a complete structured workout in one MCP call.
2. Retrieve recent workouts.
3. Retrieve the history of an exercise.
4. Log a meal in one MCP call.
5. Retrieve meals for a date or period.
6. Retrieve a basic daily summary.
7. Confirm that all saved data persists correctly in PostgreSQL.

The first real gym session should become Day 1 of the long-term dataset.

## Immediate Architecture

```text
ChatGPT / Claude / MCP Client
              |
              v
          FastMCP
              |
              v
       Shared Services
          /       \
     FastAPI    PostgreSQL
                    |
                  Neon
```

FastAPI and FastMCP must call the same service layer. Database logic must not be duplicated inside MCP tools.

```text
             workout_service
              /           \
         FastAPI           MCP

             nutrition_service
              /           \
         FastAPI           MCP
```

## Technology Choices

- Python.
- `uv` for project and dependency management.
- FastAPI for HTTP APIs.
- FastMCP for MCP tools.
- Pydantic for input and output validation.
- SQLAlchemy 2.x for database access.
- Alembic for migrations.
- PostgreSQL hosted on Neon.
- `DATABASE_URL` as the database configuration boundary.
- No Neon-specific SDK.

## In Scope

### Workout Sessions

- Gym check-in timestamp.
- Gym check-out timestamp, nullable until the session ends.
- Optional title and notes.
- Exercises in explicit order.
- Warm-up sets.
- Working sets.
- Dropsets nested under a working set.
- Weight and reps.
- Optional RIR and RPE.
- Superset grouping between exercises.

### Meals

- Meal timestamp.
- Meal name.
- Optional notes.
- Food-item name.
- Quantity and unit when known.
- Optional calories, protein, carbohydrates, and fat.

The MVP does not need a comprehensive nutrition database. Free-form food names and nullable nutrition values are acceptable.

### History

- Recent workouts.
- Exercise-specific history.
- Meals by date or period.
- Basic daily summary.

### Interfaces

- High-level MCP tools.
- Minimal FastAPI endpoints where useful for testing or future reuse.
- Shared domain services underneath both interfaces.

## Required MCP Tools

Keep the initial MCP surface small.

```text
log_workout
get_recent_workouts
get_exercise_history
log_meal
get_meals
get_meal
edit_meal
delete_meal
get_daily_summary
```

### `log_workout`

Accept an entire workout as one structured input and save it in one database transaction.

It should not require an AI client to call:

```text
create_session
add_exercise
add_set
add_set
create_group
add_group_member
finish_session
```

Example conceptual input:

```json
{
  "check_in_at": "2026-08-16T07:05:00+05:45",
  "check_out_at": "2026-08-16T08:12:00+05:45",
  "title": "Arms",
  "exercises": [
    {
      "client_ref": "curl",
      "name": "Bicep Curl",
      "order": 1,
      "sets": [
        {
          "client_ref": "curl-warmup-1",
          "order": 1,
          "type": "warmup",
          "weight_kg": 5,
          "reps": 15
        },
        {
          "client_ref": "curl-work-1",
          "order": 2,
          "type": "working",
          "weight_kg": 10,
          "reps": 10
        },
        {
          "client_ref": "curl-work-2",
          "order": 3,
          "type": "working",
          "weight_kg": 15,
          "reps": 8
        },
        {
          "client_ref": "curl-work-3",
          "order": 4,
          "type": "working",
          "weight_kg": 20,
          "reps": 5,
          "dropsets": [
            {
              "order": 1,
              "weight_kg": 15,
              "reps": 6
            },
            {
              "order": 2,
              "weight_kg": 10,
              "reps": 8
            }
          ]
        }
      ]
    },
    {
      "client_ref": "pushdown",
      "name": "Tricep Pushdown",
      "order": 2,
      "sets": [
        {
          "order": 1,
          "type": "working",
          "weight_kg": 20,
          "reps": 12
        }
      ]
    }
  ],
  "groups": [
    {
      "type": "superset",
      "order": 1,
      "exercise_refs": ["curl", "pushdown"]
    }
  ],
  "notes": "First session back"
}
```

The public input may use nested dropsets and temporary client references even though the relational database stores flat rows and foreign keys. The service layer owns that translation.

### `get_recent_workouts`

Minimum inputs:

```text
limit
before (optional)
```

Return sessions with exercises and sets in deterministic order.

### `get_exercise_history`

Minimum inputs:

```text
exercise_name
start_at (optional)
end_at (optional)
limit (optional)
```

Return enough structure to distinguish warm-ups, working sets, and dropsets.

### `log_meal`

Accept a whole meal and its food items in one transaction.

Example:

```json
{
  "eaten_at": "2026-08-16T09:10:00+05:45",
  "name": "Breakfast",
  "items": [
    {"name": "Egg", "quantity": 3, "unit": "piece"},
    {"name": "Bread", "quantity": 2, "unit": "slice"},
    {"name": "Banana", "quantity": 1, "unit": "piece"}
  ]
}
```

### `get_meals`

Return meals and food items for a requested date or period.

### `get_meal`

Return one meal and its ordered food items by ID.

### `edit_meal`

Atomically update meal details or add, update, reorder, and remove food items.
Require the meal's current `updated_at` value to reject stale edits.

### `delete_meal`

Permanently delete a meal and its food items only after exact-ID confirmation
and a matching `updated_at` value.

### `get_daily_summary`

Return deterministic facts available for the requested date, such as:

- Workout count.
- Gym duration.
- Working-set count.
- Dropset count.
- Meals logged.
- Nutrition totals where known.

Do not use an LLM to calculate these values.

## MVP Data Model

Required workout tables:

```text
workout_sessions
workout_exercises
exercise_sets
exercise_groups
exercise_group_members
```

Required nutrition tables:

```text
meals
food_items
```

The detailed schema is defined in `Nirantar_Database_Design.md`.

## Service-Layer Requirements

### Transaction Boundaries

- A complete workout must save atomically.
- A complete meal must save atomically.
- A validation or database failure must not leave partial child rows.

### Validation

- `check_out_at` must be after `check_in_at` when present.
- Exercise and set order values must be positive.
- Weight and reps must not be negative.
- RIR and RPE must be within accepted ranges when present.
- A dropset must have a valid parent working set.
- Parent and child sets must belong to the same performed exercise.
- A superset member must belong to the same workout session as its group.
- Duplicate group membership must be rejected.

### Deterministic Ordering

Every retrieval path must explicitly order:

- Exercises by `exercise_order`.
- Top-level sets by `set_order`.
- Dropsets by their own `set_order` under the parent.
- Groups by `group_order`.
- Group members by `member_order`.

Never rely on implicit database row order.

### Time Handling

- Accept timezone-aware timestamps.
- Store timestamps as `TIMESTAMPTZ`.
- Derive date and weekday from the timestamp in the user's selected timezone.
- Do not duplicate derived date, day, entry-time, or exit-time columns.

### Error Behavior

Return clear, structured errors for:

- Invalid input.
- Missing references.
- Relationship violations.
- Conflicting order values.
- Database failures.

MCP tools must not expose secrets, raw stack traces, or database connection details.

## Engineering Guardrails

- Use one repository and one deployable backend initially.
- Keep domain logic outside FastAPI routes and MCP decorators.
- Use migrations for schema changes.
- Keep external schemas separate from ORM models.
- Use async database access consistently if the project is configured for async.
- Use database constraints in addition to application validation.
- Do not expose a generic `run_sql` MCP tool.
- Do not commit `.env` or `DATABASE_URL`.
- Do not couple domain logic to Neon-specific APIs.
- Prefer straightforward code over premature abstraction.

## Suggested Minimal Project Structure

Adapt this to the existing project rather than reorganizing working code solely to match the example.

```text
nirantar/
├── app/
│   ├── api/
│   ├── mcp/
│   ├── db/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   │   ├── workouts.py
│   │   └── nutrition.py
│   └── main.py
├── alembic/
├── tests/
├── .env
└── pyproject.toml
```

## Explicitly Out of Scope

Do not delay the MVP for any of the following:

- Native mobile application.
- PWA or web dashboard.
- Embedded AI coach.
- RAG pipeline.
- Vector database.
- Autonomous agents.
- Context engine.
- Personal ML.
- Recommendation engine.
- Progress charts.
- Workout templates.
- Comprehensive exercise catalog.
- Comprehensive nutrition database.
- Barcode scanning.
- HealthKit or wearable integrations.
- Progress photos.
- Social features.
- Payments.
- Multi-user authentication and authorization.
- Complex role systems.
- Microservices.
- Event streaming.
- Generic SQL access through MCP.

## Minimum Tests

### Workout Creation

- Saves a session, exercises, and sets.
- Saves warm-up and working sets.
- Saves dropsets with the correct working-set parent.
- Saves a superset and ordered members.
- Rolls back all rows when one child is invalid.

### Workout Retrieval

- Returns exercises and sets in order.
- Nests or clearly associates dropsets with their parent.
- Counts working sets separately from warm-ups and dropsets.
- Filters exercise history by name and period.

### Validation

- Rejects checkout before check-in.
- Rejects a dropset without a working-set parent.
- Rejects cross-exercise parent relationships.
- Rejects cross-session group membership.
- Rejects negative reps or weight.

### Meal Flow

- Saves a meal and all food items atomically.
- Retrieves meals by local date.
- Sums only available nutrition values correctly.

## Manual Acceptance Flow

Use an MCP client to perform these two end-to-end scenarios:

```text
Log today's workout: bicep curl 10 kg x 10, 15 kg x 8,
20 kg x 5 followed immediately by dropsets of 15 kg x 6
and 10 kg x 8. Superset curls with tricep pushdowns.
```

Then ask:

```text
Show my recent bicep curl history and separate working sets from dropsets.
```

Also verify:

```text
Log breakfast: 3 eggs, 2 slices of bread, and 1 banana.
```

Then ask:

```text
Show today's meals and daily summary.
```

## Definition of Done

The MVP is done when:

- Database migrations run successfully against Neon.
- Workout and nutrition tables exist with required constraints.
- Shared workout and nutrition services work.
- The required workout and meal MCP tools are available and validated.
- A complete workout can be saved in one transaction.
- Dropsets are linked to their parent working set.
- Superset exercises are linked through an exercise group.
- A complete meal can be saved in one transaction.
- Recent workout, exercise history, meal history, and daily summary retrieval work.
- Minimum automated tests pass.
- At least one end-to-end MCP logging and retrieval flow succeeds.
- No out-of-scope feature blocks use of the first real dataset.

## After the MVP

Implemented post-MVP measurement capability:

- Log one body-weight value for today or an explicit calendar date.
- Retrieve a specific day's weight or an inclusive date-range history.
- Calculate first weight, last weight, measurement count, and change in ordinary code.
- Correct an existing day's weight using stale-write protection.
- Expose `log_weight`, `get_weight`, `get_weight_history`, and `edit_weight` through MCP.

Iterate from actual usage. The first likely improvements are:

1. Correct friction discovered during real workout logging.
2. Add edit and delete flows with safe identifiers.
3. Add basic progress and consistency summaries.
4. Add a fast mobile logging interface.
5. Add workout templates and an exercise catalog only when repetition makes them valuable.
6. Add richer nutrition, recovery, and measurements.
7. Build the context engine after enough reliable history exists.

