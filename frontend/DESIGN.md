# Nirantar Design System

## Direction

Nirantar is a mobile-first personal fitness log covering workouts, meals, sleep, and body weight. The interface should make recording an entry feel immediate, make historical data easy to trust, and make the daily habit feel worth continuing.

The system is built on three ideas:

1. **Energy.** A single electric-lime accent carries action and momentum. Numbers are large, tight, and tabular. Progress is shown as a gauge, not a sentence.
2. **Domain identity.** Workouts, meals, sleep, and body weight each own a consistent accent so a user recognises a subject before reading its label.
3. **Honest data.** Motivation never justifies inventing a number. Unknown stays unknown, never becomes zero, and every total comes from the server.

Mode: **Operate.** Task completion and legibility take priority over decoration, but the surface should still feel deliberate and alive rather than administrative.

This system is theme-native. Light and dark are equal first-class expressions, not a base plus an afterthought. Every token, component, and state is defined in both.

## Product and Data Boundary

- Build a responsive Next.js web application in `frontend/`; optimize for phone use first.
- The browser calls the FastAPI HTTP API. MCP is for AI clients and is never the browser data layer.
- PostgreSQL and backend services remain the source of truth; the UI does not recalculate authoritative summaries.
- Display server-provided IDs, timestamps, ordering, and totals without changing their meaning.
- Use `Asia/Kathmandu` for user-facing calendar dates and times.
- Authentication uses Clerk. Sign-in and sign-up are full-page routes outside the app shell and follow these tokens, states, and accessibility rules like any other surface.
- Email, Apple, Facebook, and Google are the supported sign-in methods. Clerk instance settings control provider availability; the UI must not duplicate provider logic.
- Auth start screens use one heading and no subtitle. Later-step instructions remain visible when they explain verification, recovery, or an error.
- Signed-out users may reach the public landing page and auth routes. Logging and history surfaces require a signed-in session.

## Scope Boundaries

Nirantar has no social graph. Accounts are independent and a user sees only their own history. Do not design leaderboards, follower counts, shared feeds, public profiles, or comparative ranking, regardless of what a visual reference shows.

Do not design streak pressure, guilt messaging, or reward theatre. Consistency may be reported as a fact, such as weekly workout-target progress or an active meal-logging streak. It must never be framed as a loss the user is about to suffer.

Do not design coaching claims, predicted outcomes, or nutrition advice. The product reports what was recorded.

## MVP Information Architecture

### Today

- Lead with today's local date, quick actions, and the deterministic daily summary.
- Show current body weight when logged, today's workout state, meals, and known nutrition totals.
- Show a binary workout-activity calendar for the last year (Nepal-local days with at least one workout).
- Keep `Start workout`, `Log meal`, `Log sleep`, and `Log weight` reachable without scrolling on a common phone viewport.

### Workouts

- Provide a Nepal-local day view (default today) with left/right chevrons, workout detail, a live session logger, a new-workout flow for after-the-fact logging, and an edit flow for completed sessions.
- Starting a workout creates an open session (`check_out_at` null) and opens the session logger. An open session on that day shows `Continue workout` instead of `Start workout`.
- The editor handles check-in, ordered exercises, physical sets, nested dropsets, supersets, title, and notes. Check-out is set by finishing a session, not by a form field.
- Workout detail preserves exercise, set, dropset, and superset order exactly as returned. Open workouts open the session logger, not the completed-detail page.

### Meals

- Provide a Nepal-local day view (default today) with left/right chevrons, meal detail, new-meal flow, and edit flow. Log meal on another day defaults `eaten_at` to that day. Weight and sleep keep a date range.
- The editor saves a meal and all ordered food items as one aggregate.
- Show per-item nutrition only when known. Unknown values read `Not provided`; never substitute zero.

### Sleep

- Provide a date-grouped sleep list (default today, optional start–end range), new-sleep dialog, and edit dialog.
- Bedtime and wake time use the shared calendar date-time picker. Sleep is attributed to the Nepal-local wake date.
- Optional quality is a 1–5 numbered row in the log dialog, not a dropdown of `n of 5`.

### Weight

- Combine date navigation with body-weight measurements on `/weight`.
- Let the user inspect exact historical records before introducing charts.
- Filters must preserve the active local-date range and be easy to clear.

## Critical Flows

1. Start a workout, add exercises and working sets on the live session page, optionally add dropsets from the exercise menu, then Finish. Use the completed-session editor for supersets, title, and notes.
2. Open a workout, edit against its current `updated_at`, resolve stale conflicts without losing the draft, or delete with a two-click confirm dialog.
3. Log a meal with multiple food items and save the aggregate once.
4. Open, edit, reorder, or delete a meal with the same stale-write protection and two-click confirm dialog.
5. Log or correct one body-weight value for a Nepal-local calendar date.
6. Review today's deterministic summary and move into the underlying records.

## Experience Principles

1. **Log without friction.** Common actions stay within thumb reach and require minimal typing.
2. **Show the saved truth.** IDs, timestamps, units, set types, and edit state remain explicit.
3. **Design for the gym.** Controls work one-handed, under poor attention, on a small screen, in bright sun or a dim room.
4. **Make history scannable.** Repeated structures align so changes are easy to compare.
5. **Let progress feel earned.** Emphasis goes to real recorded values. Decoration never simulates achievement.

## Theming

Theme is a first-class product setting with three values: `system`, `light`, and `dark`.

- `system` is the default and follows `prefers-color-scheme`.
- A manual choice persists in `localStorage` under `nirantar-theme` and survives reload and navigation.
- The resolved theme is written to `data-theme="light" | "dark"` on `<html>` by a blocking inline script before first paint. There must be no flash of the wrong theme.
- `<html>` also carries `color-scheme` so native controls, scrollbars, and form widgets match.
- The `ThemeToggle` lives in the account area: the mobile header and the desktop sidebar. It is a labelled control, never an unlabelled icon alone.
- `<meta name="theme-color">` is declared for both schemes so the mobile browser chrome matches.
- Never read the theme during render in a way that produces different server and client markup. Components must be theme-agnostic and resolve appearance through tokens only.

Components must never branch on theme in TypeScript. If a value differs between light and dark, that difference belongs in a token.

## Color System

Color is expressed in three layers. Components consume only the third.

1. **Palette** — raw ramps. Never referenced by a component.
2. **Semantic tokens** — meaning, such as `--danger` or `--domain-meals`.
3. **Role tokens** — usage, such as `--action-bg` or `--card-bg`. These are what components use.

Role tokens exist so light and dark can diverge where craft demands it without any component knowing. The clearest example is the primary action: in dark it is a lime fill with near-black text, and in light it is a deep ink fill with white text, because vivid lime on white cannot carry a readable label or a 3:1 boundary. Both resolve through `--action-bg` and `--action-fg`.

