# Task 8 Report — API: wifi-status endpoint + router delete + tests

## Status
DONE

## What changed
`apps/api` only (staged explicitly; `.superpowers/` + `docs/superpowers/` untracked and not committed).

1. **apps/api/src/routers/routers.service.ts**
   - Added `WifiStatusDTO` type import from `@modern-router-management/types/router`.
   - `getWifiStatus(routerId: number): Promise<WifiStatusDTO>` → `withDriver(id, d => d.getWifiStatus())` (matches the pattern of the other driver-backed getters).
   - `deleteRouter(routerId: number): Promise<{ ok: boolean }>`:
     - Selects the router row by id; throws `NotFoundException('Router not found')` if absent (no delete attempted).
     - Deletes `router_credentials` rows for the routerId first, then closes + removes any cached driver (defensive try/catch around `driver.close()`, mirroring `onModuleDestroy`; entry removed from cache regardless of close success), then deletes the router row. Returns `{ ok: true }`.
     - Uses the existing `this.schema` getter (pg vs sqlite Drizzle schema by `connection.engine`) and `this.db` — no engine-specific branching needed since both engines' tables support identical select/delete chains; engine branching only matters for inserts (createdAt), which delete does not touch.

2. **apps/api/src/routers/routers.controller.ts**
   - `@Get(':id/wifi-status')` `getWifiStatus(@Param('id', ParseIntPipe) id)` → `service.getWifiStatus(id)`.
   - `@Delete(':id')` `deleteRouter(@Param('id', ParseIntPipe) id)` → `service.deleteRouter(id)`.
   - Added `Delete` to the `@nestjs/common` import.

3. **apps/api/src/routers/routers.service.spec.ts** (new) — plain-unit style consistent with repo conventions (no full Nest module; service constructed directly with a fake db connection, matching the constructor contract `{ db, engine }`):
   - `getWifiStatus` returns the cached driver's wifi status (does not hit the db when driver is cached).
   - `deleteRouter`: full order assertion `select:routers → delete:credentials → close-driver → delete:routers`; asserts `driver.close` called once, cache entry dropped, and deletes target the sqlite `routerCredentials`/`routers` tables.
   - Close failure is defensive: router row still deleted and cache entry still dropped (console.error spied/silenced).
   - Missing router → `NotFoundException`, and no delete is issued.
   - Postgres connection → deletes target `pgSchema` tables.
   - Fake db is a chainable builder (`select/delete/from/where/orderBy/limit` + thenable) with per-call table/order tracing.

4. **apps/api/src/routers/routers.controller.spec.ts** (new) — NestJS Testing module (matches app.controller.spec.ts convention) with a mocked `RoutersService` provider:
   - Route-wiring assertions via Nest's real metadata keys (`PATH_METADATA`/`METHOD_METADATA` on the prototype methods): GET `:id/wifi-status`, DELETE `:id`.
   - Handler passthrough: `getWifiStatus(7)` / `deleteRouter(7)` delegate to the service and return its results.

No changes to driver packages; `reboot` endpoint left untouched as required.

## Verification
- `cd apps/api && bun run test`:
  ```
  PASS src/routers/routers.service.spec.ts
  PASS src/routers/routers.controller.spec.ts
  PASS src/app.controller.spec.ts
  Test Suites: 3 passed, 3 total
  Tests:       10 passed, 10 total
  ```
  (Existing app.controller.spec still passes.)
- `cd apps/api && bunx tsc --noEmit` → exit 0.
- `cd apps/api && bun run build` (nest build) → exit 0. Workspace types/drivers resolve via their checked-in `dist` (built at T7; verified `WifiStatusDTO` present in `packages/types/dist/router.d.ts` and `getWifiStatus` in drivers dist). No re-import issues; `require('@modern-router-management/drivers')` loads at runtime.

## Commit
- `d5253bd` — `feat(api): wifi-status endpoint and router delete` (full: `d5253bd8ee1a83a7e2768dcf3b59ad5d7260852e`)
- Staged paths: `apps/api/src/routers/routers.controller.ts`, `apps/api/src/routers/routers.service.ts`, `apps/api/src/routers/routers.controller.spec.ts`, `apps/api/src/routers/routers.service.spec.ts` (4 files, +347).
- `.superpowers/` and `docs/superpowers/` remain untracked (not part of this task).

## Concerns
- None blocking. Minor notes: (1) `routers.service.ts` uses `console.log` for driver lifecycle (existing convention — mirrored, not introduced); (2) `deleteRouter` deletes credentials and the router row without a transaction — consistent with the codebase's existing non-transactional writes; if partial-failure atomicity becomes a requirement, wrap in a transaction later.
