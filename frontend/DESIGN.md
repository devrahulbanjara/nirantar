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
- Show a binary workout-activity calendar for the last year (Nepal-local days with at least one workout).
- Keep `Log workout`, `Log meal`, and `Log weight` reachable without scrolling on a common phone viewport.

### Workouts

- Provide a Nepal-local date-filtered workout list (default today), workout detail, new-workout flow, and edit flow.
- The editor handles check-in/out, ordered exercises, physical sets, nested dropsets, supersets, title, and notes.
- Workout detail preserves exercise, set, dropset, and superset order exactly as returned.

### Meals

- Provide a date-grouped meal list (default today, optional start–end range), meal detail, new-meal flow, and edit flow.
- The editor saves a meal and all ordered food items as one aggregate.
- Show per-item nutrition only when known and label incomplete totals honestly.

### History

- Combine date navigation with body-weight history.
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
- Ordinary cards remain flat. Apply the shadow only to dialogs, sheets, and floating menus. Sticky save buttons stay bare—no panel or shadow behind them.

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

Mobile navigation uses four persistent destinations:

1. Today
2. Workouts
3. Meals
4. History

Use a bottom navigation bar on mobile and a compact side or top navigation on larger screens. Body weight belongs on Today or History; it does not need a permanent navigation item.

The current destination needs an icon and label. Use one consistent SVG icon family; prefer Phosphor if no project icon library exists. Do not hand-draw routine icons or use emoji as interface icons. Never use a sparkle icon; label AI and MCP features directly instead.

## Component System

This inventory is the shared contract for all current and future product surfaces. Agents must reuse an existing primitive or composite before introducing a new one. A component library may supply implementation mechanics, but its default appearance does not override these tokens, dimensions, states, or semantics.

### Foundations and layout primitives

- `PageContainer`: centered, full-width content with `16px` mobile, `24px` tablet, and `32px` desktop gutters; cap at `1120px`.
- `ReadingColumn`: text and simple forms capped at `680px`; never stretch to fill a desktop canvas.
- `PageHeader`: one page title, optional factual supporting copy, and visible primary action. Stack on mobile and align actions to the trailing edge on desktop.
- `Section`: groups one subject with a heading and optional action. Use spacing rather than a decorative container when no boundary is needed.
- `ResponsiveGrid`: use deliberate columns, never auto-fit merely to fill space. Summary/list grids are 1 column on mobile, may become 2 at tablet, and only use 3 or 4 columns when each cell remains readable and comparable.
- `FormLayout`: one column on mobile; at desktop use a `minmax(0, 680px)` form column and an optional `minmax(280px, 360px)` sticky summary rail, separated by `32px`.
- `Stack` and `Inline`: use only the documented spacing scale. Related controls use `8–12px`; card content uses `16–24px`; sections use `32–64px`.
- `Divider`: a single `hairline-soft` rule between repeated rows or major internal groups. Do not put every subsection in another card.

All grid children must use `min-width: 0`. Long names wrap instead of forcing horizontal scrolling. Align repeated measurements using CSS grid tracks and tabular numerals; do not align them with arbitrary margins.

### Shared primitives