### Neutrals

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `canvas` | `#F5F6F8` | `#0C0E12` | Page background |
| `surface` | `#FFFFFF` | `#14171D` | Cards and raised content |
| `surface-strong` | `#ECEEF2` | `#1C2028` | Selected and pressed neutral states |
| `surface-elevated` | `#FFFFFF` | `#22262F` | Sheets, dialogs, popovers, floating menus |
| `hairline` | `#E6E8EC` | `#1E222A` | Separators inside a surface |
| `border` | `#D9DCE2` | `#2A2F39` | Control and card borders |
| `border-strong` | `#A9AFBB` | `#454C59` | Focused and emphasized borders |
| `ink` | `#101319` | `#F3F5F8` | Headings and primary values |
| `text` | `#3A404B` | `#C4CAD5` | Body copy |
| `muted` | `#6B7280` | `#8A93A2` | Metadata and helper text |
| `scrim` | `rgb(12 14 18 / 55%)` | `rgb(0 0 0 / 68%)` | Modal and sheet backdrop |

In light, the canvas is a soft gray and cards are white, so elevation reads without heavy borders. In dark, elevation is expressed by raising surface lightness, never by a shadow, because shadows are invisible on near-black.

### Energy accent

Electric lime is the action and momentum colour and the workout domain colour. It is the only accent allowed to dominate.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `energy` | `#B4E01C` | `#C6F24E` | Progress fills, active indicators, charts, workout domain |
| `energy-strong` | `#7E9E0B` | `#D8FF6B` | Hover and pressed energy fills |
| `energy-text` | `#4A6300` | `#C6F24E` | Energy-coloured text and icons on canvas |
| `energy-soft` | `#F1F8D8` | `#1F2A10` | Selected background, subtle highlight |
| `on-energy` | `#101319` | `#101319` | Label on an energy fill, always near-black |

`energy-text` exists because raw lime never meets AA as text on a light canvas. Any lime *text* or *icon* on canvas must use `energy-text`. Raw `energy` is for fills, strokes, and data marks only.

### Action roles

| Token | Light | Dark |
| --- | --- | --- |
| `action-bg` | `#151922` | `#C6F24E` |
| `action-bg-hover` | `#272D3A` | `#D8FF6B` |
| `action-fg` | `#FFFFFF` | `#101319` |
| `action-border` | `#151922` | `#C6F24E` |
| `action-disabled-bg` | `#DFE2E8` | `#232833` |
| `action-disabled-fg` | `#8A909C` | `#69707D` |
| `focus-ring` | `#151922` | `#C6F24E` |

Disabled controls change both background and label colour. Never signal disabled with opacity alone.

### Domain accents

Every domain owns one accent, used for its icon surface, its ring or gauge, and its active navigation item. The same subject must read the same colour everywhere it appears.

| Domain | Token | Light fill | Dark fill | Light text | Dark text |
| --- | --- | --- | --- | --- | --- |
| Workouts | `domain-workouts` | `#B4E01C` | `#C6F24E` | `#4A6300` | `#C6F24E` |
| Meals | `domain-meals` | `#0FA968` | `#34D399` | `#046D46` | `#34D399` |
| Sleep | `domain-sleep` | `#7C5CF0` | `#A78BFA` | `#5B3ACC` | `#A78BFA` |
| Body weight | `domain-weight` | `#0EA5E9` | `#38BDF8` | `#0369A1` | `#38BDF8` |

Each domain also has a `-soft` background for its icon surface and selected state.

### Macro accents

Macros keep a fixed identity across every chart, ring, legend, and row.

| Macro | Token | Light | Dark |
| --- | --- | --- | --- |
| Calories | `macro-calories` | `#B4E01C` | `#C6F24E` |
| Protein | `macro-protein` | `#2563EB` | `#60A5FA` |
| Carbs | `macro-carbs` | `#D97706` | `#FBBF24` |
| Fat | `macro-fat` | `#DB2777` | `#F472B6` |

A macro is never identified by colour alone. Every ring, arc, and legend entry carries a text label and value. Only calories uses an icon (flame). Protein, carbs, and fat are label and value only.

### Semantic and brand

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `success` | `#0F7A48` | `#4ADE80` | Confirmed completion |
| `warning` | `#8A5A00` | `#FBBF24` | Incomplete or attention state |
| `danger` | `#C0271A` | `#F87171` | Destructive action and validation error |
| `danger-hover` | `#9C1E14` | `#EF4444` | Hover on filled destructive confirms |
| `on-danger` | `#FFFFFF` | `#101319` | Label on a filled destructive button |
| `info` | `#1D4ED8` | `#60A5FA` | Informational status |
| `brand` | `#D4143A` | `#F0426A` | The Nirantar mark and brand moments only |
| `quality-1` … `quality-5` | red → amber → green | red → amber → green | Selected sleep-quality fill. `1` is bad (`danger`), `5` is good (`success`), `2–4` step between them. Pair with `quality-n-fg` for the numeral. |

The brand mark is a single raster, `frontend/public/logo/logo.png`, used in both themes. Do not swap logo assets by theme. Crimson (`brand`) is reserved for rare brand moments and must not be used for ordinary primary actions, links, or active navigation. Destructive confirmation uses `danger`, not `brand`.

Each semantic colour has a matching `-soft` background for banners and badges.

### Colour discipline

Roughly 85% of any surface is neutral. Accent carries action, domain identity, and data. Semantic colour appears only when its meaning applies.

Never use colour as the only indicator. Pair every status, set type, and macro with text and, where useful, an icon. Verify every foreground/background pair against AA in both themes.

## Typography

Two optical registers of one family. **Inter** for body and interface, **Inter Tight** for display and large numerics. Inter ships tabular figures by default and has the x-height and aperture to stay legible at 12px on a phone; Inter Tight gives large numbers the condensed impact the product needs without introducing a novelty display face.

- Body and UI: `Inter`, exposed as `--font-sans`.
- Display and numerics: `Inter Tight`, exposed as `--font-display`.
- Fall back to `system-ui`, `Segoe UI`, `sans-serif`.
- Apply `font-variant-numeric: tabular-nums` to every weight, rep, macro, duration, date, time, and count so values never shift width as they update.
- Enable the disambiguation stylistic set so `0` and `O` stay distinct in IDs and values.
- Default body size is `16px` with at least `1.5` line height.
- Headings are sentence case. The only uppercase text is the micro label.

| Role | Family | Size / line height | Weight | Notes |
| --- | --- | --- | --- | --- |
| Metric hero | Display | `40 / 44px` | 700 | One dominant number per card at most |
| Page title | Display | `30 / 36px` | 700 | `-0.02em` tracking |
| Section title | Display | `22 / 28px` | 650 | |
| Card title | Sans | `17 / 24px` | 600 | |
| Numeric value | Display | `22 / 26px` | 650 | Tabular |
| Body | Sans | `16 / 24px` | 400 | |
| Label | Sans | `14 / 20px` | 600 | Field and control labels |
| Metadata | Sans | `13 / 18px` | 450 | Timestamps, counts, helper text |
| Micro label | Sans | `11 / 16px` | 650 | Uppercase, `0.06em` tracking, `muted`. Section eyebrows only |

