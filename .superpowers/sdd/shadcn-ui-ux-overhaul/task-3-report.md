# Task 3 report — theme/token consolidation

Status: DONE

## What changed

Commit `77414d9` — `feat(ui): consolidate shadcn theme tokens and font sources` (1 file, `apps/web/src/styles.css`, +17/−133).

`packages/ui/src/styles/globals.css` is now the single source of truth for shadcn theme tokens, fonts, dark variant, and the base layer. `apps/web/src/styles.css` is a thin Tailwind entry that imports it by package subpath:

```css
@import "tailwindcss";
@import "@modern-router-management/ui/globals.css";
@plugin "@tailwindcss/typography";
```

then keeps the legacy dashboard styles, clearly marked, in one section.

### Removed from `apps/web/src/styles.css` (all byte-duplicated from globals.css)
- Google Fonts `@import url(...Fraunces...Manrope...)` — obsolete (fontsource now supplies fonts); no Google CDN request remains.
- Duplicate `@import "tw-animate-css"`, `@import "shadcn/tailwind.css"`, `@import "@fontsource-variable/raleway"`, `@import "@fontsource-variable/public-sans"`.
- Duplicate `@custom-variant dark (&:is(.dark *))`.
- Duplicate plain `@theme { --font-sans: "Manrope", ... }` (the pre-shadcn font override) — Manrope is no longer a dependency anywhere.
- The 45-line shadcn `:root` token block appended inside the legacy palette `:root`.
- The trailing duplicate `.dark { … }` token block and the duplicate `@theme inline { … }` mapping block.
- The trailing duplicate `@layer base { * / body / html }` block (globals.css already applies `* { @apply border-border outline-ring/50 }` and `body { @apply bg-background text-foreground }`; `html { @apply font-sans }` is redundant since Tailwind preflight uses `--default-font-family` → `--font-sans`).

### Kept verbatim (legacy dashboard styles — still used until Task 6 rebuilds the dashboard)
- Legacy palette vars `:root` (light), `:root[data-theme="dark"]`, and the `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` block — all referenced by live components (Header, Footer, dashboard cards, MdxCallout/MdxMetrics, index route).
- All legacy class rules: `.island-shell`, `.feature-card`, `.island-kicker`, `.nav-link`, `.rise-in` + keyframes, `.site-footer`, `.page-wrap`, body gradient layers + `body::before/::after`, `a`/`code` styling, `.prose` rules.
- These are bracketed by a `LEGACY DASHBOARD STYLES` banner comment stating they are kept only until T6 deletes them.
- `@plugin "@tailwindcss/typography"` retained (prose block usage in Mdx* docs; plugin stays apps/web-local).

### Adjusted
- `.display-title { font-family: "Fraunces", Georgia, serif }` → `"Public Sans Variable", Georgia, serif` (comment added) — Fraunces was only loaded via the removed Google CDN import; falls back to the consolidated heading font instead of a dead family.

### No change needed (verified)
- `packages/ui/package.json`: already exports `"./globals.css": "./src/styles/globals.css"` (committed efaf355) — the `@modern-router-management/ui/globals.css` import resolves in Vite through the workspace symlink `apps/web/node_modules/@modern-router-management/ui → packages/ui`, so the package import path is used, not a relative path.
- `apps/web/src/routes/__root.tsx` THEME_INIT_SCRIPT: already aligned with base-sera's `.dark` class gate — it toggles `.light`/`.dark` class on `<html>` and sets `data-theme` only for explicit (non-auto) modes; globals.css gates dark tokens with `.dark { … }` via `@custom-variant dark (&:is(.dark *))`. No edit needed; behavior unchanged.
- `packages/ui/src/styles/globals.css`: unchanged; byte-identical token content verified against the removed duplicates (`diff` clean on the extracted token blocks).

## Verification

