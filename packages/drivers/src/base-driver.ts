import type {
  DeviceDTO,
  RouterStatusDTO,
  WifiConfigDTO,
  WifiStatusDTO,
  SystemStatusDTO,
  PONStatusDTO,
  WanConnectionDTO,
} from "@modern-router-management/types/router";

export interface RouterDriver {
  /**
   * Authenticate with the router.
   */
  authenticate(): Promise<boolean>;

  /**
   * Re-authenticate with the router (force fresh login).
   */
  reauthenticate(): Promise<boolean>;

  /**
   * Get basic system status (RouterDriver interface method).
   */
  getSystemStatus(): Promise<RouterStatusDTO>;

  /**
   * Get detailed system status (device info, CPU/memory usage, power-on time).
   */
  getSystemStatusDetailed(): Promise<SystemStatusDTO>;

  /**
   * Get WAN connections status.
   */
  getWANStatus(): Promise<WanConnectionDTO[]>;

  /**
   * Get PON optical module status.
   */
  getPONStatus(): Promise<PONStatusDTO>;

  /**
   * Get connected devices.
   */
  getConnectedDevices(): Promise<DeviceDTO[]>;

  /**
   * Update WiFi settings.
   */
  updateWifiSettings(config: WifiConfigDTO): Promise<void>;

  /**
   * Get current WiFi status (per-band SSID, enable state, channel, security).
   */
  getWifiStatus(): Promise<WifiStatusDTO>;

  /**
   * Submit/Apply internet settings.
   */
  submitInternet(): Promise<void>;

  /**
   * Reboot the router.
   */
  reboot(): Promise<void>;

  /**
   * Reset authentication state.
   */
  resetAuthentication(): void;

  /**
   * Close the driver and cleanup resources.
   */
  close(): Promise<void>;
}
