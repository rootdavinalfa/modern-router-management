/**
 * Pure, browser-free helpers for reading and applying ZTE F6600P WiFi settings.
 *
 * Shapes were captured from a live ZTE F6600P (2026-09-09):
 *  - `wlan_wlansssidconf_lua.lua` returns `<OBJ_WLANAP_ID><Instance>` blocks per
 *    SSID with `Enable`, `ESSID`, `Alias`, `BeaconType`, `WLANViewName`
 *    (`DEV.WIFI.RD1` = 2.4GHz radio, `DEV.WIFI.RD2` = 5GHz radio), and WPA/WPA3
 *    auth/encryption fields.
 *  - `wlan_wlanbasiconoff_lua.lua` returns `<OBJ_WLANSETTING_ID>` instances per
 *    radio with `Band` + `RadioStatus` (1 = radio on).
 *  - `wlan_wlanbasicadconf_lua.lua` returns `<OBJ_WLANSETTING_ID>` instances per
 *    radio with `Channel`, `Standard`, `Band`, `RadioStatus`.
 *
 * These helpers intentionally do not import Playwright, so unit tests can drive
 * them with synthetic fixtures (no chromium). Navigation/apply glue lives in the
 * driver (`zte-f6600p.ts`) and executes the returned plan against a live page.
 */
import type { WifiConfigDTO, WifiStatusDTO } from "@modern-router-management/types/router";

// ---------------------------------------------------------------------------
// XML-ish parsing (mirrors the driver's existing regex helpers)
// ---------------------------------------------------------------------------