The micro label is the one uppercase treatment in the system. Use it for short section eyebrows such as `TODAY` or `RECENT ACTIVITY`. Never use it for a sentence, a value, or a control label.

## Spacing, Radius, and Elevation

Use a 4px base grid.

- Spacing: `4, 8, 12, 16, 20, 24, 32, 48, 64`.
- Page gutter: `16px` mobile, `24px` tablet, `32px` desktop.

| Radius token | Value | Use |
| --- | --- | --- |
| `radius-control` | `12px` | Buttons, inputs, selects, icon buttons |
| `radius-card` | `20px` | Cards and grouped panels |
| `radius-surface` | `28px` | Sheets, dialogs, popovers |
| `radius-pill` | `999px` | Chips, badges, status, avatars |

Elevation is theme-dependent and must always come from a token:

- `elevation-card`: light uses a soft `0 1px 2px rgb(16 19 25 / 4%), 0 4px 12px rgb(16 19 25 / 5%)`; dark uses no shadow and relies on `surface` sitting above `canvas`.
- `elevation-float`: dialogs, sheets, popovers, and the install prompt. Light adds a deeper shadow; dark adds a `1px` `border` plus a soft ambient shadow to separate from the backdrop.
- `glow-energy`: reserved for the primary action and the active navigation indicator in dark theme only. It is a static accent bloom, never animated, and never the sole indicator of state. In light theme this token resolves to `none`.

Cards carry `elevation-card`. Do not stack a card inside a card; use `hairline` dividers instead.

## Visual Hierarchy

Hierarchy is decided once, here, and every surface follows it. A screen is not designed by choosing what to make big; it is designed by placing content into a fixed ladder.

### The ladder

Every surface composes these five levels in order. A level may be absent, but levels never swap places and never repeat at the same weight.

| Level | Role | Treatment | Count per surface |
| --- | --- | --- | --- |
| **L1 — Page** | What this screen is, and the one thing to do here | Page title, Display `30/36` 700 `ink`, plus one `primary` action | Exactly one |
| **L2 — Section** | One subject within the page | Optional micro label, section title Display `22/28` 650 `ink`, optional `secondary` action | Few, clearly separated |
| **L3 — Aggregate** | One record or one grouped fact | Card title Sans `17/24` 600 `ink`, at most one hero metric | Many, all identical in weight |
| **L4 — Data** | The recorded values | Label `muted` `13/18`, value Display `22/26` 650 `ink`, tabular | Many, aligned in tracks |
| **L5 — Metadata** | Time, counts, helper text | Sans `13/18` 450 `muted` | Always last in reading order |

Repeated items at the same level must look identical. If two cards in one list differ visually, that difference must encode real data, never emphasis.

### What carries hierarchy

Apply these in order. Reach for a later carrier only when the earlier ones are exhausted.

1. **Position and spacing.** Grouping and order do most of the work. Content near the top and left of a surface is read first.
2. **Type size and weight.** The scale in the Typography section is the only permitted range.
3. **Text contrast.** `ink` for headings and values, `text` for body, `muted` for labels and metadata. This ladder alone separates most content.
4. **Surface and elevation.** `canvas` → `surface` → `surface-strong` → `surface-elevated`. Depth increases only toward the user's current focus.
5. **Accent colour.** Last, and only for action, domain identity, status, or a data mark.

Never use accent colour to create hierarchy that spacing and type should have carried. If a card needs colour to feel important, its layout is wrong.

### Emphasis budget

Each surface has a fixed allowance. Exceeding it is a defect, not a style choice.

- One L1 page title.
- One `primary` action per page region.
- One hero metric per card. If a card has two competing numbers, one becomes an L4 value.
- At most two accent colours visible in a card: its domain accent, plus one semantic status when the state warrants it.
- At most three type sizes in a card.
- At most one elevated surface between the user and the canvas at a time. Dialogs and sheets replace focus rather than stacking on it.

### Spacing rhythm

Spacing is hierarchy. The scale maps to relationships, not to taste.

| Gap | Relationship |
| --- | --- |
| `64` / `48` | Between major page regions |
| `32` | Between sections |
| `24` / `20` | Card padding |
| `16` | Between groups inside a card |
| `12` / `8` | Between related controls |
| `4` | Between a label and its value |

The space above a heading is always larger than the space below it, so a heading visibly belongs to the content that follows it rather than floating between two blocks.

### Numeric hierarchy

Nirantar is a data product, so numbers get their own ladder.

| Tier | Treatment | Use |
| --- | --- | --- |
| Hero metric | Display `40/44` 700, tabular | The one headline value on a summary card |
| Numeric value | Display `22/26` 650, tabular | Values in a metric row, set row, or data grid |
| Inline value | Sans `16/24` 600, tabular | A value inside a sentence or a compact row |

A unit is always one step smaller than its number and set in `muted`. It never matches the number's weight, so `73.3 kg` reads as one value rather than two words. Every number in a repeated column uses tabular figures so digits align and nothing shifts as values update.

### Applying the ladder

| Surface | L1 | L2 | L3 | L4 |
| --- | --- | --- | --- | --- |
| Today | Local date and page title, quick actions | Daily summary, activity calendar | Domain summary cards | Metric rows inside each card |
| Collection list | Page title, date filter, `primary` log action | Date group heading | Record cards, all identical | Metric row inside each card |
| Detail | Back link, record title, actions | Exercises, food items, notes | Exercise or item card | Set rows and nutrition rows |
| Editor | Page title | Optional grouped fieldsets | Exercise or item builder | Individual fields |
| Dialog | Dialog heading | — | — | Fields, then actions last |

### Hierarchy anti-patterns

- Two `primary` actions competing in one region.
- A repeated row action styled with the same weight as the page CTA.
- A hero metric on every card in a list, so none of them lead.
- `muted` used for a recorded value, or `ink` used for a helper label.
- Accent colour applied to a heading to make a section feel important.
- A card nested inside another card to imply grouping that spacing should express.
- Uppercase micro labels used for anything other than a short section eyebrow.
- Equal spacing above and below a heading, which detaches it from its content.

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

Mobile navigation uses five persistent destinations: Today, Workouts, Meals, Sleep, Weight.

Use a bottom navigation bar on mobile and a compact side navigation on desktop. Weight is the body-weight destination; logging also appears on Today. Settings is reached from the account menu, not added as a sixth destination.

The active destination shows its icon, its label, and its domain accent. Active state must also be programmatic through `aria-current`, never colour alone.

Today uses four equal quick actions and four summary cards: workout, nutrition, sleep, and body weight. Only an active meal streak is shown near the date; workout consistency is weekly target progress, never a daily workout streak.

