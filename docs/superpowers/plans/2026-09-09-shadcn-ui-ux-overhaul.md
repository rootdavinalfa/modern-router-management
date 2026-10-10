# UI/UX Overhaul to shadcn/ui Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Router-Core frontend on latest shadcn/ui + Tailwind CSS v4 using preset `b2dwXaSzv0` (style `sera`, mist/sky theme), with an app-bar + responsive navigation-drawer shell, full Dashboard / Devices / WiFi / Router-setup pages with loading, error, empty, and toast states — and complete the ZTE F6600P driver so WiFi read/apply and reboot genuinely work.

**Architecture:** Wire shadcn into `apps/web` via `npx shadcn@latest init --preset b2dwXaSzv0` with `-c apps/web`, generating registry components under `apps/web/src/components/ui` and shadcn-style theme tokens in `apps/web/src/styles.css` (replacing the custom sea/lagoon palette). Build page components locally under `apps/web/src/features/*`, add new file routes for Devices/WiFi/Settings, and compose a shared shell (app bar, navigation rail/drawer) in the `__root.tsx` layout. The executor MUST verify in Task 1 whether the shadcn CLI supports a `--workspace`/monorepo install into `packages/ui`; if unsupported or unclear, keep ALL generated components under `apps/web/src/components/ui` (registry default) and make `apps/web` the only consumer of shadcn, while `packages/ui` keeps re-exporting any custom primitives other workspaces need (final disposition in Task 13). Extend the ZTE driver with real Playwright navigation for WiFi config read/apply and reboot; add `getWifiStatus` to the driver interface and a new `GET /routers/:id/wifi-status` endpoint in NestJS so the WiFi page can render current state. Uses TanStack Query v5 for data, React Hook Form + Zod for the WiFi form.

**Tech Stack:** TanStack Start (React 19), TanStack Router + Query v5, Tailwind CSS v4, latest shadcn/ui preset `b2dwXaSzv0`, Radix primitives (via registry components), `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` (already present), react-hook-form, Zod, better-auth, NestJS, Drizzle, Playwright.

**Spec:** Conversation-approved design (2026-09-09) — shadcn preset `b2dwXaSzv0` is the design direction (NOT Material; MD3 not layered); full product overhaul: shell + Dashboard/Devices/WiFi/Router-setup pages; app bar + responsive nav drawer; driver features (WiFi read/apply, reboot) completed for real; state/loading/error/empty + toasts throughout.

## Global Constraints

- `preset b2dwXaSzv0` decode: style `sera`, baseColor `mist`, theme `sky`, chartColor `pink`, iconLibrary `lucide`, font `raleway`, fontHeading `public-sans`, radius `default`, menuAccent `subtle`, menuColor `default-translucent`. Use EXACTLY these (commit decoded preset config; do NOT re-theme).
- NOT Material: do not introduce Material Design 3 tokens, elevation/state-layer vocabulary, or MUI anywhere. (User decision.)
- Every task MUST run: `cd apps/web && bunx tsc --noEmit`, `bunx eslint .`, and `bunx prettier --check .`; fix all failures before committing. No project-wide suites otherwise.
- All UI is in `apps/web`; shared/consumable primitives that other workspaces import from `@modern-router-management/ui` stay exported there.
- Type safety: shared DTO types imported from `@modern-router-management/types/router` only; never duplicate DTO types in the web app.
- TanStack Query keys per endpoint: `['routers']`, `['router','active']`, `['router',id,'system-status']`, `['router',id,'wan-status']`, `['router',id,'pon-status']`, `['router',id,'devices']`, `['router',id,'wifi-status']`. Invalidate by prefix when a mutation affects a router.
- Light/dark support required; theme toggle persists to localStorage (follow existing pattern in `ThemeToggle.tsx`).
- Delete obsolete custom-styled components when replaced (no dead files).
- Do not touch `packages/types` shape for existing DTOs (additive schema additions allowed in Task 7 with `zod` only if the driver genuinely returns them).

---

### Task 1: Bootstrap shadcn/ui into the web app with preset b2dwXaSzv0

**Files:**
- Modify: `apps/web/package.json` (deps added by CLI)
- Create: `apps/web/components.json`, `apps/web/src/lib/utils.ts` (registry default), `apps/web/src/components/ui/*` (from init)
- Modify: `apps/web/src/styles.css` (theme reset; replace custom palette)
- Delete (after component migration, later tasks): nothing yet

**Interfaces:**
- Consumes: existing Tailwind v4 + `@/*` alias configured in `vite.config.ts`/`tsconfig.json`
- Produces: `@/components/ui/*` registry components; `@/lib/utils` exporting `cn()`; shadcn theme tokens in `styles.css`; `components.json`

- [ ] **Step 1: Verify current baseline**

```bash
cd apps/web
bunx tsc --noEmit && bunx eslint . && bunx prettier --check .
```