| Primitive | Required variants and behavior |
| --- | --- |
| `Button` | Primary, secondary, tertiary, destructive, icon-only, loading, and disabled. Minimum `48px` high for labeled primary actions and `44 × 44px` for every touch target. Create/log actions (`Log workout`, `Log meal`, `Log weight`, and matching empty-state CTAs) always show a decorative `PlusIcon` before the label; the label text itself never includes a `+` character. Edit triggers use a pencil icon, not plus. |
| `IconButton` | One consistent icon family, visible hover/focus/pressed states, `aria-label`, and tooltip only when the meaning is not already visible. |
| `Field` | Persistent label, control, unit/add-on when relevant, helper text, and associated error. Never use placeholder text as the label. |
| `TextInput` | `56px` standard height, correct `inputMode` and autocomplete, `10px` radius, and no focus glow. |
| `NumberInput` | Explicit unit, decimal/integer keyboard, legal range guidance, and no silent coercion. Use for kg, g, kcal, and reps. |
| `Textarea` | Visible label, sensible mobile height, user resizing where layout permits, and preserved content after errors. |
| `Select` | Native control on mobile when it gives the better platform experience; custom popover only when search or richer options are genuinely needed. |
| `Checkbox` / `RadioGroup` | Entire label is clickable, state is not color-only, and the group has a programmatic name and error. |
| `SegmentedControl` | Two to four mutually exclusive compact views only. On narrow screens it must wrap safely or become a select. |
| `Badge` / `Status` | Text plus semantic icon where useful. Pills are reserved for compact status and filter information. |
| `Card` | One meaningful aggregate, `14px` radius, normally flat, with consistent title/metadata/action order. Interactive cards use a real link or button and visible focus. |
| `DataRow` | Stable label/value tracks, tabular numerals, explicit units, and wrapping for long labels. |
| `Skeleton` | Mirrors the final geometry and does not animate when reduced motion is requested. |
| `EmptyState` | No-data and no-results only. Centered-in-context surface with a 48px neutral icon treatment, factual heading, one-sentence explanation, and at most one next action. Nested variant is left-aligned and compact for detail sections. Full-width action on mobile, intrinsic width from tablet up. Cap at the 680px reading column. No decorative illustration. Do not use for network or unavailable failures—those stay on `FeedbackState`. |
| `InlineAlert` | Error, warning, success, or information with text and icon; includes recovery action when one exists. |
| `Toast` | Brief confirmation after a completed action; never the only location for an error or critical state. |
| `Tooltip` | Supplementary explanation for pointer/keyboard users, never required to discover a primary action and never the sole accessible name. |
| `InstallPrompt` | A dismissible floating install invitation shown only when the current device is eligible. It uses the native browser prompt where available, gives Safari-specific home-screen instructions, and stays above mobile navigation without covering primary actions. |

### Navigation and action patterns

- `AppShell`: mobile bottom navigation and desktop compact top/side navigation share the same four destinations and active-state semantics.
- `BottomNavigation`: fixed on mobile with safe-area padding, icon plus label, and no more than the four permanent destinations.
- `DesktopNavigation`: aligned to the same `PageContainer` grid. Account controls remain visually secondary to product navigation.
- `Breadcrumb` or `BackLink`: use on detail and edit flows when it clarifies the return destination. Do not duplicate browser history with ambiguous `Back` text.
- `QuickActions`: Today may present `Log workout`, `Log meal`, and `Log weight` as immediately visible actions; they must not be hidden in an overflow menu. Use the same plus-before-label create treatment as collection headers and empty-state CTAs.
- `StickyActionBar`: mobile full-width save action that stays reachable above the bottom navigation. No panel background, border, or shadow behind the button—only the button itself. Desktop actions remain in normal flow or the summary rail unless persistence is necessary.
- `Tabs`: use for peer views, not as a substitute for primary navigation or a multi-step form.

### Date and time components

Dates are product data, not decorative labels. Parse, compare, and display calendar values in `Asia/Kathmandu`; never derive a user-facing day from the server timezone.

#### `DatePicker`

- Use for one Nepal-local calendar date, such as body-weight entry.
- The field keeps a persistent label and a readable formatted value; the calendar button has an accessible name.
- Calendar day targets are at least `44 × 44px` in Nirantar, improving on the smaller reference component.
- Provide distinct textual or programmatic states for today, selected, unavailable, and outside-month days. Selected uses `ink` or `primary` fill with sufficient contrast; today is never indicated by color alone.
- Month navigation uses `44 × 44px` previous/next buttons and announces the visible month.
- Support arrow-key day movement, Home/End within a week, Page Up/Page Down between months, Enter/Space selection, and Escape close when a popover is used.
- On mobile, prefer the native date input when it is reliable for the flow; otherwise open a full-width bottom sheet. On desktop, use an anchored popover that stays within the viewport.

#### `DateRangePicker`

- Use for History filtering, with explicit `Start date` and `End date` fields. Never make users infer which endpoint is active.
- Range start and end are circular selected cells. Dates between them use a connected `surface` background; state remains understandable to assistive technology without color.
- Reject an end before the start with a field-level explanation. Preserve both entered values when validation fails.
- Provide `Today`, `Last 7 days`, `Last 30 days`, and `Clear` only where the server contract can express them exactly. Applying a range is explicit; closing the surface does not silently discard a committed filter.
- On mobile, use a bottom sheet or full-screen surface with one month and a sticky `Apply dates` action. On desktop, use an anchored panel and show one or two months only when space permits without shrinking day targets.
- The active range remains visible in the page URL and in a removable filter summary.

