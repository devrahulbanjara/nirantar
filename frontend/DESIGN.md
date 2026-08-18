# Nirantar Design System

## Direction

Nirantar is a mobile-first personal fitness log. The interface should make recording a workout, meal, or body weight feel immediate while keeping historical data easy to trust and review.

Use Airbnb's product UI as a craft reference: calm white surfaces, strong hierarchy, generous touch targets, rounded controls, restrained elevation, and clear mobile actions. This is an inspiration, not a visual clone. Nirantar replaces travel imagery and promotional layouts with dense, readable fitness data and a Nepal-inspired crimson accent.

Mode: **Operate**. Task completion and legibility take priority over decoration.

## Product and Data Boundary

- Build a responsive Next.js web application in `frontend/`; optimize for phone use first.
- The browser calls the FastAPI HTTP API. MCP is for AI clients and is never the browser data layer.
- PostgreSQL and backend services remain the source of truth; the UI does not recalculate authoritative summaries.
- Display server-provided IDs, timestamps, ordering, totals, and completeness without changing their meaning.
- Use `Asia/Kathmandu` for user-facing calendar dates and times.
- Authentication uses Clerk. Sign-in and sign-up are full-page routes outside the app shell and follow these tokens, states, and accessibility rules like any other surface.
- Email, Apple, Facebook, and Google are the supported sign-in methods. Clerk instance settings control provider availability; the UI must not duplicate provider logic.
- Auth start screens use one heading and no subtitle. Later-step instructions remain visible when they explain verification, recovery, or an error.
- Signed-out users may reach the public landing page and auth routes. Logging and history surfaces require a signed-in session.

## MVP Information Architecture

### Today

- Lead with today's local date, quick actions, and the deterministic daily summary.
- Show current body weight when logged, today's workout state, meals, known nutrition totals, and completeness.
- Keep `Log workout`, `Log meal`, and `Log weight` reachable without scrolling on a common phone viewport.

### Workouts

- Provide a recent-workout list, workout detail, new-workout flow, and edit flow.
- The editor handles check-in/out, ordered exercises, physical sets, nested dropsets, supersets, title, and notes.
- Workout detail preserves exercise, set, dropset, and superset order exactly as returned.

### Meals

- Provide a date-grouped meal list, meal detail, new-meal flow, and edit flow.
- The editor saves a meal and all ordered food items as one aggregate.
- Show per-item nutrition only when known and label incomplete totals honestly.

### History

- Combine date navigation with exercise history and body-weight history entry points.
- Let the user inspect exact historical records before introducing charts.
- Filters must preserve the active local-date range and be easy to clear.

## Critical Flows

1. Start or log a workout, add ordered exercises and sets, optionally add dropsets or a superset, then save once.
2. Open a workout, edit against its current `updated_at`, resolve stale conflicts without losing the draft, or delete with exact confirmation.
3. Log a meal with multiple food items, review nutrition completeness, and save the aggregate once.
4. Open, edit, reorder, or delete a meal with the same stale-write and confirmation protections.
5. Log or correct one body-weight value for a Nepal-local calendar date.
6. Review today's deterministic summary and move into the underlying records.

## Experience Principles

1. **Log without friction.** Common actions stay within thumb reach and require minimal typing.
2. **Show the saved truth.** IDs, timestamps, units, set types, nutrition completeness, and edit state remain explicit.
3. **Design for the gym.** Controls work one-handed, under poor attention, on a small screen.
4. **Make history scannable.** Repeated structures align so changes are easy to compare.
5. **Stay calm.** Use color, motion, and elevation only to explain state or action.

## Visual Character

- Bright, warm, precise, and personal.
- White canvas with soft gray grouped surfaces.
- Charcoal text and one primary crimson accent.
- Rounded cards and controls; avoid excessive pills.
- One subtle shadow level for floating or sticky elements only.
- Information and typography lead; photography is not part of the app shell.
- Light theme first. Do not add dark mode until it is requested.

## Landing Page

