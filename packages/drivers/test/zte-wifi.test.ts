/**
 * Unit tests for the ZTE F6600P WiFi status read + settings apply.
 *
 * NOTE: All HTML/XML fixtures below are SYNTHETIC, hand-built to mirror the
 * shapes captured from a live ZTE F6600P (2026-09-09):
 *  - menuData GET `wlan_wlansssidconf_lua.lua` → `<OBJ_WLANAP_ID><Instance>`
 *    blocks with `Enable`, `ESSID`, `WLANViewName` (`DEV.WIFI.RD1` = 2.4GHz,
 *    `DEV.WIFI.RD2` = 5GHz), `BeaconType`, `WPAAuthMode`, `WPA3AuthMode`.
 *  - menuData GET `wlan_wlanbasiconoff_lua.lua` → `<OBJ_WLANSETTING_ID>`
 *    instances (`DEV.WIFI.RD1`/`DEV.WIFI.RD2`) with `Band` + `RadioStatus`.
 *  - menuData GET `wlan_wlanbasicadconf_lua.lua` → `<OBJ_WLANSETTING_ID>`
 *    instances with `Channel`, `Standard`, `Band`.
 *  - The wlanBasic menuView renders one SSID form per AP instance with
 *    `[id^=template_WLANSSIDConf_]`, a `:N`-suffixed ChangeArea containing
 *    `Enable` radios (value 1=On / 0=Off), an `ESSID` text input, hidden
 *    `WLANViewName`, and per-section Apply (`Btn_apply_...`) / Cancel buttons.
 *
 * No browser (chromium) is launched in these tests: they exercise the pure
 * parse helpers and the page-action plan against recorded page doubles.
 */
import { describe, expect, test } from "bun:test";
import {
  type WifiConfigDTO,
  wifiConfigSchema,
  wifiStatusSchema,
} from "@modern-router-management/types/router";
import {
  executeWifiUpdatePlan,
  parseRadioStatusForBand,
  parseWlanRadioInstances,
  parseWlanSsidInstances,
  buildWifiStatus,
  planWifiSettingsUpdate,
  ssidChangeAreaSel,
  ssidSecretSel,
  type WifiPageState,
  type WifiPlanAction,
  type WifiUiPage,
  type WifiUiLocator,
} from "../src/zte-wifi.ts";

// ---------------------------------------------------------------------------
// Synthetic fixtures (documented synthetic — see header)
// ---------------------------------------------------------------------------

const syntheticSsidXml = `<ajax_response_xml_root><IF_ERRORPARAM>SUCC</IF_ERRORPARAM><OBJ_WLANAP_ID>
<Instance><ParaName>_InstID</ParaName><ParaValue>DEV.WIFI.AP1</ParaValue><ParaName>Enable</ParaName><ParaValue>1</ParaValue><ParaName>BeaconType</ParaName><ParaValue>WPA3</ParaValue><ParaName>Alias</ParaName><ParaValue>SSID1</ParaValue><ParaName>ESSID</ParaName><ParaValue>MyHome24</ParaValue><ParaName>WPAAuthMode</ParaName><ParaValue>PSKAuthentication</ParaValue><ParaName>WPA3AuthMode</ParaName><ParaValue>SAEAuthentication</ParaValue><ParaName>WPA3EncryptType</ParaName><ParaValue>AESEncryption</ParaValue><ParaName>WLANViewName</ParaName><ParaValue>DEV.WIFI.RD1</ParaValue></Instance>
<Instance><ParaName>_InstID</ParaName><ParaValue>DEV.WIFI.AP5</ParaValue><ParaName>Enable</ParaName><ParaValue>1</ParaValue><ParaName>BeaconType</ParaName><ParaValue>11i</ParaValue><ParaName>Alias</ParaName><ParaValue>SSID5</ParaValue><ParaName>ESSID</ParaName><ParaValue>MyHome5G</ParaValue><ParaName>11iAuthMode</ParaName><ParaValue>PSKAuthentication</ParaValue><ParaName>11iEncryptType</ParaName><ParaValue>AESEncryption</ParaValue><ParaName>WLANViewName</ParaName><ParaValue>DEV.WIFI.RD2</ParaValue></Instance>
<Instance><ParaName>_InstID</ParaName><ParaValue>DEV.WIFI.AP2</ParaValue><ParaName>Enable</ParaName><ParaValue>0</ParaValue><ParaName>Alias</ParaName><ParaValue>SSID2</ParaValue><ParaName>ESSID</ParaName><ParaValue>SSID2</ParaValue><ParaName>WLANViewName</ParaName><ParaValue>DEV.WIFI.RD1</ParaValue></Instance>
</OBJ_WLANAP_ID><OBJ_WLANSETTING_ID><Instance><ParaName>_InstID</ParaName><ParaValue>DEV.WIFI.RD1</ParaValue><ParaName>Band</ParaName><ParaValue>2.4GHz</ParaValue><ParaName>RadioStatus</ParaName><ParaValue>1</ParaValue></Instance><Instance><ParaName>_InstID</ParaName><ParaValue>DEV.WIFI.RD2</ParaValue><ParaName>Band</ParaName><ParaValue>5GHz</ParaValue><ParaName>RadioStatus</ParaName><ParaValue>1</ParaValue></Instance></OBJ_WLANSETTING_ID></ajax_response_xml_root>`;