#### `DateTimeField` and `TimeField`

- Use the appropriate native control where possible, with a visible Nepal-time note when ambiguity matters.
- Store and submit timezone-aware ISO 8601 values. Show the offset on detail or conflict surfaces where precision is important.
- Check-out must visually and programmatically follow check-in; invalid ordering is reported beside the relevant field.

### Overlays and disclosure

- `Popover`: anchored, non-modal choices on desktop; dismisses with Escape and outside click without losing committed state.
- `BottomSheet`: short mobile choices and filters. It has a visible title, close control, focus management, scroll containment, and safe-area padding.
- `Dialog`: destructive confirmation, stale-edit conflict, or another decision requiring protected focus. It traps focus, restores focus to its trigger, and closes with Escape unless an irreversible operation is running.
- `ConfirmDialog`: states the exact record name or ID, consequence, and explicit destructive verb. The destructive action remains visually secondary until this step.
- `StaleConflictDialog`: preserves the draft and clearly separates refresh, retry, and cancel outcomes.
- `Menu`: secondary actions only. Primary save, log, edit, or recovery actions never live solely inside it.
- `BackButton`: the only in-app back affordance. It uses browser history when available, a route fallback for direct entry, the shared left-arrow treatment, a `44px` minimum target, and context-specific labels such as `Back to meals`. Do not create route-local back links or alternate hover treatments.
- `ViewToggle`: the only list/grid selector. Icon-only options with accessible names (`List view`, `Grid view`), each a `44 × 44px` target. Workouts, meals, and history use separate local-storage preference keys and retain the selected view through filtering and navigation.

Mobile disclosure becomes a sheet only when the content remains a short choice or filter. Long forms stay pages; do not place workout or meal creation inside a modal.

### Domain composites

- `DailySummary`: server-owned facts with honest missing and incomplete states; quick logging actions remain visible above the fold on a common phone.
- `WorkoutActivityCalendar`: Nepal-local year heatmap of workout presence (binary active/inactive). Compact cells, crimson for active days, horizontal scroll on narrow viewports, tooltips/aria with exact workout counts, and day links into the filtered Workouts list. Not a GitHub-green clone.
- `WorkoutCard` and `WorkoutDetail`: stable order of local date/time, title, duration, set counts, completion state, and actions.
- `ExerciseCard`: one performed exercise with ordered set rows and optional superset membership.
- `SetRow`: order, textual set type, weight in kg, and reps aligned consistently. A dropset is indented beneath and visibly connected to its working-set parent.
- Nested rails and indentation appear only when nested records exist. Nested empty states use the compact `EmptyState` variant without a decorative line or placeholder hierarchy.
- `SupersetGroup`: labeled ordered group whose membership and member order do not rely on proximity alone.
- `MealCard` and `MealDetail`: name, Nepal-local time, ordered foods, totals, and completeness in a stable hierarchy.
- `FoodItemRow`: name first, quantity and unit second, then only known nutrition. Unknown values read `Not provided`.
- `NutritionCompleteness`: known total plus coverage, such as `Protein: 42 g · 2 of 3 items`; never substitutes zero for unknown.
- `WeightEntry`: Nepal-local date, decimal `kg` value, correction state, and save feedback.
- `HistoryFilterBar`: current date range and other active filters, clear affordances, and the responsive `DateRangePicker` disclosure. Implemented by the shared date-range filter bar on Workouts, Meals, and History.
- `HistoryGroup`: local-date heading followed by exact records. Lists remain the source for exact values even when a trend chart is later added.

### Component state contract

