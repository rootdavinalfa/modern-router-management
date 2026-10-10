# Task 4 Report — App Shell: app bar + responsive nav drawer + footer

## Status
DONE_WITH_CONCERNS

## What changed

Commit `7c961c9` (`feat(web): app shell with app bar, nav drawer, toaster`) on `feat/shadcn-ui-overhaul` — 12 files, +442/−148.

**Created `apps/web/src/components/shell/`:**
- `AppNav.tsx` — shared nav (Dashboard `/` exact, Devices `/devices`, WiFi `/wifi`, Settings `/settings`) with lucide icons + `activeProps` highlight; rendered vertical (drawer) and inline (desktop bar).
- `AppShell.tsx` — layout wrapper: `<div min-h-dvh flex flex-col>` → Header + `<main>` (max-w-7xl px-4 py-6 md:py-8) + Footer + theme-aware `<Toaster />`.
- `UserMenu.tsx` — replaces BetterAuthHeader/header-user.tsx: keeps `authClient.useSession()` logic; signed-out shows ghost "Sign in" button; signed-in shows Avatar + DropdownMenu (name/email label, destructive Sign out item via `authClient.signOut()`); skeleton while pending.
- `Toaster.tsx` — mounts sonner `<Toaster>` feeding `theme={resolved}` from the shared theme store (NOT next-themes; app has no ThemeProvider). CSS vars map sonner tokens to shadcn tokens (`--popover`, `--border`, `--radius`).
- `theme.ts` — single source of truth for theme: `useSyncExternalStore` reactive store (`mode` light|dark|auto, `resolved`) + `applyThemeMode`/`setThemeMode`/`syncThemeMode` (class `.light`/`.dark`, `data-theme`, `color-scheme`), `getServerSnapshot` provided for SSR.

**Rewritten:**
- `Header.tsx` — sticky top-0 z-40, `bg-background/80 backdrop-blur-md`, h-14 container; left: Sheet drawer trigger (mobile `md:hidden` Menu icon Button) + brand "Router-Core" link (`RouterIcon`); desktop inline `AppNav` (`hidden md:flex ml-6`); right: ThemeToggle + UserMenu.
- `Footer.tsx` — minimal muted bar: `border-t`, muted small text (© + "Router-Core control plane"), container; dropped island-kicker.
- `ThemeToggle.tsx` — shadcn `Button variant="ghost" size="icon"` (Sun/Moon by resolved theme) + DropdownMenu with Light / Dark / Auto (system) options + Check on active; persists localStorage `theme`, reactive store notifies Toaster.
- `__root.tsx` — keeps `THEME_INIT_SCRIPT`, HeadContent, Scripts, devtools; body drops `selection:bg-[rgba(...)]` lagoon tint; `TanStackQueryProvider > AppShell > children`; AppShell mounts Toaster.
- `apps/web/package.json` + `bun.lock` — added `sonner: ^2.0.8` to apps/web deps (registry sonner was only a packages/ui dep; apps/web must resolve it to mount the toaster). Lock diff is exactly this one workspace entry.

**Deleted:** `apps/web/src/integrations/better-auth/header-user.tsx` (superseded by `shell/UserMenu.tsx`; no remaining references).

Not touched: `components/dashboard/*`, styles.css legacy section (T6), routes for /devices /wifi /settings (later tasks — nav links render now; clicking them 404s mid-plan as expected).

## Verification

**tsc** (`tsc --noEmit -p apps/web/tsconfig.json`): 5 errors, all pre-existing in T5/T6-owned files (`routes/index.tsx` ×3, `components/dashboard/WANConnectionCard.tsx` ×2). Zero new errors in any touched file (baseline matched exactly). One fix along the way: `useSyncExternalStore` needed `getServerSnapshot` for SSR (TanStack Start) — resolved.

**eslint** (`bunx --bun eslint .` in apps/web): 26 problems (25 errors, 1 warning) — down from the 28 baseline because the deleted header-user.tsx carried 2; all remaining are pre-existing in `lib/api.ts`, `routes/index.tsx`, `integrations/tanstack-query/root-provider.tsx`, dashboard components (owned by T5/T6). All files created/touched in this task are eslint-clean.

**Browser (headless Chromium via harness, dev server `bun run dev` on :3000):**
- Home renders 200; SSR HTML + DOM contain sticky header, brand, nav labels (Dashboard/Devices/WiFi/Settings), footer, main.
- Desktop viewport (1280): hamburger hidden, inline nav visible; **active-nav highlight verified** — Dashboard link carries `bg-muted text-foreground` activeProps on `/`.
- Mobile viewport (390): hamburger visible, inline nav hidden (responsive switch works).
- **Theme toggle verified**: clicked Dark → `<html class="dark">`, `localStorage.theme = "dark"` (persistence + reactivity); dropdown menu functions.
- **Toaster present in DOM** (sonner's `<section aria-label="Notifications alt+T">` — sonner 2.x has no `[data-sonner-toaster]` attribute selector on the wrapper; confirmed mounted).
- User menu: signed-out "Sign in" ghost button present (session unauthenticated in this env); avatar menu markup verified in code + renders (avatar/skeleton states).

**Not fully verified (concern):** drawer *open/close interaction* could not be confirmed via automated clicks — every Puppeteer/JS click on the SheetTrigger (both viewports) threw "execution context destroyed" churn (HMR/devtools re-render race in the harness; the dashboard's failing API calls fire repeated ERR_CONNECTION_REFUSED network errors during the test window). The Sheet is registry-standard base-ui Dialog wiring (`SheetTrigger` + controlled `open`/`onOpenChange` + side="left" content with nav + theme toggle + close button), SSR renders the drawer contents, and tsc validates the composition — but actual click-to-open was not machine-verified. Recommend a manual click check on a running instance (T14 browser walk).

## Commit
`7c961c9` — `feat(web): app shell with app bar, nav drawer, toaster`
Staged list:
```
A apps/web/src/components/shell/AppNav.tsx
A apps/web/src/components/shell/AppShell.tsx
A apps/web/src/components/shell/Toaster.tsx
A apps/web/src/components/shell/UserMenu.tsx
A apps/web/src/components/shell/theme.ts
M apps/web/src/components/Header.tsx
M apps/web/src/components/Footer.tsx
M apps/web/src/components/ThemeToggle.tsx
M apps/web/src/components/shell (5 files above)
M apps/web/src/routes/__root.tsx
D apps/web/src/integrations/better-auth/header-user.tsx
M apps/web/package.json
M bun.lock
```
(`apps/web/package.json` + `bun.lock` included for the sonner dep; `.superpowers/` + `docs/superpowers/` ledger left untracked per standing Ruling.)

## Concerns
1. **Drawer open/close not browser-verified** — automated clicks on the SheetTrigger were defeated by harness context-destruction churn (see above); composition is registry-standard and tsc/SSR-clean, but a human click check is advised.
2. Nav links to `/devices`, `/wifi`, `/settings` 404 until later tasks add route files (expected mid-plan; `AppNav` types `to` as `string` because the route tree doesn't yet include them — becomes strictly typed once routes land, no change needed to AppNav then).
3. `sonner` added to `apps/web/package.json` (+bun.lock) — necessary for the web app to mount the toaster; flag if T13/T14 package pruning changes the workspace dep layout.
4. `header-user.tsx` deleted rather than restyled in place (brief paths listed it) — superseded by `shell/UserMenu.tsx` under the shell dir; commit includes the deletion explicitly.