- The signed-out landing page is product-led and uses the same tokens, logo, typography, controls, and data language as the authenticated app.
- The first viewport pairs a concise value proposition and shared sign-in/sign-up actions with an illustrative daily summary built from real Nirantar concepts.
- Mark illustrative fitness values as examples. Do not present them as user data or product claims.
- Explain only the core path: log workouts, meals, and body weight; review exact history; use that history through MCP-compatible AI tools.
- Avoid generic feature-card grids, testimonials, invented metrics, decorative photography, and repeated marketing claims.
- Closing actions and the footer remain unboxed, aligned to the main content container, and visually quiet.

## Color Tokens

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#FFFFFF` | Page background |
| `surface` | `#F7F7F8` | Grouped sections and disabled surfaces |
| `surface-strong` | `#EEEFF1` | Selected neutral states |
| `border` | `#DCDDE1` | Dividers and control borders |
| `hairline-soft` | `#EBEBEB` | Subtle separators in long lists and sections |
| `border-strong` | `#B8BBC1` | Emphasized and focused control borders |
| `ink` | `#202124` | Headings and primary values |
| `text` | `#3F4248` | Body copy |
| `muted` | `#686D76` | Metadata and helper text |
| `primary` | `#D4143A` | Primary action, active navigation, focus accent |
| `primary-active` | `#B90F31` | Pressed primary controls |
| `primary-disabled` | `#F4B8C5` | Disabled primary controls |
| `primary-soft` | `#FCE8ED` | Selected background and subtle highlight |
| `on-primary` | `#FFFFFF` | Text and icons on primary controls |
| `success` | `#18794E` | Confirmed completion |
| `warning` | `#946200` | Incomplete or attention state |
| `danger` | `#B42318` | Destructive action and validation error |
| `info` | `#175CD3` | Informational status |
| `scrim` | `rgb(0 0 0 / 50%)` | Modal and sheet backdrop |

Keep roughly 90% of each surface white, gray, and ink. Reserve crimson for primary actions, active navigation, selected states, important links, and focus accents. Semantic colors appear only when their meaning requires them.

Do not use color as the only indicator. Pair status colors with text and an icon. Use `on-primary` only on high-emphasis primary controls.

## Typography

- Use Geist Sans, falling back to `Inter`, `Segoe UI`, and `sans-serif`.
- Use tabular numbers for weights, reps, nutrition, duration, dates, and times.
- Default body size is `16px` with at least `1.5` line height.
- Keep headings compact and sentence case.
- Keep page titles near `28px` and use modest weights. Workout values, ordering, summaries, and whitespace carry hierarchy instead of oversized display type.

| Role | Size / line height | Weight |
| --- | --- | --- |
| Page title | `28 / 34px` | 650 |
| Section title | `22 / 28px` | 650 |
| Card title | `18 / 24px` | 600 |
| Body | `16 / 24px` | 400 |
| Label | `14 / 20px` | 600 |
| Metadata | `13 / 18px` | 450 |
| Numeric value | `20 / 24px` | 650 |

## Spacing, Radius, and Elevation

Use a 4px base grid.

- Spacing: `4, 8, 12, 16, 24, 32, 48, 64`.
- Mobile page gutter: `16px`; tablet: `24px`; desktop: `32px`.
- Control radius: `10px`.
- Card radius: `14px`.
- Sheet and modal radius: `20px` on exposed corners.
- Pill radius: use only for compact filters, tags, and statuses.
- Use one shadow tier: `0 0 0 1px rgb(0 0 0 / 2%), 0 2px 6px rgb(0 0 0 / 4%), 0 4px 8px rgb(0 0 0 / 10%)`.
- Ordinary cards remain flat. Apply the shadow only to dialogs, sheets, floating menus, and sticky action bars.

## Layout