Expected: current code passes (prettier may report pre-existing formatting; if so run `bunx prettier --write .` first and commit the formatting-only diff separately).

- [ ] **Step 2: Run shadcn init with the preset**

```bash
npx shadcn@latest init --preset b2dwXaSzv0 -c apps/web
```

Use flags to answer prompts: `--base color`, `--yes`/accept defaults where offered. If the CLI prompts for monorepo/workspace handling and offers `--workspace` for `packages/ui`, STOP and verify what the workspace layout means (it would place components in `packages/ui/src/components/ui` with an alias; if that path works for the web app, accept it — but the web app MUST be able to import `@modern-router-management/ui` components and the shared package must still build). Preferred fallback if anything is unclear: accept registry defaults under `apps/web/src/components/ui` (do NOT use `--workspace`) so components land in the app that consumes them. `components.json` is created at `apps/web/components.json`; alias `@/*` → `./src/*` (already in tsconfig).

- [ ] **Step 3: Confirm the generated files**

```bash
cd apps/web
cat components.json
ls src/components/ui | head
ls src/lib/utils.ts
```

Expected: `components.json` lists the preset values (style sera, mist/sky, fonts, radius default, lucide icons); `src/components/ui` contains at least the base components from init; `src/lib/utils.ts` exports `cn`.

- [ ] **Step 4: Verify types/lint/build**

```bash
cd apps/web
bunx tsc --noEmit
bunx eslint .
bunx prettier --check .
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json apps/web/components.json apps/web/src/styles.css apps/web/src/lib/utils.ts apps/web/src/components/ui apps/web/src/lib
git commit -m "feat(web): bootstrap shadcn/ui with preset b2dwXaSzv0"
```

---

### Task 2: Add required registry components

**Files:**
- Create: `apps/web/src/components/ui/*` via CLI
- Modify: `apps/web/src/styles.css` (any registry-added tokens)

**Interfaces:**
- Consumes: Task 1 shadcn setup
- Produces: components used by later tasks (exact export names per registry — check each file after adding): `Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter` (card), `Button` with `asChild` + variants, `Badge`, `Input`, `Label`, `Table, TableHeader, TableBody, TableRow, TableHead, TableCell`, `Sheet` (+ trigger/content/side), `Dialog` (+ content/header/title/description/footer/close), `AlertDialog`, `DropdownMenu` (+ trigger/content/item/separator), `Skeleton`, `Select` (+ trigger/value/content/item), `Switch`, `Tabs`, `Separator`, `Progress`, `Tooltip`, `Avatar`, `ScrollArea`, `Sonner` (toaster) or `Toaster` per registry, `AppSidebar` + `Sidebar` family if registry provides (else build in Task 3 from primitives), `Breadcrumb`.

- [ ] **Step 1: Add the component batch**

```bash
cd apps/web
npx shadcn@latest add card button badge input label table sheet dialog alert-dialog dropdown-menu skeleton select switch tabs separator progress tooltip avatar scroll-area sonner sidebar breadcrumb -c apps/web
```

If any name is rejected by the registry (e.g. `sidebar` moved/renamed), note the correct name and add it; never hand-implement a registry component unless the CLI errors persistently — then copy the canonical source from the shadcn registry with the same alias/layout.

- [ ] **Step 2: Verify each component file exists with exports**

```bash
cd apps/web
ls src/components/ui
```

Expected: a `.tsx` file per component and `index.ts` barrel if generated.

- [ ] **Step 3: Check `cn` helper and dependencies**

```bash
cat src/lib/utils.ts
```

Expected: `clsx` + `tailwind-merge` composed into `cn`. (If the init produced a different composition — e.g. new `cn` package — keep whatever the CLI generated; do not hand-write.)

- [ ] **Step 4: Verify**

```bash
cd apps/web
bunx tsc --noEmit
bunx eslint .
bunx prettier --check .
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui apps/web/src/styles.css apps/web/package.json
git commit -m "feat(web): add shadcn registry components"
```

---

### Task 3: Theme, tokens, and font system (styles.css + fonts)

**Files:**
- Modify: `apps/web/src/styles.css` (full theme reset per preset)
- Modify: `apps/web/src/routes/__root.tsx` (head links: font stylesheet)

**Interfaces:**
- Consumes: preset config; existing `data-theme` light/dark mechanism in `__root.tsx`
- Produces: `--background/--foreground/--card/--popover/--primary/--secondary/--muted/--accent/--destructive/--border/--input/--ring/--chart-*` tokens + radius/fonts per preset, applied on `:root` and `.dark`; `font-sans` = raleway, heading font = public-sans (per registry classes)

- [ ] **Step 1: Read the init-generated `styles.css` fully**

```bash
cd apps/web
cat src/styles.css
```