const syntheticRadioXml = `<ajax_response_xml_root><IF_ERRORPARAM>SUCC</IF_ERRORPARAM><OBJ_WLANSETTING_ID>
<Instance><ParaName>_InstID</ParaName><ParaValue>DEV.WIFI.RD1</ParaValue><ParaName>Band</ParaName><ParaValue>2.4GHz</ParaValue><ParaName>Channel</ParaName><ParaValue>11</ParaValue><ParaName>Standard</ParaName><ParaValue>b,g,n,ax</ParaValue><ParaName>RadioStatus</ParaName><ParaValue>1</ParaValue></Instance>
<Instance><ParaName>_InstID</ParaName><ParaValue>DEV.WIFI.RD2</ParaValue><ParaName>Band</ParaName><ParaValue>5GHz</ParaValue><ParaName>Channel</ParaName><ParaValue>149</ParaValue><ParaName>Standard</ParaName><ParaValue>a,n,ac,ax</ParaValue><ParaName>RadioStatus</ParaName><ParaValue>1</ParaValue></Instance>
</OBJ_WLANSETTING_ID></ajax_response_xml_root>`;

const syntheticOnOffXml = `<ajax_response_xml_root><OBJ_WLANSETTING_ID>
<Instance><ParaName>_InstID</ParaName><ParaValue>DEV.WIFI.RD1</ParaValue><ParaName>Band</ParaName><ParaValue>2.4GHz</ParaValue><ParaName>RadioStatus</ParaName><ParaValue>1</ParaValue></Instance>
<Instance><ParaName>_InstID</ParaName><ParaValue>DEV.WIFI.RD2</ParaValue><ParaName>Band</ParaName><ParaValue>5GHz</ParaValue><ParaName>RadioStatus</ParaName><ParaValue>0</ParaValue></Instance>
</OBJ_WLANSETTING_ID></ajax_response_xml_root>`;

const only24Xml = `<ajax_response_xml_root><OBJ_WLANAP_ID>
<Instance><ParaName>_InstID</ParaName><ParaValue>DEV.WIFI.AP5</ParaValue><ParaName>Enable</ParaName><ParaValue>1</ParaValue><ParaName>Alias</ParaName><ParaValue>SSID5</ParaValue><ParaName>ESSID</ParaName><ParaValue>Only24Net</ParaValue><ParaName>WLANViewName</ParaName><ParaValue>DEV.WIFI.RD1</ParaValue></Instance>
</OBJ_WLANAP_ID></ajax_response_xml_root>`;

const bandKeyOf = (dto: { bands: Array<{ band: string }> }): string[] => dto.bands.map((b) => b.band);
const bandOf = (dto: { bands: Array<{ band: string }> }, key: string) =>
  dto.bands.find((b) => b.band === key);

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