Every reusable interactive component must account for default, hover where relevant, focus-visible, pressed, disabled, loading, error, and success states. Every data surface must account for loading, empty, unavailable/network error, long content, and partial/missing values. Editors additionally require dirty, saving, saved, validation error, server error, and stale-conflict states.

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
3. Use semantic design tokens from the shared stylesheet. Add a token only for a recurring role, not for a one-off value.
4. Implement mobile layout first, then tablet, desktop, and wide compositions. Keep DOM order meaningful at every size.
5. Include required loading, empty, validation, network error, saving, saved, long-content, incomplete-data, and stale-conflict states that apply.
6. Verify the running UI with Playwright at `375px`, `768px`, `1024px`, and `1440px`. Check horizontal overflow, clipped/fixed content, focus order and visibility, keyboard operation, touch targets, reduced motion, console errors, and 200% zoom.
7. Review the final diff for local style duplication, hard-coded near-token values, inaccessible names, unsupported claims, and unrelated changes.

When a new pattern is truly reusable, update this component inventory in the same change. Do not document speculative components that no current product flow needs.

### Buttons

- Primary buttons are solid crimson and at least `48px` high.
- Pressed primary buttons use `primary-active` without scale, translation, or shadow changes.
- Disabled primary buttons use `primary-disabled` with a readable ink label and never rely on opacity alone.
- Loading buttons retain their width, indicate progress, and prevent duplicate submission.
- Secondary buttons use a visible neutral border.
- Tertiary actions are text or icon buttons with a clear hover and focus state.
- Destructive buttons are visually secondary until confirmation.
- Icon-only touch targets are at least `44 × 44px` and require accessible labels.
- Labels describe the result: `Save workout`, `Add set`, `Log meal`. Create/log buttons pair those labels with `PlusIcon`; do not write `+ Log meal` as text.

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

- Optimize for one-handed phone use in the gym. Session timing, title, notes, warm-ups, dropsets, reorder, and supersets stay out of the default path.
- One exercise card contains its ordered physical sets.
- Start a new exercise with one working set. `Add another set` is a full-width primary action on mobile, carries forward the previous set's weight, reps, and type, never copies dropsets, and focuses the new weight field.
- The primary logging row shows a compact set heading plus a two-column weight/reps grid. Type changes, dropsets, and removal live under a per-set `More` disclosure.
- Warm-up, working, and dropset labels remain textual.
- Indent dropsets beneath their parent working set and preserve the connection with a line or grouping, not color alone.
- Superset members share a labeled group and explicit member order.
- `Add another set` remains on the current exercise; full-width `Add exercise` follows the exercise list on mobile.
- Keep `Save workout` sticky above the mobile bottom navigation without covering the last fields.

### Meal Logging

- A meal card contains its ordered food items.
- Each item shows name first, then quantity/unit and known nutrition.
- Unknown nutrition displays `Not provided`, never `0`.
- Totals must state completeness, such as `Protein: 42 g · 2 of 3 items`.
- Adding another food item is an inline primary flow, not a separate page.

### History and Summaries

- Date grouping uses the user's `Asia/Kathmandu` calendar day.
- Filters open in a bottom sheet on mobile and an anchored panel on desktop.
- Body-weight list view stays compact; grid view uses balanced two-column cards on desktop and one column on mobile. Neither view stretches low-density rows across the full desktop grid.
- Summary tiles show one fact each and do not imply unavailable data.
- The Today workout-activity calendar is a presence chart only; exact counts stay in cell labels and the linked Workouts day filter.
- Use charts only when a trend is clearer than a compact list; always retain exact values.

### Logging Forms

- Optimize the initial form for the most common logging path. Meal items show name, quantity, and unit first; workout sets show weight and reps first.
- Keep session timing, title, notes, nutrition, dropsets, and supersets available through clearly labeled optional disclosures.
- Automatically reveal optional fields when editing existing values so recorded data is never hidden from the user.
- Long-name inputs use the full available row. Short numeric inputs use balanced two-column groups on mobile and denser grids on desktop.
- On mobile, keep a sticky full-width save button above the bottom navigation with no bar, surface, or shadow behind it. On desktop, keep save in normal document flow.

### Sheets, Dialogs, and Feedback

- Use bottom sheets for short mobile choices and filters.
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
- Use `kg`, `g`, `kcal`, and `reps` consistently.
- Display timestamps with Nepal-local context and an explicit offset where precision matters.
- Do not claim progress, nutrition totals, or completion when the data is incomplete.

## Required States

Every major surface must include:

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
