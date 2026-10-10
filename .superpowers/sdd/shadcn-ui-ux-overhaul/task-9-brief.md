# Task 9 brief — Devices page (/devices)

## Context
Web overhaul through T8: shadcn base-sera registry components; app shell with nav (Dashboard /, Devices /devices, WiFi /wifi, Settings /settings — Devices route file DOES NOT EXIST yet, this task creates it); router context (RouterProvider/useActiveRouter in apps/web/src/features/routers/router-store.tsx, localStorage key 'router-core:activeRouterId'); typed query options (devicesOptions(id) exists in lib/query-options.ts with refetchInterval 15s); API GET /routers/:id/devices returns DeviceDTO[] (endpoint existed pre-overhaul). Dashboard feature pattern to mirror: apps/web/src/features/dashboard/* with index barrel + route file delegation (routes/index.tsx = createFileRoute('/')({component}) importing from ../features/...).

DeviceDTO (packages/types): { id: string, name: string, ipAddress: string, macAddress: string, connectedAt: string, connectionType: 'wired'|'wireless', signalStrength?: number (0-100) }.

Registry components available: table family, card, badge, button, input, skeleton, dropdown-menu, progress, tooltip, separator, scroll-area.

## Requirements
1. `apps/web/src/features/devices/devices-page.tsx` (+ devices-table.tsx + index.ts barrel): 
   - No active router → empty state card (muted icon + 'No router selected' + guidance to add one in Settings — button optional linking to /settings).
   - Loading → skeleton rows (Table with Skeleton cells or card skeleton).
   - Error → inline Alert-style card with retry (refetch) — use whatever the dashboard error pattern does (check dashboard-page.tsx error card and mirror it).
   - Data → Card with header (title 'Connected Devices' + count badge + refresh icon-button) + Table: columns Device (name + id small), IP address, MAC (mono, copyable via navigator.clipboard + tooltip? keep simple: plain cell or copy button if cheap), Type (Badge wired/wireless — wire icon), Signal (wireless only: small Progress or icon+%; wired: em dash), Connected (relative/absolute time from connectedAt — format helper; check dashboard format.ts conventions and reuse pattern). Client-side filter Input above table (name/IP/MAC case-insensitive). Empty filtered result row ('No devices match'). Zero devices → table-empty state row ('No devices connected').
   - Refetch interval 15s comes from devicesOptions(id). Refresh button refetches.
2. Route file `apps/web/src/routes/devices.tsx`: createFileRoute('/devices')({ component: DevicesPage }) importing feature barrel. (After this, AppNav's /devices link resolves — verify active state works.)
3. Verification: tsc 0 errors, eslint 0 problems, prettier on touched files. Browser: /devices renders skeleton → data (mock or live API), filter works, wired/wireless badges, signal shown only for wireless, refresh works, no-router empty state, mobile no-overflow (table inside overflow-x-auto container). If no live router: mock fetch via devtools/route interception or temporary fetch override — do NOT commit test mocks into api.ts.
4. Commit explicit paths. Message: `feat(web): connected devices page`

## Acceptance
- /devices route live with table + filter + states; nav link now resolves; tsc/eslint/prettier clean; browser-verified.
