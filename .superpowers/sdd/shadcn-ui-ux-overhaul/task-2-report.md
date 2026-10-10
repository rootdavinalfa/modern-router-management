# Task 2 Report — add remaining shadcn registry components

## Status
DONE_WITH_CONCERNS

## What changed
Ran from repo root (component.json lives in apps/web; CLI aliases `ui` → `@modern-router-management/ui/components`):

`npx shadcn@latest add sheet dialog alert-dialog dropdown-menu skeleton select switch tabs separator progress tooltip avatar scroll-area sonner breadcrumb form -c apps/web -y`

Files created (15) under `packages/ui/src/components/` — all CLI-generated, none hand-written:
- alert-dialog.tsx, avatar.tsx, breadcrumb.tsx, dialog.tsx, dropdown-menu.tsx, progress.tsx, scroll-area.tsx, select.tsx, separator.tsx, sheet.tsx, skeleton.tsx, sonner.tsx, switch.tsx, tabs.tsx, tooltip.tsx

Files modified:
- `packages/ui/package.json` — CLI added deps `sonner@^2.0.8` and `next-themes@^0.4.6` (used by sonner.tsx); wildcard subpath exports `./components/*` already cover new files, unchanged.
- `bun.lock` — +6 lines for the two new deps. No user edits pending (user's bun.lock work committed at d2c8a96).

Skipped by CLI: `button.tsx` (identical to installed copy — expected).
Not created: `form.tsx` — see Concerns.

Commit: `d857a28` — `feat(ui): add shadcn registry components for overhaul pages` (17 files, +1586/−0).

Staged list (explicit paths only, no `git add -A`):
- `packages/ui/src/components/` (15 new files)
- `packages/ui/package.json`
- `bun.lock`

## Verification

### File placement / exports
- All 15 files present under `packages/ui/src/components/` (confirmed via `ls`).
- Imports follow base-sera conventions: `cn` npm package, `@base-ui/react` primitives, `@modern-router-management/ui/components/button` for cross-component imports (alert-dialog/dialog/sheet). No broken internal paths.
- `packages/ui/package.json` wildcard export `./components/*` covers all new files — no export change needed.

### TypeScript — `cd apps/web && bunx tsc --noEmit`
Result identical to pre-change baseline (verified by stashing the 15 new files + package.json/bun.lock, re-running tsc, then restoring):
- Pre-existing errors ONLY (known, owned by later task): `src/components/dashboard/WANConnectionCard.tsx` (2× TS2345), `src/routes/index.tsx` (TS6133 ×2, TS2740 ×1).
- NEW errors from this change: **0**. tsc exit 2 attributable entirely to the 4 known pre-existing errors.

### ESLint — `cd apps/web && eslint .`
**Could not be run: pre-existing broken config, unrelated to this change.**
- `bunx eslint .` / `bunx eslint@9.39.3 .` both fail before linting any file:
  `ConfigError: Config (unnamed): Unexpected key "0" found.`
- Root cause (diagnosed): `apps/web/eslint.config.js` default-exports `{ ...tanstackConfig, rules: {} }` where `tanstackConfig` is an **array** of 3 config objects. Spreading it yields numeric keys `0`,`1`,`2` — ESLint flat config requires an exported array, not an object with numeric keys. The same config loads and lints cleanly when wrapped as an array (`ESLint` API + eslint 9.39.3: `LINT OK`). This is a repo-level config bug that predates this task and blocks `apps/web` lint regardless of my change; I did not modify the config (out of scope). A sibling/later task should fix `eslint.config.js` to `export default [...tanstackConfig, { rules: {} }]`.
- No lint verdict can be attributed to the new files given the config failure — but the files are stock registry output matching the existing 6 components (badge/button/card/input/label/table) which lint under the same rules, and none of the new files are referenced by app code yet, so no new lint failures are plausible.

### Prettier — `bunx prettier@3.5.3 --check` on the 15 new files
`All matched files use Prettier code style!` (exit 0). No formatting fixes needed.

## Commit
`d857a28` — feat(ui): add shadcn registry components for overhaul pages
Staged: 15 component files under `packages/ui/src/components/`, `packages/ui/package.json`, `bun.lock`. Working tree clean apart from pre-existing untracked `.superpowers/` and `docs/superpowers/`.

## Concerns
1. **`form` component unavailable for the base-sera style.** The brief's command lists `form`, but upstream `https://ui.shadcn.com/r/styles/base-sera/form.json` is an empty stub — `{ name, type }` only, no `files`, `dependencies`, or `registryDependencies`. The CLI resolves it as a silent no-op (exit 0, nothing written; also true with `-y`, explicit URL add, and the dry-run never listing it). The new-york style ships a full react-hook-form `form`, but base-sera does not. Noted and moved on per brief. If the overhaul pages need form primitives, options: hand-write `form.tsx` per base-sera conventions (uses `cn` + `@base-ui/react` — `useRender` etc.) or wait for upstream to ship it. Pages needing RHF (login etc.) already have `react-hook-form`, `zod`, `@hookform/resolvers` in apps/web deps, so consumers are unblocked.
2. **`sonner.tsx` + `next-themes` added.** The CLI pulled `sonner` and `next-themes` into `packages/ui` (not apps/web). `next-themes` is required by the base-sera sonner component. If the app never mounts the `<Toaster/>`, these are unused runtime deps — expected until a later task composes the toast provider.
3. **ESLint cannot run on apps/web** (pre-existing config bug, see Verification). tsc and prettier pass with zero new errors; eslint verdict is N/A for this change. Recommend a follow-up fix of `eslint.config.js` (wrap tanstackConfig in an array) in the task that owns web tooling.
4. **Tooltip note:** CLI reminds consumers to wrap the app in `<TooltipProvider>` — relevant to later layout/shell tasks.
5. Chart intentionally NOT added (brief: only if T9 Devices page asks for it; not requested yet).
