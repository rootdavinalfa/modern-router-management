import { chromium, type Browser, type Page } from "playwright";
import type { RouterDriver } from "./base-driver.ts";
import type {
  DeviceDTO,
  RouterStatusDTO,
  WifiConfigDTO,
} from "@modern-router-management/types/router";

export type ZteF6600pDriverConfig = {
  host: string;
  username: string;
  password: string;
  headless?: boolean;
};

export type WanConnection = {
  name: string;
  type: string;
  ipVersion: string;
  nat: string;
  ipAddress: string;
  dns: string;
  gateway: string;
  connectionStatus: string;
  uptime: string;
  uptimeSeconds: number;
  disconnectReason: string;
  macAddress: string;
  vlanId: string;
  isPrivate: boolean;
  // IPv6 fields
  lla?: string;
  gua?: string;
  dnsV6?: string;
  connectionStatusV6?: string;
  uptimeV6?: string;
  uptimeV6Seconds?: number;
  gatewayV6?: string;
};

export type SystemStatus = {
  manufacturer: string;
  model: string;
  hardwareVersion: string;
  softwareVersion: string;
  softwareVersionExtent: string;
  bootVersion: string;
  serialNumber: string;
  onuAlias: string;
  verDate: string;
  cpuUsage: number;
  memoryUsage: number;
  powerOnTime: number;
};

export type PONStatus = {
  rxPower: number;
  txPower: number;
  voltage: number;
  temperature: number;
  current: number;
  rfTxPower: number;
  videoRxPower: number;
  onuState: string;
  onuId: number;
  losInfo: number;
  catvEnable: number;
  ponOnTime: number;
};

export class ZteF6600pDriver implements RouterDriver {
  private browser?: Browser;
  private page?: Page;
  private authenticated = false;
  private authenticationPromise?: Promise<boolean>;

  constructor(private readonly config: ZteF6600pDriverConfig) { }

  /**
   * Initialize authentication. Call this once when the driver is created.
   */
  async authenticate(): Promise<boolean> {
    if (this.authenticated) {
      return true;
    }

    // Prevent concurrent authentication attempts
    if (this.authenticationPromise) {
      return this.authenticationPromise;
    }

    this.authenticationPromise = this.doAuthenticate();
    try {
      return await this.authenticationPromise;
    } finally {
      this.authenticationPromise = undefined;
    }
  }

  private async doAuthenticate(): Promise<boolean> {
    const page = await this.getPage();
    await page.goto(this.getBaseUrl(), { waitUntil: "domcontentloaded" });

    // Check if already logged in by looking for login page elements
    const hasLogin = await page.$("#loginWrapper");
    if (!hasLogin) {
      console.log('[ZteF6600pDriver] Already logged in, checking cookies...');
      const cookies = await page.context().cookies();
      console.log('[ZteF6600pDriver] Cookies on already logged in session:', JSON.stringify(cookies, null, 2));
      this.authenticated = true;
      return true;
    }

    await page.waitForSelector("#loginWrapper", { timeout: 10000 });

    // Use role-based selectors for better resilience to HTML changes
    const usernameField = page.getByRole("textbox", { name: "Username" });
    const passwordField = page.getByRole("textbox", { name: "Password" });
    const loginButton = page.getByRole("button", { name: "Login" });

    // Fill credentials (fill() handles focus automatically)
    await usernameField.fill(this.config.username);
    await passwordField.fill(this.config.password);

    // Click login and wait for navigation
    await Promise.all([
      page
        .waitForNavigation({ waitUntil: "domcontentloaded" })
        .catch(() => null),
      loginButton.click(),
    ]);

    // Wait for page to stabilize after login
    await page.waitForLoadState("networkidle").catch(() => null);

    // Check for login error
    const loginError = await page
      .$eval("#login_error", (node) => {
        const element = node as HTMLElement;
        return getComputedStyle(element).display !== "none";
      })
      .catch(() => false);

    if (loginError) {
      const message = await page
        .$eval("#login_error_span", (node) => node.textContent?.trim())
        .catch(() => "Login failed");
      throw new Error(message || "Login failed");
    }

    // Log cookies after successful login
    const cookies = await page.context().cookies();
    console.log('[ZteF6600pDriver] Cookies after successful login:', JSON.stringify(cookies, null, 2));

    const sidCookie = cookies.find(c => c.name === 'SID');
    if (sidCookie) {
      console.log('[ZteF6600pDriver] SID cookie found:', `${sidCookie.value.substring(0, 20)}...`);
    } else {
      console.log('[ZteF6600pDriver] WARNING: SID cookie NOT found after login!');
    }

    this.authenticated = true;
    return true;
  }