Keep whatever the preset init already wrote for tokens (it may already be complete). Identify leftover custom CSS to remove: the entire sea/lagoon custom palette block (`:root`, `:root[data-theme=dark]`, `@media (prefers-color-scheme: dark)`), `.island-shell`, `.feature-card`, `.island-kicker`, `.nav-link`, `.site-footer`, `.display-title`, `.rise-in`, `body` gradient layers, `body::before`/`body::after`, Fraunces/Manrope font import, `@plugin "@tailwindcss/typography"` (keep only if prose styles remain used — they are not: no MDX content pages exist).

- [ ] **Step 2: Replace custom CSS with the preset token system**

Rewrite `styles.css` to the shadcn v4 structure the init generated, preserving: the Google Fonts import for `Raleway` (sans) and `Public Sans` (heading) with the weights the preset uses (check `components.json`/generated CSS for exact family+weights), `@import "tailwindcss";`, `@theme inline` mapping `--font-sans`, `--font-heading`, radius token, and all `--color-*`/`--*` CSS variables. Ensure `.dark` variant tokens exist (class-based dark mode; verify how init configured dark mode — via `@custom-variant dark` if needed) and that the `THEME_INIT_SCRIPT` in `__root.tsx` still resolves to a valid `light`/`dark` class on `<html>`.

- [ ] **Step 3: Verify the theme visually on both modes**

```bash
cd apps/web && bun run dev
```

Open http://localhost:3000 in a browser; toggle the theme; confirm background/card/text/primary colors all switch and no leftover sea/lagoon colors remain. Confirm fonts load (Raleway/Public Sans).

- [ ] **Step 4: Verify + commit**

```bash
cd apps/web
bunx tsc --noEmit && bunx eslint . && bunx prettier --check .
git add apps/web/src/styles.css apps/web/src/routes/__root.tsx
git commit -m "feat(web): adopt preset b2dwXaSzv0 theme tokens and fonts"
```

---

### Task 4: App shell — app bar, navigation drawer/rail, footer

**Files:**
- Modify: `apps/web/src/components/Header.tsx` → rewrite as MD-less shadcn AppBar/`SidebarTrigger` top bar using `Sheet`/`Sidebar` components
- Modify: `apps/web/src/components/Footer.tsx`
- Modify: `apps/web/src/components/ThemeToggle.tsx` (restyle to shadcn `Button` variant ghost + `DropdownMenu`)
- Modify: `apps/web/src/routes/__root.tsx` (layout composition: shell around `{children}`)
- Create: `apps/web/src/components/shell/AppShell.tsx`, `apps/web/src/components/shell/SidebarNav.tsx` (if not covered by registry `Sidebar`)
- Delete: none (Header/Footer keep names/export shape so routes import them)

**Interfaces:**
- Consumes: Task 2 components (`Sidebar`, `Sheet`, `Button`, `DropdownMenu`, `Avatar`)
- Produces:
  - `AppShell` layout: app bar with hamburger `SidebarTrigger` (opens drawer on mobile, rail on desktop), brand "Router-Core" link → `/`, router selector (compact, reused from Task 5), theme toggle, user avatar/sign-out (from `header-user.tsx`), `Sonner` toaster mount.
  - Nav destinations: Dashboard (`/`), Devices (`/devices`), WiFi (`/wifi`), Settings (`/settings`); active state via `NavLink`/`activeProps`.
  - Footer: minimal muted bar inside shell.
  - Mobile: navigation drawer overlays; desktop: rail or persistent drawer (registry `Sidebar` default).

- [ ] **Step 1: Rewrite Header as app bar (brand + trigger + actions)**

Use shadcn `Button` (icon/ghost), `SidebarTrigger`, brand `Link to="/"`, avatar/user area. Keep `BetterAuthHeader` behavior (session avatar, sign-out) but restyle with registry `Avatar`/`DropdownMenu`; import `authClient` from `#/lib/auth-client`.

- [ ] **Step 2: Build SidebarNav**

If registry `Sidebar` components generated, compose `SidebarProvider/Sidebar/SidebarContent/SidebarGroup/SidebarMenu/SidebarMenuItem/SidebarMenuButton` with `NavLink`s for the four destinations + lucide icons (`LayoutDashboard`, `Wifi`, `Settings`, `Router`). Wrap the app in `SidebarProvider` inside `AppShell`.

- [ ] **Step 3: Compose AppShell + Footer**

`AppShell` renders `SidebarProvider > (Sidebar + header + <main className="container mx-auto p-4 md:p-6">{children}</main> + Footer + <Sonner/>)`. Footer: muted, small, copyright only.

- [ ] **Step 4: Rewire `__root.tsx`**

Root layout renders `<AppShell>{children}</AppShell>` inside `TanStackQueryProvider`. Keep devtools, `THEME_INIT_SCRIPT`, head content.

- [ ] **Step 5: Verify routing skeleton compiles**

