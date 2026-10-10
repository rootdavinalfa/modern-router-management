# Task 5 Report — query options + router context + setup dialog

## Status
DONE_WITH_CONCERNS

## What changed
Introduced the router state layer shared by later pages (T6/T9/T10/T11):

- **`apps/web/src/lib/query-options.ts`** (new): typed `queryOptions` per endpoint — `routersOptions`, `activeRouterOptions`, `systemStatusOptions(id)`, `wanStatusOptions(id)`, `ponStatusOptions(id)` (status: `refetchInterval 10_000`), `devicesOptions(id)` (15s). Query keys follow the global convention. **`wifiStatusOptions`/`fetchWifiStatus` intentionally OMITTED**: `WifiStatusDTO` does not exist in `packages/types` today (verified by grep — only `wifiBandSchema`/`wifiConfigSchema` exist; the DTO lands T7, endpoint T8), per the Main constraint "add only what compiles against today's types."
- **`apps/web/src/features/routers/router-store.tsx`** (new): `RouterProvider` + `useActiveRouter()` returning `{ routerId, setRouterId, routers, activeRouter, isLoading }`. Fetches via query options; selected id defaults to active router; persists to localStorage key `router-core:activeRouterId`. SSR-safe: localStorage read deferred to a mount effect so server + first client render agree. `setRouterId` writes localStorage + state.
- **`apps/web/src/features/routers/setup-router-dialog.tsx`** (new): shadcn `Dialog` + raw react-hook-form + `zodResolver(routerCreateSchema)` (form registry component absent per T2 carry-over) with registry Input/Label + own `<p class="text-destructive">` errors. Fields name/host/username/password + hidden driver `zte-f6600p`. Submit → `createRouter` mutation → sonner `toast.success('Router saved securely.')` / `toast.error(error.message)`; invalidates `['routers']` + `['router','active']`; closes on success. Props `{ open, onOpenChange }`. Form resets on open.
- **`apps/web/src/features/routers/index.ts`** (new): barrel.
- **`apps/web/src/routes/__root.tsx`** (modified): `RouterProvider` mounted inside `TanStackQueryProvider` wrapping the shell.
- **`apps/web/src/routes/index.tsx`** (modified): removed inline `RouterSetupForm` + `RouterSelector` + local `selectedRouterId`/`handleSelectRouter` + setup mutation/status; "Add router" Button (outline, lucide `PlusIcon`) opens `SetupRouterDialog`; `routerId` now from `useActiveRouter()`; sequential status queries now use `systemStatusOptions`/`wanStatusOptions`/`ponStatusOptions` (enabled-chaining preserved). Status sections untouched (T6 restyles). Removed now-dead `fetchRouterStatus` import and `uptimeSeconds` local (killed 2 pre-existing TS6133s).
- **Deleted**: `components/dashboard/RouterSetupForm.tsx`, `RouterSelector.tsx`, barrel entries removed from `components/dashboard/index.ts`. Zero source references remain (only stale `apps/web/dist/` build artifacts mention them; regenerate on next build).
- **`apps/web/package.json` + `bun.lock`**: `@hookform/resolvers` `^3.10.0` → `^5` (5.9.1). Required to satisfy acceptance "zod errors shown": resolver 3.x checks `Array.isArray(err.errors)` which zod v4 removed (renamed to `.issues`), so it rethrew raw ZodError and RHF never rendered validation messages — a pre-existing repo-wide latent bug that also silently disabled validation in the old RouterSetupForm. Resolver v5 formats zod-4 issues correctly. Verified by direct resolver harness + live browser.

## Verification

### tsc (`cd apps/web && bunx tsc --noEmit`)
- Before: 5 errors → After: **3 errors**. Removed 2 (TS6133 unused `fetchRouterStatus` + unused `uptimeSeconds` in routes/index.tsx). Remaining 3 all pre-existing and T6-owned: `WANConnectionCard.tsx` 2× TS2345, `routes/index.tsx(169)` partial-PON TS2740 (code preserved verbatim per brief). Zero errors added by this change.