Use one consistent SVG icon family. The project uses Phosphor. Do not hand-draw routine icons or use emoji as interface icons. Never use a sparkle icon; label AI and MCP features directly.

## Component Architecture

Every visual decision is defined in exactly one place and consumed everywhere else. This is a hard architectural rule, not a preference, because the previous system drifted precisely where it was violated.

### The single-definition rule

1. **A component's appearance is defined only inside that component.** A page composes components; it never styles them.
2. **No presentational `className` prop.** No primitive or composite accepts `className`, `triggerClassName`, `style`, or any raw CSS string from a caller. Appearance is selected through closed semantic props such as `variant`, `size`, `tone`, and `emphasis`, typed as unions so an invalid value fails at compile time.
3. **No page-local CSS for a shared pattern.** If a surface needs a look that a primitive cannot express, extend the primitive and document it here. Do not add a page-scoped rule.
4. **No descendant overrides.** The stylesheet must not contain rules like `.some-page .button-primary { … }` that reach into a component from outside. A component's rules are self-contained.
5. **No hard-coded colour, radius, shadow, font size, or spacing** anywhere. Every value resolves to a token.
6. **Layout is the caller's job; appearance is the component's job.** A parent may control placement and width through a layout primitive such as `Inline`, `Stack`, or `ButtonRow`. It may never control colour, height, radius, weight, or border.

Minor, local adjustments are allowed only through props the component already declares. Anything larger is a change to the component and to this document, applied in the same commit.

### Action hierarchy

Emphasis is a property of what the action *does*, never of the page it appears on. The same logical action keeps the same variant on every surface, including empty states, section headers, sheets, and dialogs.

| Variant | Appearance | Use for | Never use for |
| --- | --- | --- | --- |
| `primary` | Filled `action-bg`, `action-fg` label | The single most important action on a surface: page CTA, form submit, dialog confirm | Any action that repeats within a list |
| `secondary` | `surface` background with a visible `border` | A comparable alternative or supporting action: `Cancel`, `Add exercise`, `Add superset`, `Sign in` | The main action on a surface |
| `tertiary` | Ghost: no fill, no border; hover reveals `surface-strong` | Repeated row actions and inline disclosures: `Edit`, `More` | A page or section CTA, or any delete/remove/discard |
| `destructive` | Filled `danger`, hover `danger-hover` | The confirm step of a deletion, inside a dialog only | The trigger that opens a delete dialog |

`tone="danger"` is required on every delete, remove, or discard **trigger**. Rest appearance still follows the host variant (almost always `tertiary`). Hover uses `danger-soft` and `danger` so the control turns reddish everywhere, including icon-only trash controls. Do not put `tone="danger"` on `Cancel`. Cancel is a safe exit and stays `secondary`.

Two rules follow, and they are binding:

- **A repeated action is always `tertiary`.** An action rendered once per row appears many times and must never compete with the one primary action on the surface. Row-level `Edit` is `tertiary` with `size="sm"`.
- **A create or log action is always `primary` on its own collection surface.** `Start workout` renders identically in the Workouts page header and the Workouts empty state; the same holds for meals, sleep, and body weight. If that day already has an open session, the same slot shows `Continue workout`.

One deliberate exception: **Today's quick actions are a peer set, not four CTAs.** All four render `secondary` at the same size with destination icons, so no single destination is privileged and the one-primary-per-region rule is preserved. Today is a review surface, and its emphasis belongs to the recorded data rather than to a rail of buttons. A peer set must never mix variants.

At most one `primary` action is visible per page region. If a surface appears to need two, one of them is `secondary`.

### Primary action placement

A create action must appear **exactly once** on a surface. It moves depending on state; it is never rendered in two places at the same time.

| Surface state | Page or section header | In-content state | Rationale |
| --- | --- | --- | --- |
| **Has records** | Owns the `primary` create action | No state shown | The header is the stable, predictable home for the action |
| **First-use empty** (no records exist at all) | Omits the create action entirely | `EmptyState` owns the single `primary` create action | The empty state is the only thing on screen; a header button beside it is pure duplication |
| **Filtered no-results** (records exist, but none match the filter) | Keeps the `primary` create action | `EmptyState` offers a **recovery** action such as `Clear filters`, never a second create action | Creating a record does not solve a filter that is too narrow |
| **Unavailable / error** | Keeps the create action only if it can still succeed | `FeedbackState` offers `Retry` | Retry and create are different intents |

The distinction between first-use empty and filtered no-results is required. A collection page must know whether it is empty because nothing was ever logged or because the active filter excluded everything, and must render the matching state. Never show the same create CTA twice, and never answer a no-results state with a create button alone.

Related controls follow the content, not the header. A view toggle, date filter, or sort control is hidden when there is nothing to toggle, filter, or sort, except when it is the filter itself that produced the empty result — in which case it stays visible so the user can widen it.

### Size scale

Size is derived from role, not from available space.

| Size | Height | Use |
| --- | --- | --- |
| `sm` | `36px` | Row-level and inline actions. Requires a `44px` minimum hit area via padding, so the visual control may be smaller than its target. |
| `md` | `44px` | Default for section headers, toolbars, and dialog actions. |
| `lg` | `52px` | Page CTAs, form submit, and the mobile sticky save action. |

Icon-only controls are always at least `44 × 44px` regardless of size, and always carry an accessible label.

### Component API contract

Every shared component follows the same shape:

- Props are semantic and closed. Prefer `variant="tertiary"` over `subtle={true}`, and never accept a class name.
- Every interactive component forwards `ref`, `disabled`, `type`, `aria-*`, and event handlers to its underlying element.
- A component that can render as either a button or a link exposes one API and chooses the element from whether `href` is present. It must not expose two near-duplicate components.
- Composites that own a trigger, such as a dialog, expose the trigger's `variant`, `size`, and `label` as typed props that pass straight through to `Button`. They never accept a class name.
- Loading and disabled are props, not caller-applied styles. A loading control keeps its width and blocks duplicate submission.
- Every component declares its required states in this document before it is built.

## Component System

This inventory is the shared contract for all current and future product surfaces. Agents must reuse an existing primitive or composite before introducing a new one. A component library may supply implementation mechanics, but its default appearance does not override these tokens, dimensions, states, or semantics.

### Foundations and layout primitives