Temporarily point all four nav links at the existing `/` route file (they 404 until Tasks 8–10 add files — acceptable mid-plan). Run the app; check: drawer opens/closes on mobile width, rail shows on desktop, active link highlighted, theme toggle + user menu work.

- [ ] **Step 6: Verify + commit**

```bash
cd apps/web
bunx tsc --noEmit && bunx eslint . && bunx prettier --check .
git add apps/web/src/components apps/web/src/routes/__root.tsx
git commit -m "feat(web): app shell with app bar, sidebar drawer, footer"
```

---

### Task 5: Query utilities + router-aware provider + setup dialog

**Files:**
- Modify: `apps/web/src/lib/api.ts` (extend with delete/device/wifi helpers; keep existing functions)
- Create: `apps/web/src/lib/query-options.ts` (typed `queryOptions` per endpoint)
- Create: `apps/web/src/features/routers/router-store.tsx` (context: active router id, setter; persists selection to `localStorage`)
- Create: `apps/web/src/features/routers/setup-router-dialog.tsx` (dialog + RHF form from existing `RouterSetupForm` content)
- Modify: `apps/web/src/features/routers/index.ts` (exports)
- Delete: `apps/web/src/components/dashboard/RouterSetupForm.tsx`, `apps/web/src/components/dashboard/RouterSelector.tsx` (after migrating consumers)

**Interfaces:**
- Consumes: `@modern-router-management/types/router` DTOs; existing `request` helper in `api.ts`
- Produces:
  - `fetchDeleteRouter(id) → DELETE /routers/:id` (Task 11 backend)
  - `fetchRouterDevices`, `updateWifi`, `rebootRouter`, `fetchWifiStatus` (wifi-status added Task 8 backend)
  - `queryOptions` objects keyed per Global Constraints
  - `RouterProvider` (context + `useActiveRouter()`) with `{ routerId, setRouterId, routers, isLoading }`
  - `SetupRouterDialog` props `{ open, onOpenChange }`; internally `useMutation(createRouter)` + `sonner.toast`

- [ ] **Step 1: Extend `api.ts` with new typed helpers** (`fetchRouterDevices`, `updateWifi`, `rebootRouter`, `fetchWifiStatus`, `fetchDeleteRouter`) following existing `request<T>` pattern.

- [ ] **Step 2: Create `query-options.ts`** with `queryOptions({ queryKey, queryFn, ... })` per endpoint; export consts (`routersOptions`, `activeRouterOptions`, `systemStatusOptions(id)`, etc.) with `refetchInterval: 10_000` for status, `enabled` chaining preserved.

- [ ] **Step 3: Create router-store context**

`RouterProvider` fetches routers + active router (using query options), defaults selection to active, stores on change. `useActiveRouter()` throws outside provider.

- [ ] **Step 4: Create SetupRouterDialog**

Port `RouterSetupForm` form logic (RHF + `routerCreateSchema`) into a `Dialog`; submit via mutation; `sonner.toast.success('Router saved securely.')` / error; invalidate `['routers']`; close on success. Server errors parsed from the `Error` message.

- [ ] **Step 5: Migrate dashboard to context + dialog (keep visual churn minimal this task)**

Dashboard reads `useActiveRouter()`; remove inline `RouterSetupForm`/`RouterSelector`; add a "Add router" `Button` opening the dialog; keep status cards/sections as-is (restyled in Task 6).

- [ ] **Step 6: Delete obsolete files** (`RouterSetupForm.tsx`, `RouterSelector.tsx`) after no importers remain (`grep -rn "RouterSetupForm\|RouterSelector" apps/web/src` → none).

- [ ] **Step 7: Verify + commit**

```bash
cd apps/web
bunx tsc --noEmit && bunx eslint . && bunx prettier --check .
git add apps/web/src/lib apps/web/src/features apps/web/src/routes/index.tsx apps/web/src/components
git commit -m "feat(web): router context, query options, setup dialog"
```

---

### Task 6: Dashboard rebuild on shadcn components

**Files:**
- Create: `apps/web/src/features/dashboard/dashboard-page.tsx` (page composition)
- Create: `apps/web/src/features/dashboard/status-cards.tsx`, `optical-module.tsx`, `wan-connections.tsx`, `system-info.tsx`, `metrics.tsx`, `index.ts` (exports) — split by responsibility
- Modify: `apps/web/src/routes/index.tsx` (thin route file delegating to feature)
- Delete: `apps/web/src/components/dashboard/*` (DashboardHeader, StatusCard, PONOpticalModule, WANConnectionCard, WANConnections, SubmitInternetButton) after no importers

**Interfaces:**
- Consumes: Task 5 query options + RouterProvider; registry components
- Produces: composed dashboard route render
- Layout targets: header row with model/status badge; metric cards row; PON section with per-metric cards + signal progress; WAN connections detail; reboot/refresh actions