### eslint (`cd apps/web && bunx eslint src`)
- Before: 24 problems → After: **15 problems**, all in 4 files this task did not touch (PONOpticalModule, WANConnections, root-provider, lib/api.ts — pre-existing debt owned by T6/T8). All files created/touched by this task lint clean (exit 0): `src/features/routers/*`, `src/lib/query-options.ts`, `src/routes/index.tsx`, `src/routes/__root.tsx`.

### prettier
`bunx prettier --check` on all touched/new files: clean.

### Browser evidence (dev server `bun run dev --port 3000`, headless Chromium; API down — `VITE_API_URL=http://localhost:3001` unreachable)
- Dashboard renders (title "Router-Core Dashboard", status cards present, no crash).
- **Dialog opens**: click "Add router" → `[data-slot="dialog-content"]` appears with title "Add router", labels Router name/Router IP/Username/Password, inputs prefilled (name "Home Router", host "192.168.1.1", username "admin", password empty), hidden driver `zte-f6600p`, Cancel + Save router buttons.
- **Validation (zod errors shown)**: clearing password (and name) then submitting shows destructive-red `<p>` errors "Too small: expected string to have >=1 characters" under the offending fields; dialog stays open. (Worked only after the resolver upgrade + dev-server dep-cache restart; before that RHF silently swallowed validation.)
- **Submit**: with valid values, POST fires to `http://localhost:3001/routers` with correct JSON `{"name":"Router Alpha","host":"192.168.50.1","driver":"zte-f6600p","username":"admin","password":"s3cret-pass"}`; sonner error toast "Failed to fetch" appears (API down — expected per brief); no crash; dialog remains open on failure (correct). Success path (toast + close) not observable without a live API; code path mirrors error path via mutation callbacks.
- **Cancel/close**: Cancel button closes the dialog (`data-open` → `data-closed`); reopening resets the form to defaults.
- **Active-router default + localStorage persistence**: with the API mocked via request interception, seeding `localStorage['router-core:activeRouterId'] = '2'` before load caused router-scoped queries to hit `/routers/2/system-status`; absent the seed, `routerId` defaults to `activeRouter.id`. Persistence read + application verified end-to-end.

## Commit
`c503e8b` — `feat(web): router query context and setup dialog`
Staged (explicit paths):
- `apps/web/src/lib/query-options.ts` (A)
- `apps/web/src/features/routers/index.ts` (A), `router-store.tsx` (A), `setup-router-dialog.tsx` (A)
- `apps/web/src/routes/__root.tsx` (M), `apps/web/src/routes/index.tsx` (M)
- `apps/web/src/components/dashboard/index.ts` (M), `RouterSetupForm.tsx` (D), `RouterSelector.tsx` (D)
- `apps/web/package.json` (M), `bun.lock` (M)

## Concerns
1. **`@hookform/resolvers` bumped 3.10.0 → 5.9.1** (web app + lockfile) — required so zod-4 validation errors actually render (acceptance criterion). This is a dependency change beyond the brief's file list; it fixes a latent pre-existing bug (validation silently no-oped in the old form too). Worth flagging in the T6 review. Old RouterSetupForm consumers are gone; only the new dialog + no other web code uses `@hookform/resolvers` (checked).
2. **`fetchWifiStatus`/`wifiStatusOptions` deferred** per the "compiles against today's types" constraint — T8/T9 must add `fetchWifiStatus` (api.ts) and `wifiStatusOptions` (query-options.ts) when `WifiStatusDTO` lands in T7, following the established pattern. Note: plan text said define it now; Main's explicit constraint took precedence (DTO absent).
3. **Feature location**: brief shorthand `features/router-store.tsx` vs plan's `features/routers/` + barrel. Used plan path (`features/routers/`) so T6+ imports (`useActiveRouter`, `SetupRouterDialog` from a feature barrel) resolve as the plan specifies.
4. **Router switching UI deferred**: `setRouterId` exists and persists to localStorage but no visible selector remains on the dashboard (old `RouterSelector` deleted per brief). T6 shows active router name; plan places selection in Settings/context. Dashboard "Add router" button is the only entry point until then.
5. **Success-path toast/close not browser-verified** (no live API). All wiring verified by code + mocked-fetch tests + error-path toast evidence; invalidate keys match query-options keys.
6. Old `RouterSetupForm` used a `status` inline message; new dialog uses sonner toasts per brief (Toaster mounted in T4 shell).