- `PageContainer`: centered, full-width content with `16px` mobile, `24px` tablet, and `32px` desktop gutters; cap at `1120px`.
- `ReadingColumn`: text and simple forms capped at `680px`; never stretch to fill a desktop canvas.
- `PageHeader`: one page title, optional factual supporting copy, optional description, and visible primary action. Stack on mobile and align actions to the trailing edge on desktop. Workouts and Meals place `DayNavigator` under the header. Weight and Sleep keep a date-range filter in the header actions.
- `Section`: groups one subject with an optional micro label, a heading, and an optional action. Use spacing rather than a decorative container when no boundary is needed.
- `ResponsiveGrid`: use deliberate columns, never auto-fit merely to fill space. Summary and list grids are 1 column on mobile, may become 2 at tablet, and only use 3 or 4 columns when each cell remains readable and comparable.
- `FormLayout`: one column on mobile; at desktop use a `minmax(0, 680px)` form column and an optional `minmax(280px, 360px)` sticky summary rail, separated by `32px`.
- `Stack` and `Inline`: use only the documented spacing scale. Related controls use `8–12px`; card content uses `16–24px`; sections use `32–64px`.
- `Divider`: a single `hairline` rule between repeated rows or major internal groups. Do not put every subsection in another card.

All grid children must use `min-width: 0`. Long names wrap instead of forcing horizontal scrolling. Align repeated measurements using CSS grid tracks and tabular numerals; do not align them with arbitrary margins.

### Shared primitives

| Primitive | Required variants and behavior |
| --- | --- |
| `Button` | Primary, secondary, tertiary, destructive, icon-only, loading, and disabled. Optional `tone="danger"` on every delete/remove/discard trigger so hover turns reddish. Primary uses `action-*` roles. Minimum `48px` high for labeled primary actions and `44 × 44px` for every touch target. Create/log actions (`Start workout`, `Log meal`, `Log sleep`, `Log weight`, and matching empty-state CTAs) always show a decorative `PlusIcon` before the label; the label text itself never includes a `+` character. `Continue workout` is a resume action and uses the workouts destination icon. Edit triggers use a pencil icon, not plus. Today quick actions may keep destination icons. |
| `IconButton` | One consistent icon family, visible hover/focus/pressed states, `aria-label`, and tooltip only when the meaning is not already visible. Trash and other delete icon buttons use `tone="danger"`. |
| `ThemeToggle` | Cycles or selects `system`, `light`, `dark`. Has a visible or accessible label naming the current mode, `44 × 44px` minimum, and announces the applied theme. Never an unlabelled icon. |
| `Field` | Persistent label, control, unit/add-on when relevant, helper text, and associated error. Never use placeholder text as the label. |
| `TextInput` | `56px` standard height, correct `inputMode` and autocomplete, `radius-control`, and no focus glow. |
| `NumberInput` | Explicit unit, decimal/integer keyboard, legal range guidance, and no silent coercion. Use for kg, g, kcal, and reps. |
| `Textarea` | Visible label, sensible mobile height, user resizing where layout permits, and preserved content after errors. |
| `Select` | Native control on mobile when it gives the better platform experience; custom popover only when search or richer options are genuinely needed. |
| `Checkbox` / `RadioGroup` | Entire label is clickable, state is not color-only, and the group has a programmatic name and error. An optional 1–5 scale is a row of numbered options, not a select labelled `n of 5` and not a slider. |
| `SegmentedControl` | Two to four mutually exclusive compact views only. On narrow screens it must wrap safely or become a select. |
| `Badge` / `Status` | Text plus semantic icon where useful. `radius-pill`. Reserved for compact status and filter information. |
| `Card` | One meaningful aggregate, `radius-card`, `surface` background, `elevation-card`, with consistent title/metadata/action order. Interactive cards use a real link or button and visible focus. |
| `MetricTile` | One labelled fact: micro label, metric-hero or numeric value with explicit unit, and optional domain icon surface. Shows `Not logged` rather than `0` when a value is absent. |
| `DataRow` | Stable label/value tracks, tabular numerals, explicit units, and wrapping for long labels. |
| `ProgressRing` | Circular gauge for one value against a target. Requires a visible numeric centre label and an accessible `role="img"` name stating value, unit, and target. Never a bare ring. Uses the owning domain accent. |
| `MacroRings` | Concentric or split arcs for calories, protein, carbs, and fat using the fixed macro accents. Every arc has a legend entry with label and value. Unknown macros render as an explicit gap labelled `Not provided`, never as zero progress. The legend shows a flame icon for calories only; protein, carbs, and fat have no icon. |
| `GaugeBar` | Linear progress against a target with a visible `value / target unit` label. Used for weekly workout targets and calorie budgets. Over-target is shown as a labelled state, not a silently clipped bar. |
| `Skeleton` | Mirrors the final geometry and does not animate when reduced motion is requested. |
| `EmptyState` | No-data and no-results only. Centered-in-context surface with a 48px neutral icon treatment, factual heading, one-sentence explanation, and at most one next action. Nested variant is left-aligned and compact for detail sections. Full-width action on mobile, intrinsic width from tablet up. Cap at the 680px reading column. No decorative illustration. Do not use for network or unavailable failures—those stay on `FeedbackState`. |
| `FeedbackState` | Network, server, and unavailable failures with a safe retry. |
| `InlineAlert` | Error, warning, success, or information with text and icon; includes recovery action when one exists. |
| `Toast` | Brief confirmation after a completed action; never the only location for an error or critical state. |
| `Tooltip` | Supplementary explanation for pointer/keyboard users, never required to discover a primary action and never the sole accessible name. |
| `InstallPrompt` | A dismissible floating install invitation shown only when the current device is eligible. It uses the native browser prompt where available, gives Safari-specific home-screen instructions, and stays above mobile navigation without covering primary actions. |

### Navigation and action patterns

- `AppShell`: mobile bottom navigation and desktop compact side navigation share the same five destinations and active-state semantics.
- `BottomNavigation`: fixed on mobile with safe-area padding, icon plus label, and no more than the five permanent destinations.
- `DesktopNavigation`: aligned to the same `PageContainer` grid. Account controls remain visually secondary to product navigation.
- `Breadcrumb` or `BackLink`: use on detail and edit flows when it clarifies the return destination. Do not duplicate browser history with ambiguous `Back` text.
- `QuickActions`: Today presents `Start workout` or `Continue workout`, `Log meal`, `Log weight`, and `Log sleep` as immediately visible actions; they must not be hidden in an overflow menu. Collection headers and empty-state CTAs use plus-before-label for create. Today's four quick actions use destination icons and are a peer `secondary` set.
- `StickyActionBar`: mobile full-width save action that stays reachable above the bottom navigation. No panel background, border, or shadow behind the button—only the button itself. Desktop actions remain in normal flow or the summary rail unless persistence is necessary.
- `Tabs`: use for peer views, not as a substitute for primary navigation or a multi-step form.

### Date and time components

Dates are product data, not decorative labels. Parse, compare, and display calendar values in `Asia/Kathmandu`; never derive a user-facing day from the server timezone.

#### `DatePicker`

- Use for one Nepal-local calendar date, such as body-weight entry.
- The field keeps a persistent label and a readable formatted value; the calendar button has an accessible name.
- Calendar day targets are at least `44 × 44px`.
- Provide distinct textual or programmatic states for today, selected, unavailable, and outside-month days. Selected uses the `action-bg` fill with `action-fg` text; today is never indicated by color alone.
- Month navigation uses `44 × 44px` previous/next buttons and announces the visible month.
- Support arrow-key day movement, Home/End within a week, Page Up/Page Down between months, Enter/Space selection, and Escape close when a popover is used.
- On mobile, open a full-width bottom sheet. On desktop, use a centered dialog. Do not use a native `date` input on product surfaces.