- Mobile-first breakpoint: `< 744px`.
- Tablet: `744px–1127px`.
- Desktop: `>= 1128px`.
- Wide: `> 1440px`; retain the content caps and absorb extra width as outer whitespace.
- Main content maximum width: `1120px`.
- Form and reading column maximum width: `680px`.
- Use one column for logging on mobile. On desktop, a secondary summary may sit beside the form.
- Never stretch cards, forms, or repeated data rows merely to fill a wide viewport.
- Never hide a primary action behind hover or a menu.
- Account for safe-area insets on fixed mobile controls.

## Navigation

Mobile navigation uses five persistent destinations:

1. Today
2. Workouts
3. Meals
4. Sleep
5. History

Use a bottom navigation bar on mobile and a compact side or top navigation on larger screens. Body weight belongs on Today or History; it does not need a permanent navigation item.

Settings is reached from the signed-in account menu rather than added as a sixth
persistent destination. Today uses four equal quick actions and four summary
cards: workout, nutrition, sleep, and body weight. Only an active meal streak is
shown near the date; workout consistency is weekly target progress, never a
daily workout streak.

The current destination needs an icon and label. Use one consistent SVG icon family; prefer Phosphor if no project icon library exists. Do not hand-draw routine icons or use emoji as interface icons. Never use a sparkle icon; label AI and MCP features directly instead.

## Core Components

### Buttons

- Primary buttons are solid crimson and at least `48px` high.
- Pressed primary buttons use `primary-active` without scale, translation, or shadow changes.
- Disabled primary buttons use `primary-disabled` with a readable ink label and never rely on opacity alone.
- Loading buttons retain their width, indicate progress, and prevent duplicate submission.
- Secondary buttons use a visible neutral border.
- Tertiary actions are text or icon buttons with a clear hover and focus state.
- Destructive buttons are visually secondary until confirmation.
- Icon-only touch targets are at least `44 × 44px` and require accessible labels.
- Labels describe the result: `Save workout`, `Add set`, `Log meal`.

### Inputs

- Standard inputs are `56px` high with a `10px` radius and a persistent visible label.
- Use a `1px` default border and a `2px` ink border on focus; do not add a decorative glow.
- Put units beside numeric fields; never encode the unit only in placeholder text.
- Use the appropriate mobile keyboard for numbers, decimals, dates, and times.
- Keep helper and validation text directly below the field.
- Preserve entered values after validation errors.
- Use native controls where they provide better mobile input behavior.

### Cards and Lists

- A card represents one meaningful aggregate: workout, exercise, meal, or weight entry.
- Align repeated numeric fields in columns.
- Use dividers inside a card before nesting more cards.
- Metadata order stays consistent: local date/time, title, summary, status.
- Entire-card click behavior must be obvious and keyboard accessible.

### Workout Logging

- One exercise card contains its ordered physical sets.
- Set rows show order, type, weight in kg, reps, and optional RIR/RPE.
- Warm-up, working, and dropset labels remain textual.
- Indent dropsets beneath their parent working set and preserve the connection with a line or grouping, not color alone.
- Superset members share a labeled group and explicit member order.
- `Add set` remains next to the current exercise; `Add exercise` follows the exercise list.
- Use a sticky mobile action bar for `Save workout` without covering the last fields.

### Meal Logging

- A meal card contains its ordered food items.
- Each item shows name first, then quantity/unit and known nutrition.
- Unknown nutrition displays `Not provided`, never `0`.
- Totals must state completeness, such as `Protein: 42 g · 2 of 3 items`.
- Adding another food item is an inline primary flow, not a separate page.

### History and Summaries

- Date grouping uses the user's `Asia/Kathmandu` calendar day.
- Filters open in a bottom sheet on mobile and a centered dialog on desktop.
- Summary tiles show one fact each and do not imply unavailable data.
- Use charts only when a trend is clearer than a compact list; always retain exact values.

### Sheets, Dialogs, and Feedback

