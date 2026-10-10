# Task 9 Report — Connected Devices page (/devices)

## Status
DONE

## What changed

### 1. Devices feature under `apps/web/src/features/devices/`
- **`devices-page.tsx`** (default export `DevicesPage`) — router-scoped via `useActiveRouter()`; query via existing `devicesOptions(routerId)` (15s refetchInterval). State branches mirroring dashboard-page.tsx:
  - Store loading (routerId unknown) OR query pending → `<DevicesTableSkeleton />`
  - No active router (routerId null, store resolved) → centered empty-state card: muted `RouterIcon`, "No router selected", guidance "Select or add a router in Settings to see its connected devices.", CTA `Go to Settings` (anchor-styled Button, `/settings` route)
  - Query error → inline destructive card ("Devices unavailable" + message + `Try again` → `refetch()`), mirroring dashboard error card
  - Data → `<DevicesTable />`; refresh button triggers scoped `refetchQueries` on key `['router', id, 'devices']` (mirrors dashboard refresh pattern)
- **`devices-table.tsx`** — `DevicesTable` + `DevicesTableSkeleton`:
  - Card header: title "Connected Devices", count Badge (`{n} connected`), refresh icon-button (`RefreshCwIcon`, spins via `animate-spin` while `isFetching`)
  - Filter `Input` above table (name/IP/MAC, case-insensitive, trimmed); hidden when zero devices
  - `Table` (registry, 6 columns): Device (name + id small), IP address, MAC (mono span + copy icon-button via `navigator.clipboard.writeText` with transient CheckIcon/"Copied" state, 1.5s auto-revert, silent catch when clipboard unavailable), Type (Badge with icon: `WifiIcon` Wireless default-variant, `CableIcon` Wired secondary-variant), Signal (wireless only: `Progress` bar w-14 + `{n}%` label; wired: em dash `—`; clamps driver RSSI to 0–100), Connected (relative time: `just now`/`Xm ago`/`Xh ago`/`Xd ago`, absolute `toLocaleString()` hover title, ≥30d falls back to absolute)
  - Empty states: zero devices → row "No devices connected"; filter no-match → row "No devices match"
  - Skeleton mirrors loaded layout: header badge+button placeholders, filter bar, 5 skeleton rows of 6 cells
- **`index.ts`** — barrel: `DevicesPage`, `DevicesTable`, `DevicesTableSkeleton` (pattern matches dashboard barrel)

### 2. Route file
- **`apps/web/src/routes/devices.tsx`** — `createFileRoute('/devices')({ component: DevicesPage })` importing feature barrel (4 lines, mirrors routes/index.tsx). AppNav `/devices` link (T4) now resolves; active state verified.
- **`apps/web/src/routeTree.gen.ts`** — regenerated via the router-generator API (dev server idle at commit time; no committed mock/fetch override in api.ts/query files). Diff purely additive: `/devices` route registration + preserved react-start footer (footer byte-identical to prior committed form).

