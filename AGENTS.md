# Nirantar Agent Guidelines

Nirantar is a personal fitness data platform for one user in Nepal.
Favor correctness, simplicity, reliable history, and daily usefulness over scale.

`CLAUDE.md` points to this file. Edit `AGENTS.md` directly.

## Before Changing Code

- Read this file completely.
- Inspect the repository and current working tree.
- Preserve unrelated user changes.
- Check for a closer `AGENTS.md`; it governs its subtree.
- Read task-relevant parts of `docs/MVP.md`, `docs/DATABASE.md`, and `docs/PRD.md`.
- Inspect relevant code, migrations, tests, and callers.
- Follow applicable guidance in `.agents/skills`.

Resolve conflicts in this order: user request, closest `AGENTS.md`, MVP,
database design, PRD, then existing tests/code. Explain genuine conflicts.

## Scope

Prioritize the MVP:

- Workout sessions with ordered exercises, sets, dropsets, and supersets.
- Meal and food-item logging.
- Workout, exercise, and meal history.
- Deterministic summaries and calculations.
- High-level HTTP and MCP operations.

Do not add without an explicit requirement:

- Multi-user, authentication, billing, subscription, or social systems.
- Microservices, event streaming, RAG, vectors, or autonomous agents.
- Embedded coaching LLMs, personal ML, wearables, photos, or large catalogs.
- Generic SQL access through MCP.
- Neon-specific abstractions.

## Technology

- Use repository-pinned versions and existing conventions.
- Use `uv`, FastAPI, FastMCP, Pydantic, SQLAlchemy, and Alembic.
- Treat Neon as standard PostgreSQL through `DATABASE_URL`.
- Keep async I/O consistent with the repository.
- Do not upgrade, reorganize, or broadly reformat without need.

## Architecture

- FastAPI and FastMCP must call the same application services.
- Keep business rules out of routes and MCP decorators.
- Use Pydantic for external contracts and SQLAlchemy for persistence.
- Never expose raw ORM objects through public interfaces.
- Accept natural nested input and persist normalized rows.
- Keep modules small; avoid ceremonial layers and abstractions.
- Make workout and meal aggregate operations atomic.
- Keep commit and rollback at a clear service boundary.
- Calculate facts with SQL or ordinary code, not an LLM.
- Core logging and history must work without AI.

## Domain Rules

### Time

- Accept timezone-aware timestamps.
- Store timestamps as PostgreSQL `TIMESTAMPTZ`.
- Use `Asia/Kathmandu` unless explicitly configured otherwise.
- Never infer the user's timezone from the server.
- Checkout must be later than check-in when present.
- Derive local dates, times, weekdays, and durations.

### Workouts and Sets

- One `WorkoutSession` represents one performed session.
- Exercise order must be positive, unique, and explicit.
- Retrieval must never depend on implicit row order.
- Store every physical set as one row.
- Supported set types are `warmup`, `working`, and `dropset`.
- Warm-up and working sets have no parent.
- A dropset requires a top-level working-set parent.
- Parent and child must belong to the same performed exercise.
- Do not allow nested dropsets in V1.
- Weight and reps cannot be negative.
- Validate nullable RIR and RPE ranges.
- Count working sets, dropsets, and physical sets separately.

### Supersets and Nutrition

- Model supersets as ordered groups, not pairwise links.
- Group members must belong to the same workout session.
- Membership and member order must be unique in a group.
- A meal and its items must be saved atomically.
- Unknown nutrition values remain `NULL`, never forced to zero.
- Report incomplete nutrition totals honestly.
- Preserve historical events; do not replace them with snapshots.
- Never store AI inference as an unqualified fact.

## Database and Contracts

- Every schema change requires an Alembic migration.
- Keep migrations and ORM metadata aligned.
- Prefer database constraints for local invariants.
- Validate cross-row rules in services or focused triggers.
- Define foreign-key deletion behavior and scoped uniqueness.
- Add indexes only for real query paths.
- Prefer additive or staged migrations.
- Never rewrite an already-applied shared migration.
- Confirm the database target before applying migrations.
- Never print credentials or connection URLs.
- Keep API and MCP inputs explicit about units and optionality.
- Return stable, ordered structures with required IDs.
- Use ISO 8601 timestamps with offsets.
- Reject ambiguous references instead of guessing.
- Prefer aggregate-level MCP tools over many tiny tools.
- Never expose arbitrary SQL, secrets, or internal stack traces.
- Treat public API and MCP schemas as contracts.

## Security and Code Quality

- Treat fitness and nutrition records as sensitive data.
- Never commit `.env`, secrets, tokens, or database URLs.
- Use SQLAlchemy expressions or parameterized SQL.
- Validate all external input and return only necessary data.
- Do not add telemetry or external sharing without approval.
- Keep functions focused, typed, and explicit about side effects.
- Use precise domain names and units such as `weight_kg`.
- Use decimal/database numeric types for persisted quantities.
- Comment intent and non-obvious invariants only.
- Avoid dead code, placeholders, speculative hooks, and cleanup churn.

## Tests and Verification

- Add proportionate tests for every behavior change.
- Test pure rules, services, PostgreSQL behavior, and contracts.
- Do not use SQLite as proof of PostgreSQL behavior.
- Test ordering, transactions, invalid relationships, and rollback.
- Test dropsets, supersets, nullable nutrition, and incomplete totals.
- Test Nepal offsets and UTC date-boundary cases.
- For bugs, reproduce first and make the smallest coherent fix.
- Discover configured commands before running them.
- Start with focused checks, then run the broadest relevant suite.
- Never claim a check passed unless it was actually run.

## Working Rules

- Keep changes limited to the requested outcome.
- Update code, tests, migrations, contracts, and docs together.
- Use safe, reversible assumptions when conventions answer the question.
- Ask before destructive data changes or material contract changes.
- Ask before adding external services, paid APIs, or infrastructure.
- Review the final diff for unrelated changes and secrets.
- Report what changed, what was verified, and any limitation.

Prefer accurate history, explicit semantics, deterministic logic, and easy use.
