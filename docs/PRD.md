# Nirantar Product Requirements Document

## Document Purpose

This document defines the long-term product vision and end goal for Nirantar.

Nirantar is a personal fitness intelligence platform where each person owns their own account and history. It is not intended to compete with generic commercial fitness trackers. Its purpose is to make consistency and progress visible, preserve high-quality longitudinal fitness data, and let multiple AI systems reason over that data safely through APIs and MCP.

## Product Name

**Nirantar — निरन्तर**

Meaning: continuous, consistent, uninterrupted.

The name reflects the central product philosophy:

> Consistency creates progress.

## Background

The user is restarting gym training after an inconsistent period. Lack of visible progress previously contributed to demotivation and eventually stopping.

Nirantar should create a positive feedback loop:

```text
Train
  -> Log
  -> See evidence of consistency and progress
  -> Understand patterns
  -> Stay motivated
  -> Train again
```

The system should treat showing up as progress, even when short-term strength or physique changes are slow.

## Product Vision

Build a personal fitness operating system in which:

- PostgreSQL is the durable source of truth.
- Fitness events are stored as granular, timestamped historical data.
- A fast mobile interface handles repetitive daily logging.
- REST/API services provide deterministic product functionality.
- MCP exposes safe, high-level domain capabilities to ChatGPT, Claude, coding agents, and future AI clients.
- A context engine retrieves only the evidence relevant to a question or decision.
- AI acts as an analyst, assistant, and coach—not an unquestionable authority.
- The user's data remains portable and is never trapped in one interface or AI provider.

## End Goal

The long-term end goal is a deeply personalized fitness intelligence system that understands the user's training, nutrition, recovery, measurements, goals, preferences, constraints, and historical behavior.

It should help answer questions such as:

- Am I becoming more consistent?
- Which lifts are progressing, stable, or stalling?
- Which exercises and training patterns work best for me?
- How frequently do I use dropsets, supersets, and other techniques?
- Which exercise combinations do I most commonly superset?
- What patterns appear before my consistency declines?
- How do sleep, energy, soreness, nutrition, and training load relate to performance?
- What should I consider changing, and what evidence supports that suggestion?
- How did I get from one point in my fitness journey to another?

The system should eventually support evidence-based coaching context such as:

```text
User goal
Current program
Recent workouts
Exercise progression
Recent training load
Nutrition trends
Sleep, energy, soreness, and stress
Available time and equipment
Relevant preferences
Previous recommendations and outcomes
```

## Product Positioning

Nirantar is not primarily:

- A generic workout tracker.
- A calorie database.
- An LLM chat screen attached to CRUD forms.
- A social fitness network.

Nirantar is:

> A personal AI-native fitness data platform with first-class MCP access.

Existing products already provide polished workout and food logging. Nirantar is justified by its combination of personal data ownership, interoperability, structured historical data, context engineering, experimentation, and personalized AI reasoning.

## Users

Each person signs in to their own account and owns their own fitness history. No
account may read or change another account's records.

The developer and owner remains the reference user: the workflow the product is
designed and tested against first.

The product may still deliberately omit commercial-product requirements such as:

- Social feeds and sharing.
- Subscription and payment flows.
- Advertisements.
- Generic discovery content.

The interface and data model should be optimized for real logging workflow rather
than broad market appeal.

## Core Product Principles

### 1. Consistency Is a First-Class Outcome

The product should make attendance and adherence visible, not only performance changes.

Useful signals include:

- Gym sessions completed.
- Planned versus completed sessions.
- Weekly and monthly consistency.
- Days since restart.
- Milestones such as 10, 25, 50, and 100 workouts.
- Sustainable trends rather than day-to-day noise.

### 2. The Database Is the Product Core

Interfaces will change. AI providers will change. The historical dataset and domain logic must remain stable.

```text
Mobile App ----\
Web UI ---------> Domain Services -> PostgreSQL
MCP Clients ----/
```

### 3. Historical Data Must Not Be Overwritten

Store timestamped events and observations rather than only current state.

Prefer:

```text
measurement(timestamp, metric, value)
```

over:

```text
current_weight = value
```

This applies to workouts, meals, recovery, measurements, goals, recommendations, and derived observations.