- [ ] **Step 1: Build query composition in dashboard-page**

Compose `systemStatusQuery`/`wanStatusQuery`/`ponStatusQuery` with chainable `enabled` (as today); loading → `Skeleton` cards; error → `Alert`/empty state with retry (`refetch`); no router → empty state CTA "Add your first router".

- [ ] **Step 2: Status header + cards**

`Card`/`Badge`/`Skeleton`; online/offline badge with semantic color; status metrics from system status (firmware/uptime/WAN IP/CPU/memory from SystemStatusDTO fields).

- [ ] **Step 3: PON + WAN sections**

Per-metric cards, `Progress` bar for optical signal (map `rxPower` −8..−28 dBm → 0..100), ONU state badge; WAN connection details as cards or `Table` per connection type; IPv4/IPv6 details, private/public badge.

- [ ] **Step 4: Route file rewrite**

`index.tsx` keeps `createFileRoute('/')` + component → imports `DashboardPage` from feature; remove heavy logic from route file.

- [ ] **Step 5: Delete old dashboard components** (all seven from `components/dashboard/`) once nothing imports them.

- [ ] **Step 6: Verify**

Run the app with a live router + with none (empty state), both themes, mobile width. Confirm no leftover `.island-*` classes and every old custom class gone (`grep -rn "island-shell\|feature-card\|island-kicker\|rise-in\|sea-ink\|lagoon\|palm\|display-title" apps/web/src` → only allowed if a registry component legitimately uses a token — should be none).

- [ ] **Step 7: Verify + commit**

```bash
cd apps/web
bunx tsc --noEmit && bunx eslint . && bunx prettier --check .
git add apps/web/src/features/dashboard apps/web/src/routes/index.tsx apps/web/src/components
git commit -m "feat(web): rebuild dashboard on shadcn components"
```

---

### Task 7: Driver — WiFi status read + real update

**Files:**
- Modify: `packages/drivers/src/base-driver.ts` (interface)
- Modify: `packages/drivers/src/zte-f6600p.ts` (implementations)
- Modify: `packages/types/src/router.ts` (schemas/types, additive)
- Modify: `packages/drivers/src/index.ts` (re-export additions if any)

**Interfaces:**
- Consumes: Playwright already in the driver package; existing auth/session pattern (`getPage`, `makeAuthenticatedRequest`)
- Produces:
  - `WifiStatusDTO` from `@modern-router-management/types/router`:
    ```ts
    export const wifiStatusSchema = z.object({
      bands: z.array(z.object({
        band: wifiBandSchema,
        enabled: z.boolean(),
        ssid: z.string(),
        password: z.string().optional(),      // masked unless needed
        channel: z.number().int().min(1).max(165).optional(),
        mode: z.string().optional(),
        security: z.string().optional(),
      })),
    });
    export type WifiStatusDTO = z.infer<typeof wifiStatusSchema>;
    ```
  - `interface RouterDriver { ...; getWifiStatus(): Promise<WifiStatusDTO>; updateWifiSettings(config: WifiConfigDTO): Promise<void>; }`
  - `ZteF6600pDriver.getWifiStatus()` real implementation; `updateWifiSettings()` real apply.

- [ ] **Step 1: Write the failing unit tests for parsing**

Create `packages/drivers/test/zte-wifi.test.ts` with representative HTML/XML fixtures of the ZTE F6600P WiFi pages (use `_type=menuView&_tag=wlBasic`-style responses captured in the project if available; otherwise construct minimal realistic markup for both 2.4G and 5G sections). Tests: parse enabled/ssid/channel/security per band; update path navigates and applies and waits for apply completion. Run and confirm they FAIL (no implementation).

- [ ] **Step 2: Add types to packages/types**

Add `wifiStatusSchema`/`WifiStatusDTO` (as above) and export from `packages/types/src/index.ts` barrel (`router.ts` already exports router schemas; ensure index re-exports).

- [ ] **Step 3: Implement driver getWifiStatus**

Follow the existing ZTE pattern: authenticated request to `.../?_type=menuData&_tag=...wifi/wlBasic...` pages; parse the 2.4G and 5G sections (SSID, enable, channel, security/mode); return per-band status. Only include fields the router response genuinely provides; if a field is unavailable, omit it (schema optional). Use `page.evaluate` or XML parsing consistent with the existing parse helpers.

- [ ] **Step 4: Implement driver updateWifiSettings**

Real implementation: navigate to WiFi settings page, fill SSID/security/password/channel fields for the requested band, click Apply, wait for completion (`networkidle` + selector/timeout, mirroring `submitInternet`). Validate inputs against `wifiConfigSchema` before acting.

- [ ] **Step 5: Update interface + run tests**

Add `getWifiStatus` to `RouterDriver` in `base-driver.ts`; ensure `ZteF6600pDriver` satisfies it. Run the new tests — all pass.

