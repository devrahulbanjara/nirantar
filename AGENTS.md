# Nirantar Agent Guidelines

Nirantar is a personal fitness data platform. Each person signs in to their own
account and owns their own history; the default timezone is `Asia/Kathmandu`.
Favor correctness, simplicity, reliable history, and daily usefulness over scale.

`CLAUDE.md` points to this file. Edit `AGENTS.md` directly.

## Before Changing Code

- Read this file completely.
- Inspect the repository and working tree; preserve unrelated user changes.
- Check for a closer `AGENTS.md`; it governs its subtree.
- Read task-relevant parts of `docs/MVP.md`, `docs/DATABASE.md`, and `docs/PRD.md`.
- Inspect relevant code, migrations, tests, and callers.
- Follow applicable guidance in `.agents/skills`.

Resolve conflicts in this order: user request, closest `AGENTS.md`, MVP,
database design, PRD, then existing tests/code. Explain genuine conflicts.

## Scope

Prioritize the MVP:

- Workout sessions with ordered exercises, sets, dropsets, and supersets.
- Meal and food-item logging plus workout, exercise, and meal history.
- Deterministic summaries and calculations.
- High-level HTTP and MCP operations.
- Clerk authentication for the web interface.

Do not add without an explicit requirement:

- Billing, subscription, or social systems.
- Microservices, event streaming, RAG, vectors, autonomous agents, or generic SQL MCP.
- Embedded coaching LLMs, personal ML, wearables, photos, large catalogs, or Neon-specific abstractions.

## Technology

- Use repository-pinned versions and existing conventions.
- Use `uv`, FastAPI, FastMCP, Pydantic, SQLAlchemy, and Alembic.
- Use Clerk for web authentication; read its keys from the environment.
- Treat Neon as standard PostgreSQL through `DATABASE_URL`.
- Keep async I/O consistent with the repository.
- Do not upgrade, reorganize, or broadly reformat without need.

## Task and Tool Routing

- FastAPI/Pydantic/HTTP work: use `fastapi`; FastMCP servers, clients, tools, transports, mounting, or tests: use `fastmcp`.
- SQLAlchemy models, PostgreSQL behavior, or Alembic migrations: use `sqlalchemy-postgres`.
- Product UI: read `frontend/AGENTS.md` and `frontend/DESIGN.md` before editing.
- Use `impeccable` for product UI and `ui-ux-pro-max` for focused research; `DESIGN.md` remains authoritative.
- Use `design-taste-frontend` only for landing, marketing, or visual-redesign work, not Nirantar's multi-step product UI.
- Use 21st MCP for component patterns, Playwright MCP for running-UI tests, and Render MCP only for deployment diagnostics.
- Claude, Codex, and Cursor MCP configs are `.mcp.json`, `.codex/config.toml`, and `.cursor/mcp.json`.
- Agent MCP variable references read the launching process environment, not root `.env` automatically.

## Architecture

- FastAPI and FastMCP call the same services; keep business rules out of their adapters.
- Use Pydantic for external contracts and SQLAlchemy for persistence.
- Never expose raw ORM objects through public interfaces.
- Accept natural nested input and persist normalized rows.
- Keep modules small; avoid ceremonial layers and abstractions.
- Make workout and meal operations atomic with commit and rollback at the service boundary.
- Calculate facts with SQL or ordinary code, not an LLM.
- Core logging and history must work without AI.
- The Next.js UI calls FastAPI over HTTP; browser code must not use MCP as its data layer.

## Domain Rules

### Time

- Accept timezone-aware timestamps and store them as PostgreSQL `TIMESTAMPTZ`.
- Use `Asia/Kathmandu` unless configured; never infer timezone from the server.
- Checkout must follow check-in; derive local dates, times, weekdays, and durations.

### Workouts and Sets

- One `WorkoutSession` represents one performed session.
- Exercise order is positive, unique, explicit, and used for every retrieval.
- Store each physical set as one row with type `warmup`, `working`, or `dropset`.
- Warm-up and working sets have no parent; a dropset requires a top-level working-set parent in the same performed exercise.
- Do not allow nested dropsets in V1.
- Weight and reps cannot be negative.
- Count working sets, dropsets, and physical sets separately.

### Supersets and Nutrition

- Model supersets as ordered groups, not pairwise links.
- Group members belong to one workout session; membership and member order are unique.
- A meal and its items must be saved atomically.
- Unknown nutrition values remain `NULL`, never forced to zero.
- Report incomplete nutrition totals honestly.
- Preserve historical events; do not replace them with snapshots.
- Never store AI inference as an unqualified fact.

## Database and Contracts

- Every schema change requires an Alembic migration.
- Keep migrations and ORM metadata aligned; prefer database constraints for local invariants.
- Validate cross-row rules in services or focused triggers.
- Define foreign-key deletion behavior and scoped uniqueness.
- Add indexes only for real query paths; prefer additive or staged migrations.
- Never rewrite an already-applied shared migration.
- Confirm the database target before applying migrations.
- Never print credentials, tokens, or connection URLs.
- Keep API and MCP inputs explicit about units and optionality.
- Return stable, ordered structures with required IDs.
- Use ISO 8601 timestamps with offsets.
- Reject ambiguous references instead of guessing.
- Prefer aggregate-level MCP tools over many tiny tools.
- Never expose arbitrary SQL, secrets, or internal stack traces.
- Treat public API and MCP schemas as contracts.

## Security and Code Quality

- Treat fitness and nutrition records as sensitive data.
- Never commit `.env`, secrets, tokens, Clerk keys, or database URLs.
- Enforce authentication in the API, not only in the UI; a signed-out request must not reach data.
- Do not assume `.env` populates agent MCP variables; export them before launching the agent.
- Use SQLAlchemy expressions or parameterized SQL.
- Validate all external input and return only necessary data.
- Do not add telemetry or external sharing without approval.
- Keep functions focused, typed, explicit about side effects, and precise about units such as `weight_kg`.
- Use decimal/database numeric types for persisted quantities.
- Comment intent and non-obvious invariants only.
- Avoid dead code, placeholders, speculative hooks, and cleanup churn.

## Tests and Verification

- Add proportionate tests for every behavior change.
- Test pure rules, services, PostgreSQL behavior, and contracts.
- Do not use SQLite as proof of PostgreSQL behavior.
- Test ordering, transactions, invalid relationships, rollback, dropsets, supersets, nullable nutrition, and incomplete totals.
- Test Nepal offsets and UTC date-boundary cases.
- For bugs, reproduce first and make the smallest coherent fix.
- Discover configured commands; start focused, then run the broadest relevant suite.
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
