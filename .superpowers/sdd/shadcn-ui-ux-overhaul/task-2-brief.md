# Task 2 brief — add remaining shadcn registry components (REVISED for user setup)

## Context
The shadcn setup is COMPLETE (user handoff, commits efaf355/d2c8a96). Registry components live in `packages/ui/src/components/*` (style `base-sera`, `cn` npm package, base-ui/react). `apps/web/components.json` aliases `ui` → `@modern-router-management/ui/components` and `utils` → `@modern-router-management/ui/lib/utils`; `packages/ui/package.json` already has wildcard subpath exports (`./components/*`, `./lib/*`, `./hooks/*`, `./globals.css`). Components already present: badge, button, card, input, label, table.

## Requirements
Add the registry components the overhaul pages need, matching the layout above. From repo root run:

`cd apps/web && npx shadcn@latest add sheet dialog alert-dialog dropdown-menu skeleton select switch tabs separator progress tooltip avatar scroll-area sonner breadcrumb form -c apps/web`

- Per components.json the CLI will place generated files under `packages/ui/src/components/` (via the alias). Accept that. If the CLI instead wants to create `apps/web/src/components/ui`, STOP and report BLOCKED with the exact output — the alias wiring should prevent that.
- If a component name is rejected/renamed by the registry (e.g. `sidebar`, `sonner`), use the CLI's suggested name and record it. Do NOT hand-write components the CLI adds successfully. If a needed component (e.g. `sidebar`) has no registry entry in this version, note it and move on — a later shell task composes from primitives (sheet etc.).
- After adding: verify files exist under `packages/ui/src/components/`; check `packages/ui/package.json` exports still cover them (wildcard `./components/*` already does).
- Also run `bunx shadcn@latest add chart -c apps/web` ONLY if the Devices page chart (T9) needs it — DO NOT add speculative components. Skip chart unless a later task asks.
- Verification: `cd apps/web && bunx tsc --noEmit` — pre-existing errors in `src/components/dashboard/WANConnectionCard.tsx` and `src/routes/index.tsx` are KNOWN and owned by a later task; only NEW errors introduced by your change count as failures. Run `bunx eslint .` (same rule: new failures only). `bunx prettier --check .` — fix formatting ONLY in files you created/touched.
- Commit with explicit paths: `git add packages/ui/src/components packages/ui/package.json packages/ui/components.json apps/web/components.json apps/web/package.json bun.lock` (only what actually changed; bun.lock only if the CLI install changed it and NO user edits are pending on it — they are not, user's bun.lock work is committed).
- Commit message: `feat(ui): add shadcn registry components for overhaul pages`

## Acceptance
- Listed components present under packages/ui/src/components; tsc/eslint have NO new errors; commit staged only relevant files.