- [ ] **Step 6: Build packages**

```bash
cd packages/types && bun run build
cd packages/drivers && bun run build
```

- [ ] **Step 7: Verify + commit**

```bash
cd packages/types && bunx tsc --noEmit
cd packages/drivers && bunx tsc --noEmit
git add packages/types/src packages/drivers/src packages/drivers/test
git commit -m "feat(drivers): read and apply ZTE WiFi settings"
```

---

### Task 8: API — wifi-status endpoint + delete router + tests

**Files:**
- Modify: `apps/api/src/routers/routers.controller.ts`
- Modify: `apps/api/src/routers/routers.service.ts`
- Create: `apps/api/test` or extend existing spec: `apps/api/src/routers/routers.controller.spec.ts` (match repo test conventions)
- Modify: `apps/api/src/db/schema.ts` (only if delete needs cascade — verify current FK config; prefer explicit delete of credentials then router)

**Interfaces:**
- Consumes: driver `getWifiStatus`, `updateWifiSettings`, `reboot` (Task 7); existing `withDriver`
- Produces:
  - `GET /routers/:id/wifi-status` → `WifiStatusDTO`
  - `DELETE /routers/:id` → 200/204; removes credentials row + router row; closes cached driver
  - Tests cover: controller mapping, service delete removes credentials + closes driver + 404 on missing; wifi-status returns driver result.

- [ ] **Step 1: Write failing API tests**

Controller/service spec asserting: `DELETE` calls service and removes both rows; `GET :id/wifi-status` returns `WifiStatusDTO` shape; unknown router → 404. Run → FAIL.

- [ ] **Step 2: Implement service methods**

`getWifiStatus(id)` → `withDriver(id, d => d.getWifiStatus())`; `deleteRouter(id)`: find router (404 if none), delete credentials rows for routerId, close + remove cached driver, delete router row, return `{ ok: true }`.

- [ ] **Step 3: Implement controller routes**

`@Delete(':id') async deleteRouter(@Param('id', ParseIntPipe) id: number)` and `@Get(':id/wifi-status') async getWifiStatus(...)`. Wire imports.

- [ ] **Step 4: Run tests + build**

```bash
cd apps/api && bun run test   # or bunx vitest run per repo convention
bunx tsc --noEmit
bun run build
```

- [ ] **Step 5: Verify + commit**

```bash
git add apps/api/src/routers apps/api/test
git commit -m "feat(api): wifi-status endpoint and router delete"
```

---

### Task 9: Devices page

**Files:**
- Create: `apps/web/src/features/devices/devices-page.tsx`, `devices-table.tsx`, `index.ts`
- Create: `apps/web/src/routes/devices.tsx`

**Interfaces:**
- Consumes: `fetchRouterDevices`/query option; registry `Table`, `Card`, `Badge`, `Skeleton`, `Input` (client-side filter), `DropdownMenu`
- Produces: `/devices` route; table columns: device name, IP, MAC, connection type (wired/wireless badge), signal strength (with `Progress` or icon when wireless), connected-at; row count summary; loading skeletons; error/retry; empty state ("No devices connected"); filter box; router-scoped via `useActiveRouter()`; refetch interval 15s (devices change slower than status); refresh button.

- [ ] **Step 1: Feature files**

Implement page: no router → empty CTA; query → table; filter state (client-side, case-insensitive on name/IP/MAC); wireless signal shown only when `connectionType === 'wireless'`.

- [ ] **Step 2: Route file**

`createFileRoute('/devices')({ component: DevicesPage })`; import path `../features/devices`.

- [ ] **Step 3: Verify**

Run dev server; devices page with a live router shows rows; toggle filter; error state when API down; empty state with none. Check mobile (table scroll container) + dark mode.

- [ ] **Step 4: Verify + commit**

```bash
cd apps/web
bunx tsc --noEmit && bunx eslint . && bunx prettier --check .
git add apps/web/src/features/devices apps/web/src/routes/devices.tsx
git commit -m "feat(web): connected devices page"
```

---

### Task 10: WiFi settings page

**Files:**
- Create: `apps/web/src/features/wifi/wifi-page.tsx`, `wifi-band-form.tsx`, `index.ts`
- Create: `apps/web/src/routes/wifi.tsx`

**Interfaces:**
- Consumes: `fetchWifiStatus` query; `updateWifi` mutation; `WifiConfigDTO`/`WifiStatusDTO` from types; registry `Card`, `Tabs`, `Form` (registry `form` component + RHF), `Input`, `Switch`, `Select`, `Button`, `Alert`
- Produces: `/wifi` route; per-band (2.4GHz/5GHz) tabs; each band a form (SSID, enabled switch, security select, channel select/input, password with show/hide); loads current state from wifi-status; save → mutation → `sonner` toast success/error + invalidate wifi-status; reboot control lives on Settings (Task 11).