describe("wifiStatusSchema / wifiConfigSchema validation", () => {
  test("wifiStatusSchema accepts per-band DTO with optional fields omitted", () => {
    const dto = {
      bands: [
        { band: "2.4ghz", enabled: true, ssid: "Home24" },
        { band: "5ghz", enabled: false, ssid: "Home5G", channel: 36, mode: "a,n,ac,ax", security: "WPA3-SAE" },
      ],
    };
    expect(wifiStatusSchema.parse(dto)).toEqual(dto);
  });

  test("wifiStatusSchema rejects an empty band list and unknown band values", () => {
    expect(() => wifiStatusSchema.parse({ bands: [] })).toThrow();
    expect(() =>
      wifiStatusSchema.parse({ bands: [{ band: "6ghz", enabled: true, ssid: "x" }] }),
    ).toThrow();
  });

  test("wifiConfigSchema accepts a valid config", () => {
    const cfg: WifiConfigDTO = {
      band: "2.4ghz",
      enabled: true,
      ssid: "Home24",
      password: "correct-horse",
      channel: 6,
    };
    expect(wifiConfigSchema.parse(cfg)).toEqual(cfg);
  });

  test("wifiConfigSchema rejects short passwords", () => {
    expect(() =>
      wifiConfigSchema.parse({
        band: "2.4ghz",
        enabled: true,
        ssid: "Home24",
        password: "short",
        channel: 6,
      }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Read path: parse + map
// ---------------------------------------------------------------------------

describe("parseWlanSsidInstances / buildWifiStatus (read path)", () => {
  test("parses AP instances with radio linkage", () => {
    const aps = parseWlanSsidInstances(syntheticSsidXml);
    expect(aps).toHaveLength(3);
    expect(aps.find((ap) => ap.alias === "SSID1")).toMatchObject({
      instId: "DEV.WIFI.AP1",
      wlanView: "DEV.WIFI.RD1",
      enabled: true,
      essid: "MyHome24",
      security: "WPA3-SAE",
    });
    expect(aps.find((ap) => ap.alias === "SSID5")).toMatchObject({
      wlanView: "DEV.WIFI.RD2",
      essid: "MyHome5G",
      security: "WPA2-PSK-AES",
    });
  });

  test("maps synthetic SSID + radio XML into WifiStatusDTO bands", () => {
    const dto = buildWifiStatus(syntheticSsidXml, syntheticRadioXml);
    expect(bandKeyOf(dto)).toEqual(["2.4ghz", "5ghz"]);
    expect(bandOf(dto, "2.4ghz")).toEqual({
      band: "2.4ghz",
      enabled: true,
      ssid: "MyHome24",
      channel: 11,
      mode: "b,g,n,ax",
      security: "WPA3-SAE",
    });
    expect(bandOf(dto, "5ghz")).toMatchObject({
      enabled: true,
      ssid: "MyHome5G",
      channel: 149,
      mode: "a,n,ac,ax",
    });
    expect(() => wifiStatusSchema.parse(dto)).not.toThrow();
  });

  test("band enable state comes from the on/off RadioStatus when provided", () => {
    const dto = buildWifiStatus(syntheticSsidXml, syntheticOnOffXml);
    expect(bandOf(dto, "2.4ghz")?.enabled).toBe(true);
    expect(bandOf(dto, "5ghz")?.enabled).toBe(false);
  });

  test("falls back to the SSID Enable flag when no radio XML is available", () => {
    const dto = buildWifiStatus(syntheticSsidXml, "");
    expect(bandOf(dto, "2.4ghz")?.enabled).toBe(true);
    expect(bandOf(dto, "5ghz")?.enabled).toBe(true);
    expect(bandOf(dto, "2.4ghz")?.channel).toBeUndefined();
  });

  test("skips a band with no SSID instance on its radio", () => {
    const dto = buildWifiStatus(only24Xml, "");
    expect(bandKeyOf(dto)).toEqual(["2.4ghz"]);
    expect(bandOf(dto, "2.4ghz")?.ssid).toBe("Only24Net");
  });

  test("parseRadioStatusForBand finds RadioStatus by radio instance", () => {
    expect(parseRadioStatusForBand(syntheticOnOffXml, "DEV.WIFI.RD2")).toBe("0");
    expect(parseRadioStatusForBand(syntheticOnOffXml, "DEV.WIFI.RD1")).toBe("1");
    expect(parseRadioStatusForBand("<xml/>", "DEV.WIFI.RD1")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Apply path: plan building
// ---------------------------------------------------------------------------

describe("planWifiSettingsUpdate (apply path)", () => {
  const state24: WifiPageState = {
    radios: [{ radioInstId: "DEV.WIFI.RD1", band: "2.4GHz", rowIndex: 0, on: false }],
    ssids: [
      { index: 0, instId: "DEV.WIFI.AP1", wlanView: "DEV.WIFI.RD1", alias: "SSID1", enabled: true, ssid: "Old24" },
      { index: 1, instId: "DEV.WIFI.AP2", wlanView: "DEV.WIFI.RD1", alias: "SSID2", enabled: false, ssid: "SSID2" },
    ],
    adconf: [{ index: 0, instId: "DEV.WIFI.RD1", band: "2.4GHz", channel: 1 }],
  };
  const state5: WifiPageState = {
    radios: [{ radioInstId: "DEV.WIFI.RD2", band: "5GHz", rowIndex: 1, on: true }],
    ssids: [{ index: 4, instId: "DEV.WIFI.AP5", wlanView: "DEV.WIFI.RD2", alias: "SSID5", enabled: true, ssid: "Old5" }],
    adconf: [{ index: 1, instId: "DEV.WIFI.RD2", band: "5GHz", channel: 149 }],
  };

  const kinds = (actions: readonly WifiPlanAction[]): string[] => actions.map((a) => a.type);

  test("2.4GHz config (radio off, ssid/password/channel changed) plans radio-on, ssid apply, channel set", () => {
    const cfg: WifiConfigDTO = {
      band: "2.4ghz",
      enabled: true,
      ssid: "NewSSID24",
      password: "newpass24",
      channel: 6,
    };
    const actions = planWifiSettingsUpdate(cfg, state24);

    expect(kinds(actions)).toEqual([
      "toggle-radio",
      "apply-onoff",
      "ensure-ssid-open",
      "fill",
      "fill-secret",
      "apply-ssid",
      "ensure-adconf-open",
      "set-channel",
      "wait",
    ]);
    expect(actions).toContainEqual({
      type: "toggle-radio",
      selector: '[id="template_WlanBasicAdOnOff"] [id="RadioStatus0_0"]',
      targetOn: true,
    });
    expect(actions).toContainEqual({ type: "apply-onoff" });
    expect(actions).toContainEqual({
      type: "fill",
      selector: '[id="template_WLANSSIDConf_0"] [id="ESSID:0"]',
      value: "NewSSID24",
    });
    expect(actions).toContainEqual({
      type: "fill-secret",
      selector: ssidSecretSel(0),
      value: "newpass24",
    });
    expect(actions).toContainEqual({
      type: "set-channel",
      adconfIndex: 0,
      radioInstId: "DEV.WIFI.RD1",
      channel: 6,
    });
    expect(actions).toContainEqual({ type: "apply-ssid", index: 0 });
    // Never touches the 5GHz slot (index 4) or the 5GHz radio row (1)
    expect(actions.some((a) => "index" in a && (a as { index?: number }).index === 4)).toBe(false);
  });

  test("5GHz config targets the first SSID form of the 5GHz radio and re-enables a disabled VAP", () => {
    const cfg: WifiConfigDTO = {
      band: "5ghz",
      enabled: true,
      ssid: "New5G",
      password: "password5",
      channel: 36,
    };
    // radio row is ON but the primary SSID VAP is OFF -> plan must enable VAP
    const disabledVapState5: WifiPageState = {
      ...state5,
      ssids: [{ index: 4, instId: "DEV.WIFI.AP5", wlanView: "DEV.WIFI.RD2", alias: "SSID5", enabled: false, ssid: "Old5" }],
    };
    const actions = planWifiSettingsUpdate(cfg, disabledVapState5);

    expect(actions).toContainEqual({ type: "ensure-ssid-open", index: 4 });
    expect(actions).toContainEqual({
      type: "fill",
      selector: '[id="template_WLANSSIDConf_4"] [id="ESSID:4"]',
      value: "New5G",
    });
    expect(actions).toContainEqual({ type: "set-vap-enable", index: 4, on: true });
    expect(actions).toContainEqual({ type: "apply-ssid", index: 4 });
    expect(actions).toContainEqual({
      type: "set-channel",
      adconfIndex: 1,
      radioInstId: "DEV.WIFI.RD2",
      channel: 36,
    });
    // no radio toggle: the 5GHz radio is already ON
    expect(kinds(actions)).not.toContain("toggle-radio");
  });

  test("identical target state yields a minimal plan with no radio toggle or channel select", () => {
    const cfg: WifiConfigDTO = {
      band: "5ghz",
      enabled: true,
      ssid: "Old5",
      password: "password5",
      channel: 149,
    };
    const actions = planWifiSettingsUpdate(cfg, state5);
    expect(kinds(actions)).not.toContain("toggle-radio");
    expect(kinds(actions)).not.toContain("set-channel");
    // The config passphrase is always applied (cannot diff encrypted current).
    expect(kinds(actions)).toContain("fill-secret");
    expect(kinds(actions)).toContain("apply-ssid");
  });

  test("rejects a band whose radio row is missing from the page", () => {
    const cfg: WifiConfigDTO = {
      band: "5ghz",
      enabled: true,
      ssid: "Nope",
      password: "password5",
      channel: 149,
    };
    expect(() => planWifiSettingsUpdate(cfg, state24)).toThrow(/DEV\.WIFI\.RD2/);
  });

  test("rejects a band whose SSID form is missing from the page", () => {
    const cfg: WifiConfigDTO = {
      band: "5ghz",
      enabled: true,
      ssid: "Nope",
      password: "password5",
      channel: 149,
    };
    const noSsid5: WifiPageState = {
      ...state5,
      ssids: state5.ssids.filter((s) => s.wlanView !== "DEV.WIFI.RD2"),
    };
    expect(() => planWifiSettingsUpdate(cfg, noSsid5)).toThrow(/SSID form.*5GHz|DEV\.WIFI\.RD2/);
  });
});

// ---------------------------------------------------------------------------
// Apply path: plan execution against a recorded page double
// ---------------------------------------------------------------------------

const selectorOf = (action: { selector?: string }): string => action.selector ?? "";

/** Playwright-like Page double recording every interaction it receives. */
function makePageDouble() {
  const interactions: string[] = [];
  const visibleOverrides = new Map<string, boolean>();

  const locator = (selector: string): WifiUiLocator => ({
    async click() {
      interactions.push(`click ${selector}`);
    },
    async fill(value: string) {
      interactions.push(`fill ${selector} = ${value}`);
    },
    async selectOption(value: string) {
      interactions.push(`select ${selector} = ${value}`);
    },
    async isVisible() {
      return visibleOverrides.get(selector) ?? true;
    },
  });

  const page: WifiUiPage = {
    locator,
    async waitForTimeout(ms: number) {
      interactions.push(`wait ${ms}`);
    },
  };
  return { page, interactions, visibleOverrides };
}

describe("executeWifiUpdatePlan (recorded page double)", () => {
  test("opens collapsed forms, fills the visible secret input, applies", async () => {
    const { page, interactions, visibleOverrides } = makePageDouble();
    // pretend both ChangeAreas are collapsed so the executor must open them
    visibleOverrides.set(ssidChangeAreaSel(0), false);
    visibleOverrides.set('[id="template_WlanBasicAdConf_0"] .ChangeArea', false);

    const plan: WifiPlanAction[] = [
      { type: "ensure-adconf-open", index: 0 },
      { type: "ensure-ssid-open", index: 0 },
      { type: "fill", selector: '[id="template_WLANSSIDConf_0"] [id="ESSID:0"]', value: "NewNet" },
      { type: "fill-secret", selector: ssidSecretSel(0), value: "secretpw1" },
      { type: "apply-ssid", index: 0 },
    ];
    await executeWifiUpdatePlan(page, plan);

    expect(interactions).toContain(
      "click [id=\"template_WlanBasicAdConf_0\"] [class*=\"collapsibleInst\"]",
    );
    expect(interactions).toContain('click [id="template_WLANSSIDConf_0"] [class*="collapsibleInst"]');
    expect(interactions).toContain('fill [id="template_WLANSSIDConf_0"] [id="ESSID:0"] = NewNet');
    expect(interactions).toContain(
      `fill ${selectorOf({ selector: ssidSecretSel(0) })} = secretpw1`,
    );
    expect(interactions).toContain('click [id="template_WLANSSIDConf_0"] [id^="Btn_apply_WLANSSIDConf"]');
    expect(interactions).toContain("wait 1500");
  });

  test("does not click openers when the change areas are already visible", async () => {
    const { page, interactions } = makePageDouble();
    const plan: WifiPlanAction[] = [
      { type: "ensure-ssid-open", index: 0 },
      { type: "fill-secret", selector: ssidSecretSel(0), value: "secretpw1" },
    ];
    await executeWifiUpdatePlan(page, plan);
    expect(interactions).not.toContain('click [id="template_WLANSSIDConf_0"] [class*="collapsibleInst"]');
    expect(interactions.filter((i) => i.startsWith("fill"))).toHaveLength(1);
  });
});
