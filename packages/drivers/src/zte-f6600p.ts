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
  // IPv6 fields
  lla?: string;
  gua?: string;
  dnsV6?: string;
  connectionStatusV6?: string;
  uptimeV6?: string;
  gatewayV6?: string;
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

  async getSystemStatus(): Promise<
    RouterStatusDTO & {
      ponData: Record<string, unknown>;
      wanConnections: WanConnection[];
    }
  > {
    const page = await this.getPage();

    // Navigate to Internet → Status → PON Inform
    await page.getByRole("link", { name: "Internet" }).click();
    await page.getByRole("link", { name: "Status" }).click();
    await page.locator("#ponopticalinfo").click();

    // Wait for PON info panel to load
    await page.waitForSelector("#PonInfoOptical_container", { timeout: 10000 });

    // Extract PON optical module data
    const ponData = await page.evaluate(() => {
      const getEl = (id: string) => document.getElementById(id);
      const getText = (id: string) => getEl(id)?.textContent?.trim() || "";

      return {
        onuState: getText("RegStatus"),
        rxPower: parseFloat(getText("RxPower")) || 0,
        txPower: parseFloat(getText("TxPower")) || 0,
        voltage: parseInt(getText("Volt")) || 0,
        current: parseFloat(getText("Current")) || 0,
        temperature: parseFloat(getText("Temp")) || 0,
      };
    });

    // Click on Ethernet WAN Status
    await page.locator("#ethWanStatus").click();

    // Wait for Ethernet state device container to load
    await page.waitForSelector("#EthStateDev_container", { timeout: 10000 });

    // Extract all WAN connections
    const wanConnections = await page.evaluate(() => {
      const connections: WanConnection[] = [];

      // Find all template_EthStateDev_N divs (N is index)
      const templates = document.querySelectorAll(
        '[id^="template_EthStateDev_"]',
      );

      for (const template of templates) {
        const id = template.id;
        // Skip the hidden template without index
        if (id === "template_EthStateDev") continue;

        const index = id.replace("template_EthStateDev_", "");

        // Helper to get element text by id
        const getText = (fieldId: string) => {
          const el = document.getElementById(`${fieldId}:${index}`);
          return el?.textContent?.trim() || "";
        };

        // Helper to get hidden input value by id
        const getHidden = (fieldId: string) => {
          const el = document.getElementById(
            `${fieldId}:${index}`,
          ) as HTMLInputElement | null;
          return el?.value || "";
        };

        const connStatus = getText("cConnStatus");
        const upTimeText = getText("cUpTime");

        // Parse uptime (format: "72 h 55 min 38 s")
        const hoursMatch = upTimeText.match(/(\d+)\s*h/);
        const minsMatch = upTimeText.match(/(\d+)\s*min/);
        const secsMatch = upTimeText.match(/(\d+)\s*s/);

        const uptimeSeconds =
          (hoursMatch ? parseInt(hoursMatch[1]) * 3600 : 0) +
          (minsMatch ? parseInt(minsMatch[1]) * 60 : 0) +
          (secsMatch ? parseInt(secsMatch[1]) : 0);

        const conn: WanConnection = {
          name: getText("WANCName"),
          type: getText("cRouteMode"),
          ipVersion: getText("cIpMode"),
          nat: getText("cIsNAT"),
          ipAddress: getText("cIPAddress"),
          dns: getText("cDNS"),
          gateway: getText("cGateWay"),
          connectionStatus: connStatus,
          uptime: upTimeText,
          uptimeSeconds,
          disconnectReason: getText("cConnError"),
          macAddress: getText("cWorkIFMac"),
          vlanId: getHidden("VLANID"),
        };

        // IPv6 fields (if available)
        const lla = getText("cLLA");
        const gua = getText("cGuaNum");
        const dnsV6 = getText("cDnsv6");
        const connStatusV6 = getText("cConnStatus6");
        const uptimeV6 = getText("cUpTimeV6");
        const gatewayV6 = getHidden("Gateway6");

        if (lla) conn.lla = lla;
        if (gua) conn.gua = gua;
        if (dnsV6) conn.dnsV6 = dnsV6;
        if (connStatusV6) conn.connectionStatusV6 = connStatusV6;
        if (uptimeV6) conn.uptimeV6 = uptimeV6;
        if (gatewayV6 && gatewayV6 !== "NULL") conn.gatewayV6 = gatewayV6;

        connections.push(conn);
      }

      return connections;
    });

    // Calculate signal strength from optical RX power (typical range: -8 to -28 dBm)
    // Map to 0-100 scale: -8 dBm = 100%, -28 dBm = 0%
    const signalStrength = ponData.rxPower
      ? Math.max(
        0,
        Math.min(100, Math.round(((ponData.rxPower + 28) / 20) * 100)),
      )
      : undefined;

    // Find first connected WAN for primary status
    const connectedWan = wanConnections.find((w) => w.name === "INTERNET");
    const wanIp = connectedWan?.ipAddress?.split("/")[0] || "0.0.0.0";
    const uptimeSeconds = connectedWan?.uptimeSeconds || 0;
    const online = !!connectedWan;

    return {
      model: "ZTE F6600P",
      firmware: "unknown",
      uptimeSeconds,
      online,
      wanIp,
      signalStrength,
      supports5Ghz: true,
      ponData,
      wanConnections,
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
        headless: this.config.headless ?? true,
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
