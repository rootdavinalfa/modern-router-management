# Task 3 brief — theme/token consolidation (REVISED)

## Context
User's shadcn setup created `packages/ui/src/styles/globals.css` (127 lines of shadcn tokens, style base-sera, baseColor neutral, dark mode `.dark`, `tw-animate-css`) and ALSO appended a copy of token CSS to `apps/web/src/styles.css` (see commit efaf355: `apps/web/src/styles.css | 127 +++`). The user's own task.md note flags: "consolidate the duplicated shadcn token blocks between apps/web/src/styles.css and packages/ui/src/styles/globals.css." That is this task.

Fonts: `@fontsource-variable/raleway` + `@fontsource-variable/public-sans` are now npm deps of both packages (setup installed them; the old Google Fonts @import for Fraunces/Manrope in styles.css is obsolete).

`apps/web` consumes shadcn CSS how? Tailwind v4 runs in apps/web via `@tailwindcss/vite`, and `__root.tsx` links `appCss` = `apps/web/src/styles.css?url`. For registry components (rendered in apps/web but defined in packages/ui) to see the shadcn tokens/theme, the tokens must be present in the CSS Tailwind processes for apps/web — i.e. in `apps/web/src/styles.css` (via @import of the package globals) OR duplicated. The user's setup duplicated the block into styles.css already — verify which import path actually works before choosing.

## Requirements
- Single source of truth for theme tokens: `packages/ui/src/styles/globals.css`.
- `apps/web/src/styles.css` becomes a thin Tailwind entry: `@import "tailwindcss";` + `@import "@modern-router-management/ui/globals.css";` (or `@import "../../../packages/ui/src/styles/globals.css"` if package import fails under Vite — test it) + any apps/web-only base styles.
- REMOVE the duplicated token block from `apps/web/src/styles.css` (it currently duplicates globals.css).
- REMOVE the obsolete Google Fonts `@import url(...Fraunces...Manrope...)` and the custom sea/lagoon `:root`/`:root[data-theme]`/`@media (prefers-color-scheme: dark)` token blocks? NO — KEEP the legacy class definitions (`.island-shell`, `.feature-card`, `.island-kicker`, `.rise-in`, `.nav-link`, `.site-footer`, `.display-title`, body gradient layers, `body::before/::after`, `a`/`code` styling, `.page-wrap`, `.prose` blocks) because the dashboard still renders them until Task 6 rebuild. BUT the legacy classes reference the removed custom vars (--sea-ink etc.) — so KEEP the custom var definitions they reference too (the `:root`/`:root[data-theme=dark]`/`@media` custom blocks) UNTIL T6 deletes the classes. Ruling from the controller: T3 consolidates the shadcn token duplication + fonts ONLY; the full legacy CSS (vars + classes) is deleted in T6 with the dashboard rebuild. If keeping both token systems (shadcn + legacy) in styles.css is messy, you may move the legacy block to a clearly-marked section "LEGACY — deleted in T6" without changing its content.
- Fonts: ensure raleway is the UI sans and public-sans the heading font per globals.css `@theme` (the setup already encodes this in globals.css + styles.css — verify they agree and use the fontsource variables, not Google CDN).
- The `THEME_INIT_SCRIPT` in `apps/web/src/routes/__root.tsx` must still toggle `.light`/`.dark` on `<html>` consistently with globals.css dark tokens (check how base-sera styles gate dark mode: `.dark` class vs `prefers-color-scheme`; if init script only handles `[data-theme]` + class `light`/`dark` and base-sera expects class `dark`, align the script — minimal edit, keep behavior).
- Verification: `cd apps/web && bunx tsc --noEmit` (only NEW errors fail), `bunx eslint .` (new only), run `bun run dev` in apps/web and visually check light+dark render with tokens present (if you can start it briefly and curl the CSS or check the page; a browser check is ideal but optional — if you cannot run a browser, verify the built CSS pipeline via `bun run build` succeeding and grepping dist CSS for `--background`/`oklch` tokens + absence of `Fraunces`).
- Commit explicit paths: `git add packages/ui/src/styles packages/ui/package.json apps/web/src/styles.css apps/web/src/routes/__root.tsx` (only changed).
- Commit message: `feat(ui): consolidate shadcn theme tokens and font sources`

## Acceptance
- No duplicated shadcn token block between globals.css and apps/web styles.css; fonts load from fontsource (no Google CDN); legacy CSS intact-but-marked (deleted T6); tsc/eslint new-clean; app builds.