- Use bottom sheets for short mobile choices and filters.
- Present the same form and filter popups as centered dialogs on tablet and desktop.
- Use dialogs for destructive confirmation and stale-edit conflicts.
- Confirm permanent deletion with the exact record name or ID and explain the result.
- Toasts confirm completed actions but never carry the only error explanation.
- Skeletons should match the final structure. Avoid generic full-page spinners.

## Interaction and Motion

- Optimize for tap and keyboard first; hover is supplementary.
- Use `150–220ms` color and opacity transitions.
- Avoid scale-on-hover effects that shift layout.
- Motion explains insertion, reordering, save state, and sheet transitions.
- Respect `prefers-reduced-motion`.
- Do not animate primary data values merely for decoration.
- Show saving state immediately and prevent duplicate submissions.
- If an edit is stale, keep the user's draft and present a clear refresh/retry choice.

### Hover and Focus

- Hover behavior is defined by interaction role, not by page or component.
- Primary actions darken from `primary` to `primary-active`.
- Secondary actions use `surface` with `border-strong`.
- Text links change from `ink` to `primary` and reveal an underline.
- Navigation may use `primary-soft` to indicate destination affordance. Data cards and non-interactive surfaces do not react to hover.
- Use the shared `180ms ease-out` transition for color and border changes. Do not scale, lift, or add shadows on hover.
- Every role retains the global visible focus ring; hover never replaces focus styling.

## Accessibility

- Meet WCAG AA contrast for text and interactive controls.
- Every input has a programmatic label and every error is associated with its field.
- Keyboard focus is always visible.
- DOM and focus order match visual order.
- Touch targets are at least `44 × 44px`.
- Status, set type, and nutrition completeness never depend on color alone.
- Announce save, validation, insertion, deletion, and reorder results to assistive technology.
- Test at 200% zoom and with long values without horizontal page scrolling.

## Content Style

- Use short, concrete labels and sentence case.
- Prefer `No meals logged today` over vague empty copy.
- Use `kg`, `g`, `kcal`, `reps`, `RIR`, and `RPE` consistently.
- Display timestamps with Nepal-local context and an explicit offset where precision matters.
- Do not claim progress, nutrition totals, or completion when the data is incomplete.

## Required States

Every major surface must include:

- First-use empty state with one clear action.
- Loading state that preserves layout.
- Field-level validation errors.
- Network or server error with a safe retry.
- Saving and saved feedback.
- Stale-edit conflict.
- Partial nutrition state.
- Long exercise, meal, and food-item names.
- Open and completed workout states.

## Implementation Contract

- `DESIGN.md` is the visual and interaction source of truth for all product screens.
- Root `AGENTS.md` owns architecture, safety, skill selection, and verification workflow.
- The closer `frontend/AGENTS.md` owns version-specific Next.js rules.
- Read the current FastAPI/OpenAPI contracts before wiring a screen; do not invent fields or client-side domain rules.
- Reuse tokens and components; do not hard-code near-duplicate colors, spacing, radii, or controls per page.
- Prefer Server Components for read-only shells and small client leaves for forms and interaction.
- Check `package.json` before importing a component, icon, animation, or form library.
- Components discovered through 21st are references: adapt them to these tokens, semantics, states, and accessibility rules.
- Validate the real running interface with Playwright; source inspection alone is not visual verification.

## Avoid

- Generic dashboard grids as the default mobile layout.
- Dark gym aesthetics, neon gradients, glassmorphism, and decorative glow.
- Excessive badges, cards within cards, and rounded containers around every element.
- Hidden units, ambiguous dates, unlabeled icons, or placeholder-only labels.
- Artificial gamification, streak pressure, and unsupported coaching claims.
- Photography that competes with logging or history.
- Multiple accent colors for decoration.

## Implementation Checks

Before considering a surface complete, verify it at `375px`, `768px`, `1024px`, and `1440px` widths. Confirm no horizontal scrolling, no fixed control covers content, keyboard use is complete, focus is visible, reduced motion works, and all loading/error/empty states are represented.

Source direction: [Airbnb DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/airbnb/DESIGN.md), adapted specifically for Nirantar rather than copied.