#### `DateRangePicker`

- Use for Weight and Sleep filtering, with explicit `Start date` and `End date` fields. Never make users infer which endpoint is active.
- Range start and end are circular selected cells. Dates between them use a connected `surface-strong` background; state remains understandable to assistive technology without color.
- Reject an end before the start with a field-level explanation. Preserve both entered values when validation fails.
- Provide `Today`, `Last 7 days`, `Last 30 days`, and `Clear` only where the server contract can express them exactly. Applying a range is explicit; closing the surface does not silently discard a committed filter.
- On mobile, use a bottom sheet or full-screen surface with one month and a sticky `Apply dates` action. On desktop, use an anchored panel and show one or two months only when space permits without shrinking day targets.
- The active range remains visible in the page URL and in a removable filter summary.

#### `DateTimeField` and `TimeField`

- Use the shared calendar modal from `DatePicker` / `DateField` for every date or date-time choice, including meal eaten-at, workout check-in, and sleep bedtime/wake. Do not use native `date` or `datetime-local` pickers on product surfaces.
- Keep a persistent label and a readable formatted value; the calendar button has an accessible name.
- Date-time pickers add hour and minute selects beneath the same calendar. Applying the value is explicit.
- Store and submit timezone-aware ISO 8601 values. Show the offset on detail or conflict surfaces where precision is important.
- Workout check-out is not a form field. Finishing a session sets it. Wake time must follow bedtime; invalid ordering is reported beside the relevant field.

### Overlays and disclosure

- `Popover`: anchored, non-modal choices on desktop; dismisses with Escape and outside click without losing committed state.
- `BottomSheet`: short mobile choices and filters. It has a visible title, close control, focus management, scroll containment, and safe-area padding.
- `Dialog`: destructive confirmation, stale-edit conflict, or another decision requiring protected focus. It traps focus, restores focus to its trigger, and closes with Escape unless an irreversible operation is running.
- `ConfirmDialog`: states the exact record name or ID, consequence, and explicit destructive verb. The destructive action remains visually secondary until this step. Confirmation is a second click (`Cancel` plus the destructive verb), never a typed phrase or ID.
- `DeleteRecordDialog`: used for workout and meal deletion, including discarding an open session. Same two-click confirm as `ConfirmDialog`, plus stale-write refresh when the record changed.
- `StaleConflictDialog`: preserves the draft and clearly separates refresh, retry, and cancel outcomes.
- `Menu`: secondary actions only. Primary save, log, edit, or recovery actions never live solely inside it. On a phone it is a bottom sheet; from tablet up it is a centered dialog. Each row is a full-width tertiary action. Destructive items use `tone="danger"`. Cancel stays secondary.
- `ChoiceList`: a short list of mutually exclusive tappable rows inside a sheet or dialog. Each row has a title and optional metadata. Use it to pick a parent set, not as page navigation.
- `BackButton`: the only in-app back affordance. It uses browser history when available, a route fallback for direct entry, the shared left-arrow treatment, a `44px` minimum target, and context-specific labels such as `Back to meals`. `collapseLabel="narrow"` hides the words below 744px and keeps the labelled arrow so a session toolbar stays one line. Do not create route-local back links or alternate hover treatments.
- `ViewToggle`: the only list/grid selector. Icon-only options with accessible names (`List view`, `Grid view`), each a `44 × 44px` target. Workouts, meals, and weight use separate local-storage preference keys and retain the selected view through day navigation and filtering.
- `DayNavigator`: the day control for Workouts and Meals. Left and right chevrons move one Nepal-local day, including tomorrow. Relative days show `Today`, `Yesterday`, or `Tomorrow` with the full weekday date underneath. Other days show a single weekday date with year. URL is `?date=YYYY-MM-DD`, omitted on today. Day navigation is not a filter: an empty day is first-use empty and still owns Start workout / Log meal for that day. Weight and Sleep keep `DateRangeFilter`.

Mobile disclosure becomes a sheet only when the content remains a short choice or filter. Long forms stay pages; do not place workout or meal creation inside a modal.

### Domain composites

- `DailySummary`: server-owned facts with honest missing and incomplete states; quick logging actions remain visible above the fold on a common phone. Domain cards lead with `DomainIcon` plus the hero metric. They do not repeat the domain name as an uppercase eyebrow. Empty nutrition is `Not provided` only; do not add a second empty sentence.
- `WorkoutActivityCalendar`: Nepal-local year heatmap of workout presence (binary active/inactive). Compact cells, the workouts domain accent for active days, horizontal scroll on narrow viewports, tooltips and aria with exact workout counts, and day links into Workouts for that `?date=`.
- `SessionLogger`: the default gym path. Sticky header with back, elapsed clock, and `Finish`. On a phone the back control is the labelled arrow only so the clock and `Finish` stay on one line. Add exercise by name only (no catalog, notes, photos, or Settings). Each new exercise starts with three empty working sets. Compact set table: SET, KG, REPS, check, remove. Empty cells use muted placeholders that turn ink when filled. Checkmarks are local to the device (`nirantar:set-complete:{id}`), not a server field. Enter kg and reps before checking a set. `Add set` appends another empty working set. The exercise overflow menu offers `Add dropset` and `Delete exercise`; it does not delete immediately. `Add dropset` asks which working set to attach to, then nests an empty dropset under that parent with a rail. `Start workout` stores the click instant including seconds so the elapsed clock begins at `0:00`. `Finish` sets `check_out_at` to the current instant. The empty session centres `Add exercise` with the prompt; `Discard workout` deletes the session after a two-click confirm dialog. Supersets stay on the completed-session editor.
- `WorkoutCard` and `WorkoutDetail`: stable order of local date/time, title, duration, set counts, completion state, and actions.
- `ExerciseCard`: one performed exercise with ordered set rows and optional superset membership.
- `SetRow`: order, textual set type, weight in kg, and reps aligned consistently. A dropset is indented beneath and visibly connected to its working-set parent by a rail, not by color alone.
- Nested rails and indentation appear only when nested records exist. Nested empty states use the compact `EmptyState` variant.
- `SupersetGroup`: labeled ordered group whose membership and member order do not rely on proximity alone.
- `MealCard` and `MealDetail`: name, Nepal-local time, ordered foods, and known totals in a stable hierarchy.
- `FoodItemRow`: name first, quantity and unit second, then only known nutrition. Unknown values read `Not provided`.
- `WeightEntry`: Nepal-local date, decimal `kg` value, optional change from the previous measurement, correction state, and save feedback. Do not repeat a domain icon on every row; the page already owns that identity.
- `HistoryFilterBar`: current date range and other active filters, clear affordances, and the responsive `DateRangePicker` disclosure.
- `SleepCard`: Nepal-local wake date grouping, duration, bedtime–wake range, optional quality, and an edit action. Sleep has no detail route; the card is not a link.
- `HistoryGroup`: local-date heading followed by exact records. Lists remain the source for exact values even when a trend chart is later added.

