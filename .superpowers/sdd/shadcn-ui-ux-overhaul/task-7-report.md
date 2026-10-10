# Task 7 report — driver: WiFi status read + real update (TDD, bun test)

## Status
DONE_WITH_CONCERNS (concerns are live-router-verification items, not blockers)

## What changed

1. **`packages/types/src/router.ts`** — added `wifiStatusBandSchema`/`wifiStatusSchema` + `WifiStatusBandDTO`/`WifiStatusDTO` (zod): `{ bands: Array<{ band: '2.4ghz'|'5ghz', enabled, ssid, password?, channel?, mode?, security? }> }`, exported via the existing barrel (`export * from "./router.js"`).

2. **`packages/drivers/src/base-driver.ts`** — added `getWifiStatus(): Promise<WifiStatusDTO>` to the `RouterDriver` interface.

3. **`packages/drivers/src/zte-wifi.ts`** (new) — browser-free pure module (unit-testable without chromium):
   - XML-ish parsers mirroring the driver's regex style: `parseXmlInstances`, `parseWlanSsidInstances`, `parseWlanRadioInstances`, `parseRadioStatusForBand`, `securityFromAp`.
   - `buildWifiStatus(ssidXml, radioXml)` — maps AP instances (linked to radios via `WLANViewName`: `DEV.WIFI.RD1`=2.4GHz / `DEV.WIFI.RD2`=5GHz) + radio channel/standard/RadioStatus into the `WifiStatusDTO`; per-band primary-SSID selection prefers the enabled primary alias (`SSID1`/`SSID5`); enable falls back to the SSID Enable flag when the radio XML is absent; password intentionally never populated (router serves it AES-encrypted).
   - Apply path: `WifiPageState` snapshot model (radio on/off rows, SSID form slots, adconf channel slots), `planWifiSettingsUpdate(config, state)` builds a typed action plan (expand forms, toggle band radio + apply on/off, fill ESSID + visible KeyPassphrase, set VAP enable, pick channel via the global-config `UI_Channel` select + apply, settle waits), `executeWifiUpdatePlan(page, plan)` runs it against any `WifiUiPage` (Playwright `Page` or a test double). Updates drive the real router UI so the router's own JS performs submit-time AES session-key encryption (no hand-rolled crypto).

4. **`packages/drivers/src/zte-f6600p.ts`** — replaced the empty `updateWifiSettings` stub with a real implementation and added `getWifiStatus`:
   - `getWifiStatus()`: authenticated `menuData` XHRs to `wlan_wlansssidconf_lua.lua` (SSID/security) + `wlan_wlanbasicadconf_lua.lua` (channel/mode/RadioStatus), preflighted by the `wlanBasic` menuView, parsed via `buildWifiStatus`.
   - `updateWifiSettings(config)`: `wifiConfigSchema.parse` first; opens Local Network → WLAN → WLAN Basic (expanding the global-config and SSID sections), snapshots live form state via `collectWifiPageState`, builds + executes the plan, then re-reads `getWifiStatus()` and **throws if the router fails to confirm** the new SSID/enable state (no silent no-op).
   - Helpers: `openWlanBasicPage()`, `collectWifiPageState()`.

5. **`packages/drivers/package.json`** — added `"test": "bun test"`.

6. **`packages/drivers/test/zte-wifi.test.ts`** (new) — 17 bun tests, no chromium launched, fixtures documented as synthetic (hand-built to the exact shapes captured live): schema validation; SSID/radio XML parsing; 2.4G/5G fixture → DTO mapping incl. enable-from-RadioStatus, fallback, missing-band skip; plan building for 2.4G/5G (radio toggle, VAP enable, secret fill, channel set, applies, minimal no-change plan, missing-radio/SSID errors); plan execution against a recorded page double (open-collapsed forms, fill visible secret, apply).

## Verification

- `cd packages/drivers && bun test` → **17 pass / 0 fail** (51 expect calls).
- `cd packages/drivers && bun run build` (tsc) → clean. `bun run check-types` → clean.
- `cd packages/types && bun run build` (tsc, tsconfig.build) → clean.
- Prettier check on all touched files → clean.
- **Live-router validation (real ZTE F6600P @ 192.168.1.1, headless chromium):**
  - `getWifiStatus()` returned the real state: 2.4ghz `{ssid: "Sentral@Basudewa", enabled:false, channel:9, mode:"b,g,n,ax", security:"WPA3-SAE"}` and 5ghz `{ssid:"Sentral@Basudewa", enabled:false, channel:161, mode:"a,n,ac,ax", security:"WPA3-SAE"}`; schema round-trip valid; all 8 live SSID slots + both channel forms collected correctly.
  - `updateWifiSettings()` executed the full real UI drive with the router's current 2.4GHz values (semantic no-op, no state change) and the router confirmed: re-read state identical (`MATCH: true`). The flow — navigate, expand both collapsible sections, fill SSID + visible KeyPassphrase, click Apply, wait for router persistence — genuinely works end-to-end.

## Commit

- `42e42e5ba068abec2d83bdd97301029c9a5a1b32` — `feat(drivers): read and apply ZTE wifi settings`
- Staged paths: `packages/types/src/router.ts`, `packages/drivers/src/base-driver.ts`, `packages/drivers/src/zte-f6600p.ts`, `packages/drivers/src/zte-wifi.ts`, `packages/drivers/test/zte-wifi.test.ts`, `packages/drivers/package.json` (6 files, +1045/−1). Untracked `.superpowers/` + `docs/superpowers/` pre-existed and were not staged.

## Concerns (live-route validation items)

1. **Channel-apply path not yet exercised on the live router.** The adconf `UI_Channel` select requires the WLAN Global Configuration section to be expanded (the collector verifies it reads real channels 9/161), but I deliberately did NOT click an Apply that would change the channel on the user's production router. The select + per-section Apply wiring mirrors the verified SSID/on-off Apply flow, but a live channel change should be validated once (e.g. on a non-production router).
2. **Radio enable/disable (band on/off) not yet exercised live.** Current router state has both bands OFF and the config used `enabled:false`, so no radio toggle + on/off Apply occurred. The plan/executor paths are unit-tested and mirror the verified flows; live validation of turning a band ON (and back OFF) is recommended.
3. **Password fill semantics.** The router's DOM exposes the current passphrase only in plaintext after the page's own decrypt round-trip; the config password is always (re)filled and the form applied, since the encrypted value can't be diffed. Fill targets the visible `KeyPassphrase` input; the router's own JS (`g_transValueVisableToHidden`, AES-256-CBC session key) handles submit-time encryption — verified live via a full UI apply (router confirmed identical state after re-submitting the real passphrase).
4. **Passwords are never returned by `getWifiStatus`** (schema-optional `password`) — the router serves them AES-encrypted and decoding requires the session key; the WiFi UI must treat password as write-only.
5. **Fixture fidelity** — unit fixtures are synthetic but mirror real captured XML/DOM shapes (AP aliases SSID1/SSID5, `DEV.WIFI.RD1/RD2`, `:N`-suffixed template ids, PostIgnore twins); field/radio semantics were confirmed against the live device.