- [ ] **Step 1: Ensure `form` registry component present**

```bash
cd apps/web && npx shadcn@latest add form -c apps/web
```

- [ ] **Step 2: WiFi page**

Wire tabs to bands from `wifiStatusQuery`; band form component per band; `zodResolver(wifiConfigSchema)` extended per-band with channel range; mutate on submit.

- [ ] **Step 3: Handle driver-unsupported state**

If the router (or current driver) returns no wifi status or the apply throws a driver error, surface `Alert`/empty state explaining the router may not expose WiFi; never silently no-op.

- [ ] **Step 4: Route file**

`createFileRoute('/wifi')` → `WifiPage`.

- [ ] **Step 5: Verify**

Live router: load shows current band values; editing + save toasts and invalidates; error path on unreachable router; empty state on no router; mobile + dark mode.

- [ ] **Step 6: Verify + commit**

```bash
cd apps/web
bunx tsc --noEmit && bunx eslint . && bunx prettier --check .
git add apps/web/src/features/wifi apps/web/src/routes/wifi.tsx
git commit -m "feat(web): wifi settings page"
```

---

### Task 11: Settings page — router management + reboot

**Files:**
- Create: `apps/web/src/features/settings/settings-page.tsx`, `router-list.tsx`, `danger-zone.tsx`, `index.ts`
- Create: `apps/web/src/routes/settings.tsx`

**Interfaces:**
- Consumes: `fetchRouters` query, `fetchDeleteRouter` (Task 8), `rebootRouter`, `SetupRouterDialog`; registry `Table`, `Button`, `AlertDialog`, `Badge`
- Produces: `/settings` route: router list (name/host/driver/created), add-router button → SetupRouterDialog, per-row delete → `AlertDialog` confirm → toast; Danger Zone card: reboot active router → `AlertDialog` with typed confirmation (`Type REBOOT`), mutation → toast.

- [ ] **Step 1: Router list + delete flow**

Table of routers; delete row → AlertDialog ("Delete router? credentials and connection will be removed") → `DELETE` → invalidate `['routers']` (+ clear active selection if it was active) → toast.

- [ ] **Step 2: Danger zone reboot**

Reboot button disabled when no active router or mutation pending; confirm dialog typed; on success toast "Reboot command sent"; invalidate status queries.

- [ ] **Step 3: Route file**

`createFileRoute('/settings')` → `SettingsPage`.

- [ ] **Step 4: Verify**

Add router via dialog (no live router needed for add+delete since delete is local-only DB operation), delete confirms and disappears; reboot disabled with no router; with live router reboot toasts.

- [ ] **Step 5: Verify + commit**

```bash
cd apps/web
bunx tsc --noEmit && bunx eslint . && bunx prettier --check .
git add apps/web/src/features/settings apps/web/src/routes/settings.tsx
git commit -m "feat(web): settings page with router management and reboot"
```

---

### Task 12: Dashboard actions polish

**Files:**
- Modify: `apps/web/src/features/dashboard/*`
- Create: `apps/web/src/features/dashboard/actions.tsx` (Submit Internet, Reboot shortcuts w/ confirm)

**Interfaces:**
- Consumes: `submitInternet` (existing), `rebootRouter`; registry `Button`, `AlertDialog`, `Tooltip`
- Produces: header action cluster: "Submit Internet Settings" (visible when WAN present) and reboot in overflow/danger — each with confirm dialog + loading state + toast.

- [ ] **Step 1: Implement actions**

Wire mutations; keep `SubmitInternetButton` behavior but as shadcn `Button` variant; move reboot here too (with AlertDialog confirm) OR keep reboot only in Settings — do NOT duplicate; pick one home (dashboard actions for quick reboot is convenient; Settings remains canonical). Decide: dashboard shows Submit Internet; reboot stays Settings-only. Confirm dialog for submit-internet is optional (side effect on WAN) — include one.

- [ ] **Step 2: Verify**

Live router: submit → toast success/failure; loading states; no router → hidden.

- [ ] **Step 3: Verify + commit**

```bash
cd apps/web
bunx tsc --noEmit && bunx eslint . && bunx prettier --check .
git add apps/web/src/features/dashboard
git commit -m "feat(web): dashboard action buttons with confirmations"
```

---

### Task 13: packages/ui cleanup + repo-wide consistency

**Files:**
- Modify: `packages/ui/src/*` (keep custom primitives that packages still import — re-export style)
- Modify: `packages/ui/src/index.ts`
- Delete: `packages/ui/src/table.tsx` etc. ONLY if no imports remain anywhere (check `apps/api`, `packages/*`; currently only `apps/web` imports `@modern-router-management/ui`)
- Modify: `README.md` + `apps/web/README.md` (UI section: "shadcn/ui (registry) + preset b2dwXaSzv0"; remove "Custom component library")
- Modify: `apps/web/src/lib/site.ts` (title/description for the new product shell)