### Component state contract

Every reusable interactive component must account for default, hover where relevant, focus-visible, pressed, disabled, loading, error, and success states in **both themes**. Every data surface must account for loading, empty, unavailable/network error, long content, and partial/missing values. Editors additionally require dirty, saving, saved, validation error, server error, and stale-conflict states.

State changes that insert, remove, reorder, save, or fail must be announced through an appropriate live region. Loading disables duplicate submission without erasing the entered draft. Skeletons preserve layout; errors include a safe retry when retry is possible.

### Responsive composition contract

| Viewport | Composition |
| --- | --- |
| `< 744px` | One primary column, `16px` gutter, bottom navigation, sheets for short filters, sticky bottom save actions, and no hover-dependent behavior. |
| `744–1127px` | `24px` gutter, one or two deliberate columns, compact navigation, and enough space for anchored filters when day targets remain at least `44px`. |
| `>= 1128px` | `32px` gutter inside the `1120px` cap, consistent 12-column alignment, optional form plus summary rail, anchored panels, and stable repeated-data columns. |
| `> 1440px` | Keep all content caps; additional width becomes balanced outer whitespace rather than stretched cards or forms. |

The desktop grid uses 12 conceptual columns with `24px` gutters. Full-width page sections span 12; primary content commonly spans 8 and a secondary rail 4. A form may remain at its `680px` cap even when this leaves intentional whitespace. Tablet and mobile reduce columns rather than squeezing controls.

### Agent implementation checklist

Before adding or changing a frontend surface:

1. Read this document, `frontend/AGENTS.md`, the applicable product docs, the real API contracts, and the neighboring surface implementation.
2. Identify the shared primitives and domain composites above. Extend them rather than creating page-local near-duplicates.
3. Use role tokens from the shared stylesheet. Never hard-code a colour, and never branch on theme in TypeScript. Add a token only for a recurring role.
4. Implement mobile layout first, then tablet, desktop, and wide compositions. Keep DOM order meaningful at every size.
5. Include required loading, empty, validation, network error, saving, saved, long-content, incomplete-data, and stale-conflict states that apply.
6. Verify the running UI with Playwright at `375px`, `768px`, `1024px`, and `1440px` **in both light and dark**. Check horizontal overflow, clipped or fixed content, focus order and visibility, keyboard operation, touch targets, reduced motion, console errors, and 200% zoom.
7. Review the final diff for local style duplication, hard-coded colour, inaccessible names, unsupported claims, and unrelated changes.

When a new pattern is truly reusable, update this component inventory in the same change. Do not document speculative components that no current product flow needs.

### Buttons

- Primary buttons use `action-bg` / `action-fg` and are at least `48px` high.
- In dark theme the primary button carries `glow-energy`. In light theme it does not.
- Pressed primary buttons use `action-bg-hover` without scale, translation, or layout shift.
- Disabled primary buttons use `action-disabled-bg` with `action-disabled-fg` and never rely on opacity alone.
- Loading buttons retain their width, indicate progress, and prevent duplicate submission.
- Secondary buttons use `surface` with a visible `border`. `Cancel` is always secondary and never uses `tone="danger"`.
- Tertiary actions are text or icon buttons with a clear hover and focus state.
- Every delete, remove, or discard **trigger** uses `tone="danger"` so hover turns reddish (`danger-soft` fill, `danger` label) on every surface. The rest state stays quiet.
- Destructive buttons are the filled confirm step inside a dialog. Hover uses `danger-hover`. They are visually secondary until confirmation.
- Icon-only touch targets are at least `44 × 44px` and require accessible labels.
- Labels describe the result: `Save workout`, `Add set`, `Log meal`. Create and log buttons pair those labels with `PlusIcon`; do not write `+ Log meal` as text.

### Inputs

- Standard inputs are `56px` high with `radius-control` and a persistent visible label.
- Use a `1px` `border` by default and a `2px` `border-strong` on focus, plus the global focus ring. Do not add a decorative glow.
- Put units beside numeric fields; never encode the unit only in placeholder text.
- Use the appropriate mobile keyboard for numbers, decimals, dates, and times.
- Keep helper and validation text directly below the field.
- Preserve entered values after validation errors.
- Optional 1–5 ratings use a row of numbered tap targets. Leave none selected, or tap the selected value again, to leave the rating unset. The selected value fills from `quality-1` (red, poor) through `quality-5` (green, good). Colour never replaces the numeral.

### Cards and Lists

- A card represents one meaningful aggregate: workout, exercise, meal, sleep entry, or weight entry.
- Align repeated numeric fields in columns using grid tracks and tabular numerals.
- Use `hairline` dividers inside a card before nesting more cards.
- Metadata order stays consistent: local date/time, title, summary, status.
- Entire-card click behavior must be obvious and keyboard accessible.

### Data Visualisation

- Every chart, ring, and gauge exists to make a recorded fact faster to read. If a compact list is clearer, use the list.
- Every visual always keeps its exact value visible as text. A gauge without a number is incomplete.
- Every visual needs an accessible name stating value, unit, and target where one exists.
- Unknown data renders as an explicit unfilled and labelled segment. Never plot zero for unknown.
- Never animate a value on load purely for effect. Motion is allowed only to show a value changing in response to a user action, and is disabled under reduced motion.
- Use the domain accent for a domain gauge and the fixed macro accents for macro breakdowns. Do not introduce chart-only palettes.

### Workout Logging

- The gym path is the live session logger. After-the-fact logging, supersets, title, and notes stay on `/workouts/new` and the completed-session editor. Dropsets can be added during a live session from the exercise overflow menu.
- Optimize for one-handed phone use in the gym. Session timing, title, notes, warm-ups, reorder, and supersets stay out of the default path.
- `Start workout` creates an open session and opens `/workouts/{id}/session`. If that Nepal-local day already has an open session, the same slot is `Continue workout`.
- One exercise card contains its ordered working sets. Adding an exercise creates three empty working sets. Sets are deletable. Do not autofill from a previous set.
- The primary logging row is a compact table: set index, kg, reps, check, remove. Placeholders stay muted until a value is typed. A dropset is indented under its working-set parent with a rail and labelled `Drop n`.
- Check a set only after kg and reps are entered. Completion is local, not a stored fact.
- `Add set` remains on the current exercise and always adds a working set. The overflow menu is `Add dropset` or `Delete exercise`. Picking a dropset parent is required so the link is explicit.
- Full-width `Add exercise` follows the exercise list.
- `Finish` is the header primary action and writes `check_out_at`. `Discard workout` is a tertiary danger action that deletes the session.
- Keep `Save workout` sticky above the mobile bottom navigation on the after-the-fact editor without covering the last fields.

