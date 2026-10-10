# Task 12 brief — dashboard actions polish (submit-internet + reboot shortcut w/ confirm)

## Context
Through T11: all four pages exist (Dashboard rebuilt T6, Devices T9, WiFi T10, Settings T11). SubmitInternetButton was deleted in T6 (its api helper `submitInternet(routerId)` still exists in lib/api.ts — T6 review noted it as orphaned, now it regains a consumer). The dashboard currently shows status read-only. This task adds the action buttons: Submit Internet Settings (the ZTE apply-WAN flow) and a reboot shortcut, each with confirm + loading + toast.

Driver reality: `submitInternet` navigates ZTE Internet→WAN and clicks Apply (real, T7-era driver work); `reboot` driver method is a STUB (out of scope everywhere — the reboot endpoint returns {ok:true} no-op on the router). Settings (T11) already has the canonical reboot danger zone with typed REBOOT confirm.

## Requirements
1. `apps/web/src/features/dashboard/actions.tsx` (+ export via features/dashboard/index.ts):
   - **Submit Internet Settings** button (visible only when a WAN/INTERNET connection is present — dashboard has wanStatusQuery.data; simplest: show when routerId != null && wanStatus data exists; hide in empty/loading/error states): mutation submitInternet(routerId) → AlertDialog confirm ('Submit internet settings? Applies current WAN configuration on the router.') → toast success ('Internet settings submitted') / error (message); invalidate ['router', routerId, 'wan-status'] + related status queries (prefix invalidate ['router', routerId]); loading state on button; disabled while any router mutation pending.
   - Placement: dashboard header action area (or near WAN section — choose what reads best with the rebuilt layout; the old UI had it bottom-right of the WAN block — check current dashboard-page layout and place consistently).
2. Decide reboot on dashboard: Settings owns canonical reboot (typed confirm). Do NOT duplicate the typed-confirm danger zone on the dashboard; if a quick reboot shortcut is added it must be a plain confirm AlertDialog that links/points to Settings for the destructive path OR omit reboot from dashboard entirely. RECOMMENDED: omit dashboard reboot (Settings is canonical); keep dashboard to Submit Internet + refresh. If you add it anyway, mirror Settings' typed confirm and state why.
3. Polish opportunistically IF trivial + in-file: T6-deferred minor (PON section shows permanent skeletons when WAN errors — enabled-chain hole). Do NOT restructure the query chain; only if a 3-line guard fixes it cleanly (e.g. render a PON-unavailable card when wan error && system success && pon pending-disabled) — otherwise leave for T14 note.
4. Verification: tsc 0, eslint 0, prettier. Browser: button visibility per states, confirm dialog gate, mutation + toasts (safe: submitInternet against live router DOES click Apply on WAN — it is same-config apply, T7 did equivalent same-value applies safely; if uneasy, verify wiring via intercepted POST + error path only), loading states, no-router hidden, dark mode; @source visual spot-check of dashboard.
5. Commit explicit paths. Message: `feat(web): dashboard action buttons with confirmations`

## Acceptance
- Dashboard Submit Internet Settings with confirm/toasts/loading + invalidations; button hidden in no-router/loading/error; reboot NOT duplicated (or justified duplication); dashboard visual spot-check clean; tsc/eslint/prettier clean.
