# Task 1 brief — shadcn init preset b2dwXaSzv0

## Context
Repo: monorepo Turborepo/Bun at repo root. Web app is `apps/web` (TanStack Start SSR, React 19, Tailwind CSS v4 via `@tailwindcss/vite`, `@/*` and `#/*` aliases both point to `./src/*`, tsconfig already has the alias). This task bootstraps shadcn/ui into `apps/web` with preset code `b2dwXaSzv0`. It is task 1 of 15 of a UI overhaul; later tasks build registry components and pages on top.

## Requirements (verbatim values)
- Run shadcn init with the preset. Decoded preset (verified): style `sera`, baseColor `mist`, theme `sky`, chartColor `pink`, iconLibrary `lucide`, font `raleway`, fontHeading `public-sans`, radius `default`, menuAccent `subtle`, menuColor `default-translucent`. These exact values are the design; do NOT re-theme.
- Command form (from repo root or apps/web): `npx shadcn@latest init --preset b2dwXaSzv0 -c apps/web`
- Non-interactive flags confirmed available: `-y/--yes` (skip confirm), `--base color` (component library base — MUST pass `--base color` to keep the shadcn color system), `--css-variables` default true. Prompt sequence will ask: base color, css variables, pointer cursor, and possibly monorepo/workspace — answer via flags to avoid hanging: use `--base color --css-variables -y`. If it prompts for framework template (`start`/`next`), the repo IS TanStack Start — the CLI detects it from the app; if a `-t/--template` flag is demanded pass `start`.
- IMPORTANT: this repo root has UNCOMMITTED user edits to `package.json`, `bun.lock`, `Dockerfile` in the working tree. The init may update `apps/web/package.json` (intended) and possibly root `bun.lock` (via bun install) — DO NOT `git add` root `package.json`, root `bun.lock`, or `Dockerfile` in ANY commit.
- Workspace/monorepo question: if the CLI asks whether to install into a workspace package, answer NO / keep components in the app (`apps/web/src/components/ui`) — do NOT use a `--workspace`-style monorepo install into `packages/ui`. Do NOT pass `--monorepo`.

## Steps
1. From `apps/web` run the init command with non-interactive flags:
   `cd apps/web && bunx shadcn@latest init --preset b2dwXaSzv0 --base color --css-variables -y -c apps/web`
   If it still prompts interactively and hangs, try `--force` + explicit `-t start`; if genuinely stuck in a TTY prompt, report BLOCKED with the exact prompt text.
2. Inspect results:
   - `apps/web/components.json` exists and contains preset values (style sera, mist/sky colors, raleway/public-sans fonts, lucide).
   - `apps/web/src/components/ui/` has the base components init generated.
   - `apps/web/src/lib/utils.ts` exports `cn`.
   - `apps/web/src/styles.css` now has shadcn token CSS (keep whatever init wrote; do NOT delete the legacy custom classes yet — a later task owns that).
3. Type/lint/format verification:
   - `cd apps/web && bunx tsc --noEmit` — must pass
   - `cd apps/web && bunx eslint .` — must pass (fix any NEW errors the init introduced; do not reformat unrelated files)
   - `cd apps/web && bunx prettier --check .` — may report pre-existing formatting on files you did not touch; do NOT fix those. If it fails ONLY on untouched files, note it in the report and skip.
4. Commit ONLY the feature files with explicit paths:
   `git add apps/web/package.json apps/web/components.json apps/web/src/styles.css apps/web/src/lib/utils.ts apps/web/src/components/ui apps/web/src/lib` (add only paths that exist and changed; NEVER add root package.json / bun.lock / Dockerfile)
   `git commit -m "feat(web): bootstrap shadcn/ui with preset b2dwXaSzv0"`
   If `bunx shadcn init` modified root `bun.lock` (it may, via install), LEAVE it unstaged — do not commit it.

## Acceptance
- `components.json` reflects the preset values; `src/components/ui` populated; `cn` export exists; tsc + eslint pass; feature commit exists; root manifests/Dockerfile NOT in the commit.