### 3. Bug fix (in-scope, out-of-tree)
- **`packages/ui/src/components/table.tsx`** — the registry `Table` wrapper carries `className="... overflow-x-auto"`, but Tailwind v4 in this repo does not compile `.overflow-x-auto` (utility absent from the scanned sources since the class only appears inside `packages/ui`, which is outside Tailwind's source detection). Computed style was `visible`, so a wide table overflowed the viewport horizontally (document-level scroll at narrow widths) instead of scrolling inside its container. Fix: inline `style={{ overflowX: "auto" }}` on the `[data-slot=table-container]` div. Single-line, behavior-preserving on desktop; enables the brief's required "mobile no-overflow (table inside overflow-x-auto container)". (Alternatives — adding `@source` scanning for packages/ui or a Tailwind v4 `@utility` — were larger and cross-cutting; flag for reviewer.)

## Verification

### Static gates (cd apps/web)
- `bunx tsc --noEmit` → **0 errors** (exit 0)
- `bunx eslint .` → **0 problems** (exit 0)
- `bunx prettier --check` on touched files (features/devices/*, routes/devices.tsx, routeTree.gen.ts, packages/ui/src/components/table.tsx) → **All matched files use Prettier code style!**

### Browser evidence (dev server on :3000, headless Chromium, API via request interception on :3001 — CORS + OPTIONS handled; localStorage `router-core:activeRouterId` set/cleared; no committed test mocks)
- **Loading**: skeleton observed at ~100ms post-reload (skeleton cells + badge/refresh placeholders), replaced by table once devices resolved
- **Data** (4 mocked devices: 2 wireless w/ signal, 1 wired, 1 wireless no signal): header "CONNECTED DEVICES | 4 CONNECTED"; rows show name + small id (`dev-1`), IP, mono MAC (`ui-monospace, SFMono-Regular, …` computed), Type badges with icons (WIRELESS→WifiIcon, WIRED→CableIcon)
- **Signal semantics**: wireless w/ signal → `Progress` bar (`aria-label="Signal 78 percent"`) + `78%`; wireless w/o signal → `—`; wired → `—` (no progress). Echo Dot (wireless, no signalStrength) correctly shows em dash
- **Connected times**: "1m ago / 2h ago / 3d ago / 25d ago" relative strings render per connectedAt
- **Filter**: by name `iphone`→1 row (iPhone); by IP `192.168.1.8`→1 row (Living Room TV); by MAC fragment `44:65:7D`→1 row (Echo Dot); garbage → "No devices match"; cleared → all 4 rows. Case-insensitive confirmed (`iphone` lowercase matched "iPhone")
- **Copy MAC**: click → aria-label flips to "MAC copied", title "Copied", CheckIcon shown; reverts to "Copy MAC address …" after ~1.5s
- **Refresh**: refresh icon-button click → devices request count incremented (1→2) proving scoped refetch
- **Error state**: devices endpoint 500 → after retry exhaustion (~7s), destructive card "DEVICES UNAVAILABLE / boom / TRY AGAIN"; clicking Try again with the endpoint healed → table recovered (data re-rendered)
- **Empty state (zero devices)**: badge "0 CONNECTED", filter input hidden, table row "No devices connected"
- **No-router empty state**: cleared localStorage + empty routers → "NO ROUTER SELECTED / Select or add a router in Settings to see its connected devices." + "Go to Settings" button; nav link "Devices" carries `aria-current="page"` (active) on `/devices`
- **Mobile**: 390px and 320px viewports — `document.scrollWidth` == viewport (no page-level horizontal overflow); table container `overflow-x: auto`; all rows/MACs render. At 280px the internal container scrolls (`scrollWidth > clientWidth`) while the document stays clean — confirming the table-overflow fix
- **Dark mode**: `theme=dark` → `<html class="dark">`, `color-scheme: dark`, body bg `oklch(0.148 0.004 228.8)` (dark token), content legible
- Screenshots not captured (headless screenshot infra times out in this environment); all claims verified via DOM text/aria/computed-style inspection per prior task convention

## Commit
`3b99a86` — `feat(web): connected devices page` (6 files, +456/−3)

Staged (explicit paths):
- `apps/web/src/features/devices/devices-page.tsx` (A)
- `apps/web/src/features/devices/devices-table.tsx` (A)
- `apps/web/src/features/devices/index.ts` (A)
- `apps/web/src/routes/devices.tsx` (A)
- `apps/web/src/routeTree.gen.ts` (M — /devices registration; regenerated, footer preserved)
- `packages/ui/src/components/table.tsx` (M — inline overflow-x fix)

Not staged: `.superpowers/`, `docs/superpowers/` (plan ledgers, consistent with prior tasks); nothing else dirty.

## Concerns
1. **`packages/ui/src/components/table.tsx` modified beyond the brief's literal file list** — required for the brief's mobile acceptance ("table inside overflow-x-auto container"): the registry's `overflow-x-auto` class is not compiled by this repo's Tailwind v4 setup (class string lives only in packages/ui, outside source scanning), leaving table overflow uncontained at narrow widths. Inline style is the minimal fix; root-correct alternatives (add `@source` for packages/ui, or Tailwind `@utility`) are cross-cutting and deferred.
2. **routeTree.gen.ts regenerated manually** via the `@tanstack/router-generator` API (needed so `/devices` type-checks and the nav link resolves without booting the dev watcher); footer block reproduced byte-identical to the committed convention. Regeneration when the dev server next runs should be a no-op.
3. Copy button falls back silently when `navigator.clipboard` is unavailable (insecure context) — text remains selectable; acceptable per brief ("keep simple").
4. Browser screenshots not captured (infra timeout); DOM/aria/computed-style inspection used instead, per task-6 convention.

---

## Review fix round 1 (commit 1f9919c)

**Finding (Important, systemic):** Tailwind v4 automatic source detection does NOT scan `packages/ui/src/**/*.tsx`. The registry components' utility classes (`bg-primary`, `bg-card`, `shadow-sm`, `h-12`, `px-3`, `uppercase`, `whitespace-nowrap`, `animate-pulse`, `hover:bg-muted/50`, `text-card-foreground`, …) were absent from the compiled CSS, leaving registry surfaces unstyled (transparent default buttons, bare cards, non-uppercase table headers, empty progress bars, non-pulsing skeletons, non-spinning refresh icon). The Task-9 inline `overflow-x-auto` workaround in `table.tsx` treated one symptom of this systemic gap.

**Fix (config-level, root cause):**
1. `apps/web/src/styles.css` — added Tailwind v4 `@source "../../../packages/ui/src";` (correct relative path from `apps/web/src/styles.css`; scans the shared registry tree for utilities).
2. `packages/ui/src/components/table.tsx` — removed the now-redundant inline `style={{ overflowX: "auto" }}`; the className `overflow-x-auto` now compiles.

**Verification:**
- Production build (`cd apps/web && bunx vite build`): compiled `dist/client/assets/styles-*.css` now contains `bg-primary`, `bg-card`, `shadow-sm`, `h-12`, `px-3`, `uppercase`, `whitespace-nowrap`, `animate-pulse`, `text-card-foreground`, `overflow-x-auto`, and `hover:bg-muted/50` (escaped `hover\:bg-muted\/50`) — all previously zero.
- Browser (dev server :3000, intercepted API, both themes):
  - **Default Button fill** (no-router empty state "Go to Settings" anchor): `background-color: oklch(0.443 0.11 240.79)` (primary), foreground `oklch(0.977 0.013 236.62)` — visible fill; text-transform uppercase
  - **Card surface**: bg token + visible ring/shadow (`rgba(0,0,0,0) 0px …` ring present)
  - **Table header**: `text-transform: uppercase`, padding `0 12px`, height 48px
  - **Progress fill**: track `oklch(0.275 …)` + indicator 43.7px wide with primary bg
  - **Skeleton pulses**: `animation-name: pulse`, 2s (verified during a 3s-delayed fetch)
  - **Refresh spinner spins**: svg `animation-name: spin` + `animate-spin` class
  - **Container overflow**: computed `overflow-x: auto` from className alone (workaround removed, still effective)
  - **Dark theme**: card/button/progress all use dark tokens; content legible
- Gates: `bunx tsc --noEmit` 0 errors, `bunx eslint .` 0 problems, prettier clean on `styles.css` + `table.tsx` + `routeTree.gen.ts`.

**Commit:** `1f9919c` — `fix(web): tailwind source scan for ui registry classes` (2 files, +5/−1)

**Concerns:** None new. `@source` path is relative to `apps/web/src/styles.css` (`../../../packages/ui/src`) — matches repo layout; future packages/ui additions are scanned automatically. Root `prettier.config.js` still not a valid module (pre-existing T2 carry-over, out of scope).