### Meal Logging

- A meal card contains its ordered food items.
- Each item shows name first, then quantity/unit and known nutrition.
- Unknown nutrition displays `Not provided`, never `0`.
- Totals show known values only. Do not add coverage labels such as `2 of 3 items`.
- Adding another food item is an inline primary flow, not a separate page.

### History and Summaries

- Date grouping uses the user's `Asia/Kathmandu` calendar day.
- Filters open in a bottom sheet on mobile and a centered dialog on desktop.
- Body-weight list view stays compact; grid view uses balanced two-column cards on desktop and one column on mobile. Neither view stretches low-density rows across the full desktop grid.
- Summary tiles show one fact each and do not imply unavailable data.
- The Today workout-activity calendar is a presence chart only; exact counts stay in cell labels and the linked Workouts day.

### Logging Forms

- Optimize the initial form for the most common logging path. Meal items show name, quantity, and unit first; workout sets show weight and reps first.
- Keep session timing, title, notes, nutrition, dropsets, and supersets available through clearly labeled optional disclosures.
- Automatically reveal optional fields when editing existing values so recorded data is never hidden from the user.
- Long-name inputs use the full available row. Short numeric inputs use balanced two-column groups on mobile and denser grids on desktop.
- On mobile, keep a sticky full-width save button above the bottom navigation with no bar, surface, or shadow behind it. On desktop, keep save in normal document flow.

### Sheets, Dialogs, and Feedback

- Use bottom sheets for short mobile choices and filters.
- Present the same form and filter popups as centered dialogs on tablet and desktop.
- Use dialogs for destructive confirmation and stale-edit conflicts.
- Confirm permanent deletion with a dialog that names the record and the result. The confirm control is a filled destructive button; Cancel stays secondary. Do not require typing a phrase or ID.
- Toasts confirm completed actions but never carry the only error explanation.
- Skeletons should match the final structure. Avoid generic full-page spinners.

## Landing Page

- The signed-out landing page is product-led and uses the same tokens, logo, typography, controls, and data language as the authenticated app, including theme support.
- The first viewport pairs a concise value proposition and shared sign-in/sign-up actions with an illustrative daily summary built from real Nirantar concepts.
- Mark illustrative fitness values as examples. Do not present them as user data or product claims.
- Explain only the core path: log workouts, meals, sleep, and body weight; review exact history; use that history through MCP-compatible AI tools.
- Avoid generic feature-card grids, testimonials, invented metrics, decorative photography, and repeated marketing claims.
- Closing actions and the footer remain unboxed, aligned to the main content container, and visually quiet.

## Interaction and Motion

- Optimize for tap and keyboard first; hover is supplementary.
- Use `150–220ms` color and opacity transitions with the shared `180ms ease-out` default.
- Avoid scale-on-hover effects that shift layout.
- Motion explains insertion, reordering, save state, and sheet transitions.
- Respect `prefers-reduced-motion`; disable all non-essential transition and animation.
- Do not animate primary data values merely for decoration.
- Theme changes apply instantly with no cross-fade.
- Show saving state immediately and prevent duplicate submissions.
- If an edit is stale, keep the user's draft and present a clear refresh/retry choice.

### Hover and Focus

- Hover behavior is defined by interaction role, not by page or component.
- Primary actions move from `action-bg` to `action-bg-hover`.
- Secondary actions move to `surface-strong` with `border-strong`.
- Delete, remove, and discard triggers (`tone="danger"`) move to `danger-soft` with a `danger` label. Filled destructive confirms move to `danger-hover`.
- `Cancel` does not use a danger hover. It is a safe exit.
- Text links move from `ink` to `energy-text` and reveal an underline.
- Navigation may use the domain `-soft` background to indicate destination affordance. Data cards and non-interactive surfaces do not react to hover.
- Every role retains the global visible focus ring using `focus-ring`; hover never replaces focus styling.

## Accessibility

- Meet WCAG AA contrast for text and interactive controls **in both themes**. Any token change requires re-checking both.
- Every input has a programmatic label and every error is associated with its field.
- Keyboard focus is always visible against both canvases.
- DOM and focus order match visual order.
- Touch targets are at least `44 × 44px`.
- Status, set type, and macro identity never depend on color alone.
- Charts, rings, and gauges expose their value, unit, and target to assistive technology.
- Announce save, validation, insertion, deletion, reorder, and theme-change results to assistive technology.
- Test at 200% zoom and with long values without horizontal page scrolling.

## Content Style

- Use short, concrete labels and sentence case.
- Prefer `No meals logged today` over vague empty copy.
- Use `kg`, `g`, `kcal`, `min`, and `reps` consistently.
- Display timestamps with Nepal-local context and an explicit offset where precision matters.
- Do not claim progress, nutrition totals, or completion when the data is incomplete.
- The voice is calm, direct, and factual. Encouragement comes from showing real progress clearly, not from exclamation.

## Required States

Every major surface must include, in both themes:

- First-use empty state with one clear action.
- Filtered or searched no-results state with a recovery action when filters are active.
- Loading state that preserves layout.
- Field-level validation errors.
- Network or server error with a safe retry via `FeedbackState`, not `EmptyState`.
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
- Reuse role tokens and components; do not hard-code near-duplicate colors, spacing, radii, or controls per page.
- Prefer Server Components for read-only shells and small client leaves for forms and interaction.
- Check `package.json` before importing a component, icon, animation, or form library.
- Components discovered through 21st are references: adapt them to these tokens, semantics, states, and accessibility rules.
- Validate the real running interface with Playwright in both themes; source inspection alone is not visual verification.

## Avoid

- Any hard-coded colour, or a component that branches on theme in TypeScript.
- Raw `energy` used as text or an icon on a light canvas; use `energy-text`.
- Crimson used as an ordinary primary action, link, or active navigation colour.
- Glassmorphism, background gradients on page canvases, and glow used anywhere except the dark-theme primary action and active navigation indicator.
- Leaderboards, follower counts, social feeds, and comparative ranking.
- Streak pressure, guilt messaging, and artificial gamification.
- Photography or illustration competing with logging and history.
- Generic dashboard grids as the default mobile layout.
- Cards within cards, and rounded containers around every element.
- Hidden units, ambiguous dates, unlabeled icons, or placeholder-only labels.
- A gauge, ring, or chart without its exact value in text.
- More than one dominant number per card.

## Implementation Checks

Before considering a surface complete, verify it at `375px`, `768px`, `1024px`, and `1440px` in both light and dark. Confirm no horizontal scrolling, no fixed control covers content, keyboard use is complete, focus is visible on both canvases, reduced motion works, theme switching leaves no unreadable element, and all loading, error, and empty states are represented.