### Build pipeline (apps/web, bun run build) — PASS
- `vite build` client + SSR succeeded. Fontsource assets emitted: `raleway-latin-wght-normal-*.woff2`, `public-sans-latin-wght-normal-*.woff2`, etc.
- Built CSS `dist/client/assets/styles-*.css` (34.79 kB) contains `--background:oklch(100% 0 0)` / light `:root` tokens, `.dark{--background:oklch(14.8% .004 228.8);--foreground:oklch(98.7%…)}` block, `--sea-ink`, `@keyframes rise-in`, `.island-shell`, `font-family:"Raleway Variable",sans-serif`, `font-family:Public Sans Variable` (4 @font-face declarations each).
- Absent from built CSS (all count 0): `Fraunces`, `Manrope`, `fonts.googleapis.com`, `fonts.gstatic.com` — no Google CDN font references remain.

### Dev server + browser check (bun run dev, port 3000) — PASS
- SSR HTML serves `href="/src/styles.css"`; page includes THEME_INIT_SCRIPT (`root.classList.add(resolved)`).
- Dev-processed CSS (`/src/styles.css` endpoint, 47 kB): contains light tokens, `.dark { --background: oklch(0.148 0.004 228.8); … }`, legacy `@media (prefers-color-scheme: dark)` palette, `Raleway Variable`/`Public Sans Variable` @font-face, no `@import`, no Fraunces/Manrope/googleapis/fonts.gstatic.
- Headless browser (1280×900):
  - Initial render (system dark): `html` class `dark`, `color-scheme: dark`, `--background` = `oklch(0.148 0.004 228.8)`, `--bg-base` = `#0a1418`; body font `"Raleway Variable", sans-serif`; `.display-title` font `"Public Sans Variable", Georgia, serif`; `document.fonts` contains both `Raleway Variable` and `Public Sans Variable` (loaded, not pending).
  - Forced `light`: class `light`, `--background` = `oklch(1 0 0)`, `--bg-base` = `#e7f3ec`, `--sea-ink` = `#173a40`, `--header-bg` = `rgba(251,255,248,0.84)`; header border computed `rgba(23,58,64,0.14)` (`var(--line)`) and header background applied; body keeps legacy gradient layers (`radial-gradient(1100px 620px at -8% -10%, rgba(79,184,178,0.36)…`) — legacy theme functions in both modes with tokens from the single imported source. Screenshot capture timed out in the headless environment; computed-style evidence above stands.

### tsc/eslint — no NEW errors
- `bunx tsc --noEmit` → exit 2, 5 errors, all in `src/routes/index.tsx` (3) and `src/components/dashboard/WANConnectionCard.tsx` (2) — pre-existing, owned by later tasks (per brief). Only a CSS file changed, so none can be new.
- `bunx eslint .` → 28 problems (27 errors, 1 warning) across 8 files: `src/lib/api.ts`, `src/routes/index.tsx`, `src/integrations/better-auth/header-user.tsx`, `src/integrations/tanstack-query/root-provider.tsx`, and 4 dashboard components (`PONOpticalModule`, `RouterSelector`, `RouterSetupForm`, `WANConnections`) — all pre-existing (last touched commit f9b411e), none in the changed file or path set.

## Commit
- Hash: `77414d9`
- Message: `feat(ui): consolidate shadcn theme tokens and font sources`
- Staged list: `apps/web/src/styles.css` (only file; 1 file changed, 17 insertions(+), 133 deletions(-))

## Concerns
- `.display-title` (dashboard hero, used by `components/dashboard/DashboardHeader.tsx`) no longer renders in Fraunces — the Google Fonts import was the only Fraunces source, so the family is gone repo-wide. It now falls back to Public Sans Variable via the fontsource heading font. Visual weight may differ slightly until Task 6 rebuilds the dashboard; if the Fraunces look is desired for the rebuilt design, add `@fontsource-variable/fraunces` to packages/ui and re-point `--font-heading`.
- Headless browser screenshot capture timed out in this environment; render verification relies on computed-style/document.fonts evidence (all assertions passed) rather than a pixel image.
- Legacy CSS kept intact under a banner comment per the brief; Task 6 must delete both the legacy class rules and the legacy palette var blocks (light/dark/media) together.
- `@theme` font overrides now live in globals.css (`--font-sans: 'Raleway Variable'`, `--font-heading: 'Public Sans Variable'`), which the registry components consume via `font-heading` utilities (card/alert-dialog/dialog/sheet titles) — verified emitted in the built CSS.