### 4. Raw Data Should Be Granular and Structured

Store the facts required for future analysis:

- Individual exercises and sets.
- Weight, reps, set type, and notes.
- Warm-up, working, and dropset semantics.
- Parent-child relationships between working sets and dropsets.
- Superset membership and exercise order.
- Check-in and check-out timestamps.
- Individual meals and food items.
- Recovery observations and measurements.

Do not prematurely replace source data with summaries.

### 5. SQL Calculates; LLMs Reason

Deterministic logic should calculate facts such as:

- Workout counts.
- Set counts and training volume.
- Session duration.
- Personal records.
- Weekly consistency.
- Nutrition totals.

LLMs should reason about higher-level questions such as:

- What appears to be stalling?
- What patterns may explain inconsistent training?
- What adjustments are worth considering?
- What evidence supports a recommendation?

### 6. The Product Must Work Without AI

Core capabilities must remain deterministic:

- Log and edit workouts.
- Log and edit meals.
- View history.
- Track measurements and recovery.
- Calculate summaries and progression.

AI is an optional intelligence layer, not a dependency for basic operation.

### 7. MCP Should Expose Domain Capabilities

MCP tools should be high-level and task-oriented.

Good examples:

```text
log_workout
get_recent_workouts
get_workouts
get_exercise_history
get_training_summary
log_meal
get_daily_nutrition
get_recovery_summary
build_coaching_context
```

Avoid exposing unrestricted SQL or forcing an AI client to orchestrate many tiny database operations.

### 8. AI Outputs Must Be Evidence-Based and Auditable

Recommendations should identify their basis and uncertainty.

```text
Recommendation:
Consider a lighter session today.

Evidence:
- Training frequency increased this week.
- Recent performance declined.
- Energy was reported as lower.

Confidence:
Moderate.
```

AI-generated observations should be stored, if at all, with:

```text
observation
evidence
created_at
confidence
```

An inference must not silently become a permanent fact.

### 9. Optimize for Low-Friction Logging

Structured manual input will often be faster than conversation during a workout. The future mobile interface should minimize taps and show relevant previous performance.

Conversational logging remains valuable when the user is tired, wants to backfill data, or prefers to dictate a workout.

### 10. Build Iteratively From Real Data

Advanced analytics and ML require meaningful history. Simple SQL, trends, and charts will provide more value early than premature prediction systems.

## Functional Scope

### Training

- Record gym check-in and check-out.
- Derive date, day, time, and duration from timestamps.
- Record exercises in performance order.
- Record warm-up, working, and dropsets.
- Nest dropsets under the working set that triggered them.
- Group exercises into supersets.
- Preserve order within a superset.
- Record weight, reps, and notes.
- View exercise history and progress.
- Calculate working sets separately from warm-ups and dropsets.
- Track personal records and training consistency.

### Nutrition

- Record meals and food items.
- Record portions and units.
- Store calories and macronutrients when known.
- Support simple notes when nutrition details are incomplete.
- Calculate daily and period summaries.
- Integrate an external or open nutrition source later rather than rebuilding a massive food database.

### Recovery

- Record sleep, soreness, energy, stress, and rest days.
- Retrieve recent recovery context for analysis.
- Compare recovery observations with training performance carefully, without treating correlation as causation.

### Measurements and Progress

- Record timestamped body and performance measurements.
- Track strength progression and personal records.
- Track consistency and adherence.
- Compare periods.
- Present long-term trends without overemphasizing short-term fluctuations.

### Goals and Preferences

- Store current and historical goals.
- Store training and dietary preferences.
- Store equipment, schedule, and workout-duration constraints.
- Retain history when goals or preferences change.

### AI and Context Engineering

- Build task-specific context instead of sending the full database.
- Support temporal retrieval, summaries, SQL analytics, preferences, and provenance.
- Keep coaching recommendations tied to evidence.
- Allow ChatGPT, Claude, and other MCP clients to use the same platform.

## Context Engine

The long-term context engine should be a distinct backend capability.

```text
Context Engine
├── Training Context Builder
├── Nutrition Context Builder
├── Recovery Context Builder
├── Progress Context Builder
└── Coaching Context Builder
```

Example interface:

```python
build_context(
    task="workout_recommendation",
    as_of="2026-08-16T07:00:00+05:45",
)
```

It may retrieve:

- Current goals and program.
- Last 14 days of workouts.
- Relevant exercise progression.
- Recent volume and frequency.
- Sleep, energy, soreness, and stress.
- Available time and equipment.
- Relevant preferences.
- Previous recommendations and their outcomes.

A nutrition review should retrieve a different, narrowly relevant context set.

## AI Coaching Harness

A future coaching workflow may follow this shape:

```text
User Question
  -> Intent Router
  -> Context Planner
  -> Tool Selection
  -> Domain Tools / MCP
  -> Context Assembly
  -> Coach Reasoning
  -> Validation
  -> Recommendation
  -> Optional Memory Extraction
```

Specialized training, nutrition, recovery, and progress analysis can begin as prompts and tools inside one orchestration system. Separate autonomous agents are not required initially.

## Memory Model

Nirantar may eventually maintain three distinct forms of memory.

### Factual Memory

Stored as structured source data in PostgreSQL.

```text
Workout X happened on August 16.
Bench press set Y was 65 kg x 6.
```

### Preference Memory

Stable or explicitly recorded user preferences.

```text
Prefers shorter workouts.
Usually trains in the morning.
```

### Derived Memory

AI-generated observations that remain evidence-linked and uncertain.

```text
Performance may decline after several high-volume sessions.
```

Derived memory must include evidence, timestamp, and confidence.

## Target Architecture

```text
                   Mobile App
                       |
                       v
ChatGPT / Claude -> MCP Server
                       |
Web UI ----------> API / Domain Services
                       |
                       v
                PostgreSQL on Neon
                       |
                       v
                 Context Engine
```

Implementation direction:

- Python.
- FastAPI.
- FastMCP.
- SQLAlchemy 2.x.
- Alembic.
- PostgreSQL hosted on Neon and accessed through `DATABASE_URL`.
- Pydantic models for external contracts.
- React Native/Expo for a future native mobile application.

The backend should treat Neon as standard PostgreSQL and avoid provider-specific coupling.

## Interface Strategy

### Mobile App

Best for fast, repetitive, structured logging.

Potential long-term native capabilities:

- Health integrations.
- Notifications and widgets.
- Camera-assisted meal logging.
- Haptics.
- Offline support.
- Apple Watch integration.

### ChatGPT, Claude, and Other MCP Clients

Best for:

- Natural-language logging.
- Backfilling historical data.
- Deep analysis.
- Coaching questions.
- Unusual queries and experimentation.

### Backend and Database

The permanent core. All interfaces must use the same domain services and source of truth.

## Non-Goals

- Competing with commercial food databases.
- Building a public social product.
- Depending on a single LLM provider.
- Sending all historical data to every model request.
- Allowing an AI model unrestricted database access.
- Treating AI suggestions as medical advice or unquestionable commands.
- Building complex ML before sufficient data exists.

## Roadmap

### V1: Data Collection Core

- Workout logging.
- Meal logging.
- MCP tools.
- Basic history.
- Deterministic backend services.

### V2: Progress Visibility

- Progress charts.
- Personal-record tracking.
- Workout templates.
- Nutrition summaries.
- Consistency tracking.

### V3: Context and Coaching

- Task-specific context engine.
- AI coaching workflows.
- Weekly reviews.
- Training-pattern analysis.
- Evidence-linked recommendations.

### V4: Broader Health Context

- Health integrations.
- Sleep and recovery.
- Progress photos if desired.
- Advanced analytics.

### V5: Personal ML and Experimentation

- Plateau detection.
- Training-response modeling.
- Consistency-risk signals.
- Recommendation experiments.
- Evaluation of coaching strategies.

## Long-Term Success Criteria

Nirantar succeeds if it:

- Reduces the friction of capturing accurate fitness data.
- Makes consistency and progress impossible to overlook.
- Accumulates a trustworthy longitudinal dataset.
- Allows the user to change interfaces and AI providers without losing the system's core value.
- Produces analysis grounded in the user's real history.
- Helps the user reflect and make informed decisions without surrendering agency to AI.
- Remains useful as a deterministic fitness tracker even when no LLM is available.