**Interfaces:**
- Consumes: final import graph
- Produces: single source of truth for UI primitives (apps/web registry); `packages/ui` either empty-and-deleted or reduced to what non-web workspaces need

- [ ] **Step 1: Audit imports**

`grep -rn "@modern-router-management/ui" --include=*.ts* .` — expect only `apps/web` references remain (all deleted in Tasks 5–6). If so, either (a) delete `packages/ui` + remove from root `package.json` workspaces, turbo tasks (`build:ui`, `@modern-router-management/ui#build`), Dockerfile COPY lines, and `apps/web/package.json` dependency — verify turbo graph (`turbo.json` web dependsOn) — or (b) keep the package only if non-web code imports it. Prefer deletion (a); if the workspace removal proves invasive to Docker/turbo config in this pass, keep the package as a thin re-export barrel `export * from ...` pointing at apps/web components is NOT possible cross-package (styles/alias) — so prefer true deletion (a) and update all configs.

- [ ] **Step 2: Update docs**

README + web README: tech stack line "UI: shadcn/ui (registry components, Tailwind v4, preset b2dwXaSzv0)"; remove the feature bullet "Modern UI: ... custom Tailwind" wording if stale; add pages list.

- [ ] **Step 3: Full repo verification**

```bash
bun run check-types
bun run lint
bun run format:check
cd apps/api && bun run test
cd packages/drivers && bun run test
```

(If packages/ui deleted, also `bun install` to refresh lockfile + `bun run build` once.)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(ui): remove legacy custom ui package, update docs"
```

---

### Task 14: E2E verification, Dockerfile, final review

**Files:**
- Modify: `Dockerfile` (if packages/ui removed in Task 13: drop COPY lines/workspace refs; ensure web build still produces SSR server bundle with registry components — components are source, bundled at build time)
- Modify: `.github/workflows/*` only if they reference removed workspaces/scripts
- Create: nothing new

**Interfaces:**
- Consumes: all tasks
- Produces: verified end-to-end runnable app (dev + Docker build)

- [ ] **Step 1: Full local E2E smoke**

```bash
bun run dev:api &   # requires real router/env — if unavailable, run against no-router state
bun run dev:web
```

Browser: walk Dashboard (loading skeletons → data or empty state), navigate all four pages, add/delete a router, toggle theme + persist, resize to mobile (drawer), verify toasts appear.

- [ ] **Step 2: Docker build**

```bash
docker build -t modern-router-management:ui-overhaul .
```

Expected: build succeeds with the new shadcn source tree (components bundled into web dist). If packages/ui was deleted, confirm Dockerfile no longer references it (check all `COPY`/`RUN` lines).

- [ ] **Step 3: Regression + final gates**

```bash
bun run check-types && bun run lint && bun run format:check
bun run build
```

- [ ] **Step 4: Commit any fixups**

```bash
git add -A
git commit -m "chore: final ui/ux overhaul fixes"
```

---

### Task 15: Update project docs (README, AGENT.md progress)

**Files:**
- Modify: `README.md`
- Modify: `docs/task.md` (append Progress: UI overhaul complete, pages, preset)
- Modify: `AGENT.md` (if it documents the custom UI package/stack — update UI section to shadcn preset)

**Interfaces:**
- Consumes: final state
- Produces: accurate docs

- [ ] **Step 1: Update README stack/features**

Tech stack frontend section: add shadcn/ui + preset code; features: list Dashboard/Devices/WiFi/Settings pages; remove stale custom-UI wording.

- [ ] **Step 2: Update docs/task.md Progress + AGENT.md**

Append a Progress bullet reflecting the overhaul and driver WiFi completion.

- [ ] **Step 3: Verify + commit**

```bash
git add README.md docs/task.md AGENT.md
git commit -m "docs: update project docs for shadcn ui overhaul"
```

---

## Self-Review Notes (plan-internal)

- **Spec coverage:** preset token system (T3), shell/nav (T4), query/store/forms/toasts/error-empty states across T5–T12, four routes (T5/9/10/11 + dashboard T6), driver WiFi (T7), API endpoints (T8), docs/config (T13–15). Matches approved scope: full overhaul + driver feature completion; shadcn-as-direction.
- **Explicit non-goals (do NOT implement unless re-approved):** Material Design 3 vocabulary/tokens/MUI; auth pages UI (better-auth API-only today); backend beyond the two endpoints above; `packages/ui` kept if deletion is risky — prefer deletion, fallback documented.
- **Cross-task type consistency:** `WifiStatusDTO`/`wifiStatusSchema` defined once (Task 7) and consumed in T8/T10; `fetchWifiStatus` and `fetchDeleteRouter` names stable from T5; query keys centralized (T5) reused everywhere.
- **No placeholders:** every task lists concrete files, commands, acceptance steps, and commit messages.