  /**
   * Re-authenticate when an error occurs (e.g., session expired).
   * This forces a fresh login attempt.
   */
  async reauthenticate(): Promise<boolean> {
    this.resetAuthentication();
    return this.authenticate();
  }

  /**
   * Make an authenticated XHR request to a router endpoint.
   * Executes the request within the page context to use the browser's cookies.
   */
  private async makeAuthenticatedRequest(url: string, preflightUrl?: string): Promise<string> {
    const page = await this.getPage();

    // Ensure we're authenticated before making requests
    if (!this.authenticated) {
      console.log('[ZteF6600pDriver] Not authenticated, attempting to authenticate...');
      await this.authenticate();
    }

    console.log('[ZteF6600pDriver] Request URL:', url);

    // Parse URL to get hostname
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Get current URL after navigation
    const currentUrl = page.url();
    console.log('[ZteF6600pDriver] Current page URL:', currentUrl);

    // Get cookies from the page context for logging
    const cookies = await page.context().cookies();
    console.log('[ZteF6600pDriver] All cookies in context:', JSON.stringify(cookies, null, 2));

    // Ensure required ZTE cookies are set
    const requiredCookies = [
      { name: '_TESTCOOKIESUPPORT', value: '1' },
      { name: 'SID', required: true },
    ];

    const cookieNames = cookies.map(c => c.name);
    console.log('[ZteF6600pDriver] Cookie names found:', cookieNames);

    for (const reqCookie of requiredCookies) {
      if ('required' in reqCookie && reqCookie.required && !cookieNames.includes(reqCookie.name)) {
        console.log(`[ZteF6600pDriver] Required cookie ${reqCookie.name} is missing!`);
      }
      const existingCookie = cookies.find(c => c.name === reqCookie.name);
      if (existingCookie) {
        console.log(`[ZteF6600pDriver] ${reqCookie.name} = ${existingCookie.value.substring(0, 20)}...`);
      }
    }

    // Execute fetch within the page context to use browser's cookies automatically
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
    });

    const content = await page.evaluate(async ({ requestUrl, preflightUrl }: { requestUrl: string; preflightUrl: string | null }) => {
      // Make preflight request if provided (required for ZTE router)
      if (preflightUrl) {
        const preflightResponse = await fetch(preflightUrl, {
          headers: {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "x-requested-with": "XMLHttpRequest"
          },
          "method": "GET",
          "mode": "cors",
          "credentials": "include"
        });
        console.log('[ZteF6600pDriver] Preflight response:', preflightResponse.status);
      }

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Fetch failed with status ${response.status}`);
      }

      return response.text();
    }, { requestUrl: url, preflightUrl: preflightUrl || null });

    console.log('[ZteF6600pDriver] Response content:', content);

    return content;
  }

  /**
   * Get system information using direct HTTP endpoint.
   * Returns device info, CPU/memory usage, and power-on time.
   */
  async getSystemStatusDetailed(): Promise<SystemStatus> {
    const timestamp = Date.now();
    const url = `${this.getBaseUrl()}/?_type=menuData&_tag=devmgr_statusmgr_lua.lua&_=${timestamp}`;
    const preflightUrl = `${this.getBaseUrl()}/?_type=menuView&_tag=statusMgr&Menu3Location=0`;

    const content = await this.makeAuthenticatedRequest(url, preflightUrl);
    console.log('[ZteF6600pDriver] System Status XML Response:', content);

    // Parse XML response
    const systemStatus = this.parseSystemStatusXML(content);

    return systemStatus;
  }

  /**
   * Get system status (RouterDriver interface implementation).
   * Combines system, WAN, and PON data for backward compatibility.
   */
  async getSystemStatus(): Promise<RouterStatusDTO> {
    const [systemStatus, wanConnections, ponStatus] = await Promise.all([
      this.getSystemStatusDetailed(),
      this.getWANStatus(),
      this.getPONStatus(),
    ]);

    // Find INTERNET connection for primary status
    const internetConnection = wanConnections.find((w) => w.name === "INTERNET");
    const wanIp = internetConnection?.ipAddress.split("/")[0] || "0.0.0.0";
    const uptimeSeconds = internetConnection?.uptimeSeconds || 0;
    const online = !!internetConnection;

    // Calculate signal strength from optical RX power (typical range: -8 to -28 dBm)
    // Map to 0-100 scale: -8 dBm = 100%, -28 dBm = 0%
    const signalStrength = ponStatus.rxPower
      ? Math.max(
        0,
        Math.min(100, Math.round(((ponStatus.rxPower + 28) / 20) * 100)),
      )
      : undefined;

    return {
      model: systemStatus.model,
      firmware: systemStatus.softwareVersion,
      uptimeSeconds,
      online,
      wanIp,
      signalStrength,
      supports5Ghz: true,
    };
  }

  /**
   * Get WAN information using direct HTTP endpoint.
   * Returns all WAN connections with their status.
   */
  async getWANStatus(): Promise<WanConnection[]> {
    const timestamp = Date.now();
    const url = `${this.getBaseUrl()}/?_type=menuData&_tag=wan_internetstatus_lua.lua&TypeUplink=2&pageType=1&_=${timestamp}`;
    const preflightUrl = `${this.getBaseUrl()}/?_type=menuView&_tag=ethWanStatus&Menu3Location=0&_=${timestamp}`;

    const content = await this.makeAuthenticatedRequest(url, preflightUrl);
    console.log('[ZteF6600pDriver] WAN Status XML Response:', content);

    // Parse XML response
    const wanConnections = this.parseWANStatusXML(content);

    return wanConnections;
  }

  /**
   * Get PON information using direct HTTP endpoint.
   * Returns optical module data and PON registration status.
   */
  async getPONStatus(): Promise<PONStatus> {
    const timestamp = Date.now();
    const url = `${this.getBaseUrl()}/?_type=menuData&_tag=optical_info_lua.lua&_=${timestamp}`;
    const preflightUrl = `${this.getBaseUrl()}/?_type=menuView&_tag=ponopticalinfo&Menu3Location=0&_=${timestamp}`;

    const content = await this.makeAuthenticatedRequest(url, preflightUrl);
    console.log('[ZteF6600pDriver] PON Status XML Response:', content);

    // Parse XML response
    const ponStatus = this.parsePONStatusXML(content);

    return ponStatus;
  }

  /**
   * Parse system status XML response.
   */
  private parseSystemStatusXML(xml: string): SystemStatus {
    // Helper to extract value from XML tag
    const extractValue = (tag: string, defaultValue: string = ""): string => {
      const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, "i");
      const match = xml.match(regex);
      return match ? match[1] : defaultValue;
    };

    // Helper to extract ParaValue by ParaName
    const extractParaValue = (paraName: string, defaultValue: string = ""): string => {
      const regex = new RegExp(`<ParaName>${paraName}</ParaName><ParaValue>([^<]*)</ParaValue>`, "i");
      const match = xml.match(regex);
      return match ? match[1] : defaultValue;
    };

    // Extract device info
    const manufacturer = extractParaValue("ManuFacturer", "ZTE");
    const model = extractParaValue("ModelName", "F6600P");
    const hardwareVersion = extractParaValue("HardwareVer", "");
    const softwareVersion = extractParaValue("SoftwareVer", "");
    const softwareVersionExtent = extractParaValue("SoftwareVerExtent", "");
    const bootVersion = extractParaValue("BootVer", "");
    const serialNumber = extractParaValue("SerialNumber", "");
    const onuAlias = extractParaValue("OnuAlias", "");
    const verDate = extractParaValue("VerDate", "");

    // Extract CPU/Memory usage
    const cpuUsage1 = parseInt(extractParaValue("CpuUsage1", "0"), 10);
    const cpuUsage2 = parseInt(extractParaValue("CpuUsage2", "0"), 10);
    const cpuUsage = (cpuUsage1 + cpuUsage2) / 2;
    const memoryUsage = parseInt(extractParaValue("MemUsage", "0"), 10);

    // Extract power-on time
    const powerOnTime = parseInt(extractParaValue("PowerOnTime", "0"), 10);

    return {
      manufacturer,
      model,
      hardwareVersion,
      softwareVersion,
      softwareVersionExtent,
      bootVersion,
      serialNumber,
      onuAlias,
      verDate,
      cpuUsage,
      memoryUsage,
      powerOnTime,
    };
  }

  /**
   * Parse WAN status XML response.
   */
  private parseWANStatusXML(xml: string): WanConnection[] {
    const connections: WanConnection[] = [];

    // Helper to extract ParaValue by ParaName
    const extractParaValue = (paraName: string, defaultValue: string = ""): string => {
      const regex = new RegExp(`<ParaName>${paraName}</ParaName><ParaValue>([^<]*)</ParaValue>`, "i");
      const match = xml.match(regex);
      return match ? match[1] : defaultValue;
    };

    // Find all Instance blocks within ID_WAN_COMFIG
    const instanceRegex = /<Instance>([\s\S]*?)<\/Instance>/gi;
    const instances = xml.match(instanceRegex) || [];

    // Helper to extract value from Instance XML
    const extractFromInstance = (instanceXml: string, paraName: string, defaultValue: string = ""): string => {
      const regex = new RegExp(`<ParaName>${paraName}</ParaName><ParaValue>([^<]*)</ParaValue>`, "i");
      const match = instanceXml.match(regex);
      return match ? match[1] : defaultValue;
    };

    // Helper function to check if an IP address is private
    const isPrivateIp = (ipWithCidr: string): boolean => {
      const ip = ipWithCidr.split("/")[0];
      const parts = ip.split(".").map((p) => parseInt(p, 10));

      if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
        return false;
      }

      const [a, b, c, d] = parts;

      // 10.0.0.0/8
      if (a === 10) return true;

      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) return true;

      // 192.168.0.0/16
      if (a === 192 && b === 16) return true;

      // 127.0.0.0/8 (loopback)
      if (a === 127) return true;

      // 100.64.0.0/10 (CGNAT)
      if (a === 100 && b >= 64 && b <= 127) return true;

      // 169.254.0.0/16 (link-local)
      if (a === 169 && b === 254) return true;

      return false;
    };

    // Parse uptime string (format: "72 h 55 min 38 s")
    const parseUptimeSeconds = (uptimeText: string): number => {
      const hoursMatch = uptimeText.match(/(\d+)\s*h/);
      const minsMatch = uptimeText.match(/(\d+)\s*min/);
      const secsMatch = uptimeText.match(/(\d+)\s*s/);

      return (
        (hoursMatch ? parseInt(hoursMatch[1]) * 3600 : 0) +
        (minsMatch ? parseInt(minsMatch[1]) * 60 : 0) +
        (secsMatch ? parseInt(secsMatch[1]) : 0)
      );
    };

    for (const instanceXml of instances) {
      // Check if this is a WAN connection instance (has _InstID with IGD.WD pattern)
      const instId = extractFromInstance(instanceXml, "_InstID", "");
      if (!instId.startsWith("IGD.WD")) continue;

      const connStatus = extractFromInstance(instanceXml, "ConnStatus", "");
      const upTimeText = extractFromInstance(instanceXml, "UpTime", "");
      const ipAddress = extractFromInstance(instanceXml, "IPAddress", "");

      const conn: WanConnection = {
        name: extractFromInstance(instanceXml, "WANCName", ""),
        type: extractFromInstance(instanceXml, "mode", ""),
        ipVersion: extractFromInstance(instanceXml, "IpMode", ""),
        nat: extractFromInstance(instanceXml, "IsNAT", ""),
        ipAddress,
        dns: extractFromInstance(instanceXml, "DNS1", ""),
        gateway: extractFromInstance(instanceXml, "GateWay", ""),
        connectionStatus: connStatus,
        uptime: upTimeText,
        uptimeSeconds: parseUptimeSeconds(upTimeText),
        disconnectReason: extractFromInstance(instanceXml, "ConnError", ""),
        macAddress: extractFromInstance(instanceXml, "WorkIFMac", ""),
        vlanId: extractFromInstance(instanceXml, "VLANID", ""),
        isPrivate: isPrivateIp(ipAddress),
      };

      // IPv6 fields (if available)
      const lla = extractFromInstance(instanceXml, "LLA", "");
      const gua = extractFromInstance(instanceXml, "Gua1", "");
      const dnsV6 = extractFromInstance(instanceXml, "Dns1v6", "");
      const connStatusV6 = extractFromInstance(instanceXml, "ConnStatus6", "");
      const uptimeV6 = extractFromInstance(instanceXml, "UpTimeV6", "");
      const gatewayV6 = extractFromInstance(instanceXml, "Gateway6", "");

      if (lla) conn.lla = lla;
      if (gua) conn.gua = gua;
      if (dnsV6) conn.dnsV6 = dnsV6;
      if (connStatusV6) conn.connectionStatusV6 = connStatusV6;
      if (uptimeV6) {
        conn.uptimeV6 = uptimeV6;
        conn.uptimeV6Seconds = parseUptimeSeconds(uptimeV6);
      }
      if (gatewayV6 && gatewayV6 !== "NULL") conn.gatewayV6 = gatewayV6;

      connections.push(conn);
    }

    return connections;
  }

  /**
   * Parse PON status XML response.
   */
  private parsePONStatusXML(xml: string): PONStatus {
    // Helper to extract ParaValue by ParaName
    const extractParaValue = (paraName: string, defaultValue: string = ""): string => {
      const regex = new RegExp(`<ParaName>${paraName}</ParaName><ParaValue>([^<]*)</ParaValue>`, "i");
      const match = xml.match(regex);
      return match ? match[1] : defaultValue;
    };

    const rxPower = parseFloat(extractParaValue("RxPower", "0"));
    const txPower = parseFloat(extractParaValue("TxPower", "0"));
    const voltage = parseInt(extractParaValue("Volt", "0"), 10);
    const temperature = parseFloat(extractParaValue("Temp", "0"));
    const current = parseFloat(extractParaValue("Current", "0"));
    const rfTxPower = parseInt(extractParaValue("RFTxPower", "0"), 10);
    const videoRxPower = parseInt(extractParaValue("VideoRxPower", "0"), 10);
    const onuState = extractParaValue("RegStatus", "");
    const onuId = parseInt(extractParaValue("OnuId", "0"), 10);
    const losInfo = parseInt(extractParaValue("LosInfo", "0"), 10);
    const catvEnable = parseInt(extractParaValue("CatvEnable", "0"), 10);
    const ponOnTime = parseInt(extractParaValue("PONOnTime", "0"), 10);

    return {
      rxPower,
      txPower,
      voltage,
      temperature,
      current,
      rfTxPower,
      videoRxPower,
      onuState,
      onuId,
      losInfo,
      catvEnable,
      ponOnTime,
    };
  }

  async getConnectedDevices(): Promise<DeviceDTO[]> {
    const page = await this.getPage();
    const list = await page.evaluate(() => {
      const w = window as any;
      const candidates =
        w?.connectedDevices ??
        w?.deviceList ??
        w?.hostList ??
        w?.lanHostList ??
        [];

      if (!Array.isArray(candidates)) {
        return [];
      }

      return candidates.map((device: any, index: number) => ({
        id: String(device?.id ?? device?.mac ?? index),
        name: String(device?.name ?? device?.hostname ?? `Device ${index + 1}`),
        ipAddress: String(
          device?.ip ?? device?.ipAddress ?? device?.ipaddr ?? "",
        ),
        macAddress: String(
          device?.mac ?? device?.macAddress ?? device?.macaddr ?? "",
        ),
        connectedAt: String(
          device?.connectedAt ?? device?.time ?? new Date().toISOString(),
        ),
        connectionType: device?.wireless
          ? ("wireless" as const)
          : ("wired" as const),
        signalStrength:
          typeof device?.signal === "number"
            ? device.signal
            : typeof device?.rssi === "number"
              ? device.rssi
              : undefined,
      }));
    });

    return list
      .filter((device) => device.ipAddress || device.macAddress)
      .map((device) => ({
        ...device,
        connectionType:
          device.connectionType === "wireless" ? "wireless" : "wired",
        signalStrength:
          typeof device.signalStrength === "number"
            ? device.signalStrength
            : undefined,
      })) as DeviceDTO[];
  }

  /**
   * Submit/Apply Internet settings by navigating to Internet → WAN and clicking Apply.
   * This is typically used after modifying WAN configuration.
   */
  async submitInternet(): Promise<void> {
    const page = await this.getPage();

    // Navigate to Internet → WAN
    await page.getByRole("link", { name: "Internet" }).click();
    await page.getByRole("link", { name: "WAN" }).click();

    // Wait for WAN configuration page to load
    await page.waitForSelector('[id="instName_Internet:1"]', { timeout: 10000 });

    // Click on the Internet instance to ensure it's selected
    await page.locator('[id="instName_Internet:1"]').click();

    // Click Apply button and wait for the action to complete
    await page.getByRole("button", { name: "Apply" }).click();

    // Wait for apply operation to complete
    await page.waitForLoadState("networkidle").catch(() => null);
    await page.waitForTimeout(2000);
  }

  async updateWifiSettings(_config: WifiConfigDTO): Promise<void> {
    const page = await this.getPage();
  }

  async reboot(): Promise<void> {
    const page = await this.getPage();
  }

  async close(): Promise<void> {
    await this.page?.close();
    await this.browser?.close();
    this.page = undefined;
    this.browser = undefined;
    this.authenticated = false;
  }

  /**
   * Reset authentication state to force re-authentication on next request.
   * Useful when session expires or router reboots.
   */
  resetAuthentication(): void {
    this.authenticated = false;
  }

  private async getPage(): Promise<Page> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: this.config.headless ?? false,
      });
    }

    if (!this.page) {
      this.page = await this.browser.newPage();
    }

    return this.page;
  }

  private getBaseUrl(): string {
    if (this.config.host.startsWith("http")) {
      return this.config.host;
    }

    return `http://${this.config.host}`;
  }
}
