# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Nirantar serves one user in Nepal who records fitness data during daily life and
workouts, often one-handed on a phone and with limited attention.

## Product Purpose

Nirantar makes workout, meal, and body-weight history trustworthy and easy to
record. Success means the user can log complete records quickly, review the
saved truth, and rely on deterministic summaries without an AI dependency.

## Positioning

Nirantar combines user-owned structured fitness history with both a direct web
interface and high-level MCP operations over the same backend services.

## Operating Context

- Phone-first logging at the gym and around meals.
- Review and correction of exact historical records.
- Nepal-local dates and times using `Asia/Kathmandu`.
- FastAPI HTTP for the browser and MCP for AI clients.

## Capabilities and Constraints

- Log and review workouts, ordered exercises, sets, dropsets, and supersets.
- Log and review meals with ordered food items and nullable nutrition values.
- Log daily body weight and retrieve deterministic daily summaries.
- Single-user and unauthenticated for the current MVP; no profile or account UI.
- PostgreSQL remains the source of truth; the frontend does not invent totals.

## Brand Commitments

The product name is Nirantar. Its voice is calm, direct, and factual. It avoids
gamification pressure, unsupported coaching claims, and ambiguous health data.

## Evidence on Hand

The implemented FastAPI contracts, PostgreSQL schema, tests, and product docs
are the only product evidence. Do not fabricate testimonials, outcomes, or
coaching claims.

## Product Principles

1. Make common logging actions immediate.
2. Preserve exact history and honest unknown values.
3. Prefer clear daily utility over speculative features.
4. Keep calculations deterministic and server-owned.
5. Make every core flow usable without AI.

## Accessibility & Inclusion

Meet WCAG AA, support keyboard use and 200% zoom, keep touch targets at least
44px, and never communicate data state through color alone.
