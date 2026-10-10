# Task 8 brief — API: wifi-status endpoint + router delete + tests

## Context
T7 lands `getWifiStatus` + real `updateWifiSettings` on the ZTE driver and `WifiStatusDTO`/`wifiStatusSchema` in packages/types (build order: types then drivers). API is NestJS in apps/api. RoutersService has `withDriver(routerId, handler)`; controller routes at apps/api/src/routers/routers.controller.ts; service apps/api/src/routers/routers.service.ts; schema (Drizzle) at apps/api/src/db/schema.ts with routers + routerCredentials tables (pg + sqlite variants); driver cache Map<number, CachedDriver> with host/username; `close()` on driver. Tests: jest (repo convention — app.controller.spec.ts colocated under src/; jest config in apps/api/package.json).

## Requirements
1. **Service methods** in RoutersService:
   - `getWifiStatus(routerId: number): Promise<WifiStatusDTO>` → `withDriver(id, d => d.getWifiStatus())`
   - `deleteRouter(routerId: number): Promise<{ ok: boolean }>` → find router (404 NotFoundException if missing); delete routerCredentials rows for routerId; close + remove cached driver (defensive: try/catch close, mirror onModuleDestroy); delete router row; return { ok: true }. Order: credentials → close driver → delete router. Handle both pg and sqlite schema paths via existing this.schema + this.db pattern (read how other writes branch by engine — createdAt handling etc.).
2. **Controller routes**:
   - `@Get(':id/wifi-status')` → service.getWifiStatus (ParseIntPipe)
   - `@Delete(':id')` → service.deleteRouter
3. **Tests** (jest, colocated e.g. apps/api/src/routers/routers.service.spec.ts + controller additions or a combined spec — follow existing patterns; check if routers.controller.spec.ts exists after T7-era additions; app.controller.spec.ts is the template):
   - service.deleteRouter: removes credentials + router rows, closes driver + removes from cache, 404 on missing router (mock db/schema/driver per existing test style — if no routers spec exists yet, build minimal mocks consistent with NestJS Testing module or plain unit style already used)
   - controller: DELETE :id + GET :id/wifi-status route wiring returns service results
   - Run `cd apps/api && bun run test` — all pass (existing app.controller.spec must still pass).
4. **Build/type**: `cd apps/api && bunx tsc --noEmit` and `bun run build`. Also confirm packages/types + drivers built state compiles together (api imports the new WifiStatusDTO — the workspace packages resolve via source/tsc paths; run the api build which depends on types/drivers).
5. Commit explicit paths. Message: `feat(api): wifi-status endpoint and router delete`

## Acceptance
- DELETE /routers/:id + GET /routers/:id/wifi-status live; delete cleans credentials + cache + closes driver, 404s cleanly; jest green incl. existing specs; tsc + build pass.