/** Decode the handful of XML entities the router emits (&#32; etc.). */
const decodeXmlEntities = (raw: string): string =>
  raw
    .replace(/&#(\d+);/g, (_m, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type XmlInstance = Record<string, string>;

/**
 * Extract every `<Instance>` block of an `<OBJ_*>` section as a plain map of
 * ParaName → decoded ParaValue.
 */
export function parseXmlInstances(xml: string, objectTag: string): XmlInstance[] {
  const objBody = new RegExp(`<${escapeRegExp(objectTag)}>([\\s\\S]*?)</${escapeRegExp(objectTag)}>`, "i").exec(xml);
  if (!objBody) return [];

  const instances: XmlInstance[] = [];
  const instanceRe = /<Instance>([\s\S]*?)<\/Instance>/gi;
  let match: RegExpExecArray | null;
  while ((match = instanceRe.exec(objBody[1])) !== null) {
    const instance: XmlInstance = {};
    const kvRe = /<ParaName>([^<]+)<\/ParaName><ParaValue>([\s\S]*?)<\/ParaValue>/gi;
    let kv: RegExpExecArray | null;
    while ((kv = kvRe.exec(match[1])) !== null) {
      instance[kv[1].trim()] = decodeXmlEntities(kv[2].trim());
    }
    instances.push(instance);
  }
  return instances;
}

// ---------------------------------------------------------------------------
// Status-read parsing
// ---------------------------------------------------------------------------

export type WifiBandKey = "2.4ghz" | "5ghz";
export type WifiRadioBand = "2.4GHz" | "5GHz";

export const RADIO_INST_ID_BY_BAND: Record<WifiBandKey, string> = {
  "2.4ghz": "DEV.WIFI.RD1",
  "5ghz": "DEV.WIFI.RD2",
};

export const BAND_KEY_BY_RADIO: Record<WifiRadioBand, WifiBandKey> = {
  "2.4GHz": "2.4ghz",
  "5GHz": "5ghz",
};

export type WlanSsidInstance = {
  instId: string;
  enabled: boolean;
  alias: string;
  essid: string;
  beaconType: string;
  /** Human security label (see securityFromAp). */
  security: string;
  /** Radio instance id this SSID belongs to (DEV.WIFI.RD1 / DEV.WIFI.RD2). */
  wlanView: string;
};

export type WlanRadioInstance = {
  instId: string;
  band: WifiRadioBand | "";
  radioStatus: string;
  channel: string;
  standard: string;
};

/** Security label for an AP based on its beacon/auth/encryption fields. */
export function securityFromAp(ap: XmlInstance): string {
  const beacon = ap.BeaconType || "";
  if (beacon === "WPA3" || beacon === "WPA3Personal") {
    if ((ap.WPA3AuthMode || "").includes("SAE")) return "WPA3-SAE";
    return "WPA3";
  }
  if (beacon === "11i") {
    if ((ap["11iEncryptType"] || "") === "AESEncryption") return "WPA2-PSK-AES";
    if ((ap["11iAuthMode"] || "").includes("PSK")) return "WPA2-PSK";
    return "WPA2";
  }
  if (beacon === "WPA" || beacon === "WPAand11i") {
    if ((ap.WPAAuthMode || "").includes("PSK")) return "WPA/WPA2-PSK-TKIP/AES";
    return "WPA";
  }
  if (beacon === "None" || beacon === "WEP" || beacon === "") return "No Security";
  return beacon;
}

/** Parse the SSID configuration XML into per-AP instances. */
export function parseWlanSsidInstances(xml: string): WlanSsidInstance[] {
  return parseXmlInstances(xml, "OBJ_WLANAP_ID").map((ap) => ({
    instId: ap._InstID || "",
    enabled: ap.Enable === "1",
    alias: ap.Alias || "",
    essid: ap.ESSID || "",
    beaconType: ap.BeaconType || "",
    security: securityFromAp(ap),
    wlanView: ap.WLANViewName || "",
  }));
}

/** Parse radio-level settings XML (on/off or basic config) per radio instance. */
export function parseWlanRadioInstances(xml: string): WlanRadioInstance[] {
  return parseXmlInstances(xml, "OBJ_WLANSETTING_ID").map((radio) => ({
    instId: radio._InstID || "",
    band: radio.Band === "5GHz" ? "5GHz" : radio.Band === "2.4GHz" ? "2.4GHz" : "",
    radioStatus: radio.RadioStatus ?? "",
    channel: radio.Channel ?? "",
    standard: radio.Standard ?? "",
  }));
}

/**
 * Choose the band's primary SSID: prefer an enabled SSID whose alias is the
 * router's main one (SSID1 for 2.4GHz, SSID5 for 5GHz — the ZTE F6600P default
 * naming), then any enabled SSID, then the first instance of the radio.
 */
export function pickPrimarySsid(
  instances: WlanSsidInstance[],
  radioInstId: string,
  primaryAlias: string,
): WlanSsidInstance | undefined {
  const bandInstances = instances.filter((ap) => ap.wlanView === radioInstId);
  if (bandInstances.length === 0) return undefined;
  const enabled = bandInstances.filter((ap) => ap.enabled);
  const pool = enabled.length > 0 ? enabled : bandInstances;
  return pool.find((ap) => ap.alias === primaryAlias) ?? pool[0];
}

/**
 * Build the WiFi status DTO from the SSID config XML plus a radio XML (either
 * the on/off `wlan_wlanbasiconoff_lua.lua` for RadioStatus or the basic-config
 * `wlan_wlanbasicadconf_lua.lua` for Channel/Standard/RadioStatus).
 *
 * `enabled` reflects the radio on/off state when the radio XML exposes it,
 * falling back to the primary SSID's Enable flag. Passwords are never included
 * (the router only serves them encrypted).
 */
export function buildWifiStatus(ssidXml: string, radioXml: string): WifiStatusDTO {
  const aps = parseWlanSsidInstances(ssidXml);
  const radios = parseWlanRadioInstances(radioXml);

  const byRadio = new Map<string, WlanRadioInstance>();
  for (const radio of radios) byRadio.set(radio.instId, radio);

  const bands: WifiStatusDTO["bands"] = [];
  for (const [bandKey, radioInstId] of Object.entries(RADIO_INST_ID_BY_BAND) as Array<[WifiBandKey, string]>) {
    const primaryAlias = bandKey === "2.4ghz" ? "SSID1" : "SSID5";
    const ap = pickPrimarySsid(aps, radioInstId, primaryAlias);
    if (!ap) continue;

    const radio = byRadio.get(radioInstId);
    const hasRadioStatus = radio !== undefined && radio.radioStatus !== "";
    const channel = radio?.channel ? Number(radio.channel) : undefined;
    const mode = radio?.standard && radio.standard !== "" ? radio.standard : undefined;

    const band: WifiStatusDTO["bands"][number] = {
      band: bandKey,
      enabled: hasRadioStatus ? radio.radioStatus === "1" : ap.enabled,
      ssid: ap.essid || ap.alias,
      security: ap.security,
    };
    if (Number.isInteger(channel) && channel !== undefined && channel > 0) band.channel = channel;
    if (mode) band.mode = mode;
    bands.push(band);
  }

  return { bands };
}

/** Parse the band on/off XML for a given radio instance's RadioStatus value. */
export function parseRadioStatusForBand(onOffXml: string, radioInstId: string): string {
  const radio = parseWlanRadioInstances(onOffXml).find((r) => r.instId === radioInstId);
  return radio?.radioStatus ?? "";
}

// ---------------------------------------------------------------------------
// Apply-path planning (pure; executed by the driver against the live page)
// ---------------------------------------------------------------------------

export type WifiRadioRow = {
  radioInstId: string;
  band: WifiRadioBand;
  /** Row index of the radio inside the WLAN On/Off form (`RadioStatus0_<n>`). */
  rowIndex: number;
  on: boolean;
};

export type WifiSsidSlot = {
  /** Template suffix N (`template_WLANSSIDConf_<N>`). */
  index: number;
  instId: string;
  wlanView: string;
  alias: string;
  enabled: boolean;
  ssid: string;
};

export type WifiAdconfSlot = {
  /** Template suffix N (`template_WlanBasicAdConf_<N>`). */
  index: number;
  instId: string;
  band: WifiRadioBand;
  /** Current channel as read from the hidden Channel field (null = unknown). */
  channel: number | null;
};

/** Snapshot of the live wlanBasic page forms (collected by the driver). */
export type WifiPageState = {
  radios: WifiRadioRow[];
  ssids: WifiSsidSlot[];
  adconf: WifiAdconfSlot[];
};

export type WifiPlanAction =
  | { type: "wait"; ms: number }
  | { type: "ensure-ssid-open"; index: number }
  | { type: "ensure-adconf-open"; index: number }
  | { type: "toggle-radio"; selector: string; targetOn: boolean }
  | { type: "apply-onoff" }
  | { type: "set-vap-enable"; index: number; on: boolean }
  | { type: "set-channel"; adconfIndex: number; radioInstId: string; channel: number }
  | { type: "fill"; selector: string; value: string }
  | { type: "fill-secret"; selector: string; value: string }
  | { type: "apply-ssid"; index: number };

export const ssidTemplateSel = (index: number): string => `[id="template_WLANSSIDConf_${index}"]`;
export const ssidChangeAreaSel = (index: number): string => `${ssidTemplateSel(index)} .ChangeArea`;
export const adconfTemplateSel = (index: number): string => `[id="template_WlanBasicAdConf_${index}"]`;
export const adconfChangeAreaSel = (index: number): string => `${adconfTemplateSel(index)} .ChangeArea`;

/** A page view that can execute the plan. Playwright's `Page` satisfies this. */
export interface WifiUiLocator {
  click(): Promise<void>;
  fill(value: string): Promise<void>;
  /** Playwright returns the selected option values; doubles may ignore them. */
  selectOption(value: string): Promise<unknown>;
  isVisible(): Promise<boolean>;
}

export interface WifiUiPage {
  locator(selector: string): WifiUiLocator;
  waitForTimeout(ms: number): Promise<void>;
}

/** Selector for the interactive (visible) KeyPassphrase input of an SSID slot. */
export const ssidSecretSel = (index: number): string =>
  `${ssidTemplateSel(index)} input[name="KeyPassphrase:${index}"]:not(.PostIgnore)`;

const bandOf = (band: WifiBandKey): WifiRadioBand => (band === "2.4ghz" ? "2.4GHz" : "5GHz");

/**
 * Build the concrete page actions that apply `config`. Pure: no page touched.
 * The plan fills the band's primary SSID slot with the new SSID/passphrase,
 * toggles the band radio when the enable state differs, picks the new channel
 * on the radio's basic-config form, and applies each changed section — the
 * router's own JS encrypts the passphrase on submit, which is why updates go
 * through the real page rather than hand-built POSTs.
 */
export function planWifiSettingsUpdate(config: WifiConfigDTO, state: WifiPageState): WifiPlanAction[] {
  const band = bandOf(config.band);
  const radioInstId = RADIO_INST_ID_BY_BAND[config.band];

  const radioRow = state.radios.find((r) => r.radioInstId === radioInstId && r.band === band);
  if (!radioRow) {
    throw new Error(`updateWifiSettings: no WLAN on/off row found for ${band} (${radioInstId}) on this page`);
  }

  const primaryAlias = config.band === "2.4ghz" ? "SSID1" : "SSID5";
  const slot = state.ssids.find((s) => s.wlanView === radioInstId && (s.alias === primaryAlias || s.enabled));
  const preferredSlot = state.ssids.find((s) => s.wlanView === radioInstId && s.alias === primaryAlias);
  const ssidSlot = preferredSlot ?? slot;
  if (!ssidSlot) {
    throw new Error(`updateWifiSettings: no SSID form found for ${band} (${radioInstId}) on this page`);
  }

  const adconfSlot = state.adconf.find((a) => a.instId === radioInstId && a.band === band);
  if (!adconfSlot) {
    throw new Error(`updateWifiSettings: no channel form found for ${band} (${radioInstId}) on this page`);
  }

  const actions: WifiPlanAction[] = [];
  const ssidChanged = ssidSlot.ssid !== config.ssid;
  const slotEnabled = ssidSlot.enabled;
  const channelWanted = Number.isInteger(config.channel) && config.channel !== null && config.channel > 0;
  const channelChanged = channelWanted && (adconfSlot.channel === null || adconfSlot.channel !== config.channel);

  if (radioRow.on !== config.enabled) {
    const onId = config.enabled ? 0 : 1;
    actions.push({
      type: "toggle-radio",
      selector: `[id="template_WlanBasicAdOnOff"] [id="RadioStatus${onId}_${radioRow.rowIndex}"]`,
      targetOn: config.enabled,
    });
    // The radio toggle is persisted by the WLAN On/Off section's own Apply.
    actions.push({ type: "apply-onoff" });
  }

  // The current passphrase is never exposed as plaintext in the DOM (the router
  // serves it AES-encrypted), so the config password cannot be diffed. The UI
  // form always re-submits it; fill the plaintext into the visible input and
  // let the router's own submit-time JS re-encrypt it (AES-256-CBC session key).
  // Open the SSID form, fill SSID (if changed) + passphrase, and apply.
  actions.push({ type: "ensure-ssid-open", index: ssidSlot.index });
  if (ssidChanged) {
    actions.push({
      type: "fill",
      selector: `${ssidTemplateSel(ssidSlot.index)} [id="ESSID:${ssidSlot.index}"]`,
      value: config.ssid,
    });
  }
  actions.push({
    type: "fill-secret",
    selector: ssidSecretSel(ssidSlot.index),
    value: config.password,
  });
  // The SSID VAP itself can be disabled while its radio stays on. Bring the
  // VAP's own Enable in line with the requested state before applying.
  if (slotEnabled !== config.enabled) {
    actions.push({ type: "set-vap-enable", index: ssidSlot.index, on: config.enabled });
  }
  actions.push({ type: "apply-ssid", index: ssidSlot.index });

  if (channelChanged) {
    // Channel lives on the radio's basic-config (adconf) form. Open it, pick
    // the channel, and persist via that section's Apply.
    actions.push({ type: "ensure-adconf-open", index: adconfSlot.index });
    actions.push({
      type: "set-channel",
      adconfIndex: adconfSlot.index,
      radioInstId: radioInstId,
      channel: config.channel as number,
    });
  }

  // Let the router persist everything before returning.
  if (actions.length > 0) actions.push({ type: "wait", ms: 2500 });
  return actions;
}

/**
 * Selector of the adconf (radio basic-config) form for a given template index.
 */
export function selectUiChannel(adconfIndex: number): string {
  return `${adconfTemplateSel(adconfIndex)} [id="UI_Channel:${adconfIndex}"]`;
}

/**
 * Execute a concrete action plan against a page view. Used by the driver with
 * the real Playwright page and by unit tests with a recorded double.
 */
export async function executeWifiUpdatePlan(page: WifiUiPage, actions: readonly WifiPlanAction[]): Promise<void> {
  for (const action of actions) {
    switch (action.type) {
      case "wait":
        await page.waitForTimeout(action.ms);
        break;
      case "ensure-ssid-open": {
        const changeArea = page.locator(ssidChangeAreaSel(action.index));
        if (!(await changeArea.isVisible())) {
          await page.locator(`${ssidTemplateSel(action.index)} [class*="collapsibleInst"]`).click();
          await page.waitForTimeout(1200);
        }
        break;
      }
      case "ensure-adconf-open": {
        const changeArea = page.locator(adconfChangeAreaSel(action.index));
        if (!(await changeArea.isVisible())) {
          await page.locator(`${adconfTemplateSel(action.index)} [class*="collapsibleInst"]`).click();
          await page.waitForTimeout(1200);
        }
        break;
      }
      case "toggle-radio":
        await page.locator(action.selector).click();
        break;
      case "set-vap-enable": {
        // Enable radio input value=1 (On), value=0 (Off); check the matching one.
        const selector = `${ssidTemplateSel(action.index)} input[name="Enable:${action.index}"][value="${action.on ? "1" : "0"}"]`;
        await page.locator(selector).click();
        await page.waitForTimeout(800);
        break;
      }
      case "fill":
        await page.locator(action.selector).fill(action.value);
        break;
      case "fill-secret": {
        // Fill the visible password input only. The router's own JS syncs the
        // hidden PostIgnore twin (g_transValueVisableToHidden) and encrypts the
        // plaintext with the session AES key at submit time.
        await page.locator(action.selector).fill(action.value);
        break;
      }
      case "set-channel": {
        await page.locator(selectUiChannel(action.adconfIndex)).selectOption(String(action.channel));
        await page
          .locator(`${adconfTemplateSel(action.adconfIndex)} [id^="Btn_apply_WlanBasicAdConf"]`)
          .click();
        await page.waitForTimeout(1500);
        break;
      }
      case "apply-onoff":
        await page.locator('[id="template_WlanBasicAdOnOff"] [id^="Btn_apply_WlanBasicAdConf"]').click();
        await page.waitForTimeout(1500);
        break;
      case "apply-ssid":
        await page.locator(`${ssidTemplateSel(action.index)} [id^="Btn_apply_WLANSSIDConf"]`).click();
        await page.waitForTimeout(1500);
        break;
    }
  }
}
