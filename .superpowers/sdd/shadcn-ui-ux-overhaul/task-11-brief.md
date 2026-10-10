# Task 11 brief — Settings page (/settings): router list, delete (with reconcile fix), reboot danger zone

## Context
Through T10: shell + router context + query options + all pages except Settings. API now supports DELETE /routers/:id (T8). Reboot endpoint POST /routers/:id/reboot exists (pre-overhaul) + rebootRouter(routerId) already in lib/api.ts + driver.reboot is a STUB (T7 scope excluded it) — Settings reboot button will fire the endpoint; if the driver stub makes it a no-op on the router, the UI still must handle success/error properly (endpoint returns {ok:true}). Do NOT implement the driver reboot in this task (out of scope, note in report if relevant).

Registry components available (all compile now post-@source): card, table family, button, badge, input, dialog, alert-dialog, dropdown-menu, skeleton, sonner, separator, switch, select, tabs.

Carry-overs that BIND this task:
- T5 minor: persisted routerId (localStorage 'router-core:activeRouterId') is never reconciled against the routers list — after a delete, the stored id may dangle. Fix in router-store.tsx: when routers load and the stored routerId is not among them, fall back to activeRouter.id ?? null (and clear storage). Must be handled in this task (delete flow depends on it).
- The RouterProvider currently only exposes what the dashboard uses; check features/routers/router-store.tsx state shape and extend if Settings needs more (e.g. expose routers list refresh + delete integration; keep single source of truth).

## Requirements
1. `apps/web/src/features/settings/settings-page.tsx` (+ router-list.tsx + danger-zone.tsx + index.ts barrel), route `apps/web/src/routes/settings.tsx` createFileRoute('/settings'):
   - **Router list section** (Card + Table): columns Name / Host / Driver / Created (format date) / Actions (dropdown or inline). Rows from routersQuery (routersOptions). Loading skeletons. Add-router Button opens SetupRouterDialog (features/routers/setup-router-dialog.tsx — dialog state local to page).
   - **Delete flow**: row action → AlertDialog confirm ('Delete router X? Its encrypted credentials and connection will be removed. This cannot be undone.') → mutation DELETE /routers/:id → sonner toast success/error; invalidate ['routers'] (+ ['router','active']); reconcile active selection (the fix above); if deleted router was the active one and no routers remain, show no-router empty guidance.
   - **Danger zone**: Card 'Danger Zone' (destructive styling) → 'Reboot router' Button disabled when no active router or pending; AlertDialog with TYPED confirmation (user types 'REBOOT' to enable confirm — input + disabled-until-match) → mutation rebootRouter(activeRouterId) → toast success ('Reboot command sent') / error; invalidate status queries (['router', id, 'system-status'] etc. — prefix invalidate ['router', id]).
2. Route regen (routeTree.gen.ts) + AppNav /settings link resolves; active state.
3. Verification: tsc 0, eslint 0, prettier. Browser: add via dialog, delete flow (confirm → removed from list → selection reconciled), reboot danger zone (typed confirm gates, pending state, toast), no-router states, dashboard/shell visual spot-check for @source regressions. Live-router caution: reboot is destructive — do NOT click live reboot against the real router if avoidable; verify the gate/flow with the button disabled or confirm-dialog state machine; if you must exercise the mutation, expect the driver-stub no-op + toast, but prefer not to reboot the production router.
4. Commit explicit paths. Message: `feat(web): settings page with router management and reboot`

## Acceptance
- /settings live: router list CRUD-consistent (add/delete), delete reconciles selection (T5 fix), reboot typed-confirm + toasts; states; tsc/eslint/prettier clean; browser-verified (live-safe).
