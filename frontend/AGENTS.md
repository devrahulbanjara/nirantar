<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Nirantar UI contract

- Read `DESIGN.md` completely before changing any product UI, landing, auth, or shared frontend component.
- Treat `DESIGN.md` as the single visual and interaction source of truth. Do not create a competing page-local design system or silently import defaults from a component library.
- Appearance is defined only inside shared primitives. Pages compose those primitives; they never pass `className`, `style`, or raw CSS strings into them.
- Build mobile first, then verify the same layout system at `375px`, `768px`, `1024px`, and `1440px` in both light and dark with Playwright before calling UI work complete.
- Reuse the primitives and patterns named in the `Component system` section of `DESIGN.md`. If a reusable pattern is missing, define its contract there when adding it.
- Theme is first-class. Never hard-code a colour or branch on theme in TypeScript; resolve appearance through tokens.
- Preserve Nirantar's fitness language, data density, domain accents, deterministic facts, and accessibility requirements.
