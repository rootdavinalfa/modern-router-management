import type {
  DeviceDTO,
  RouterStatusDTO,
  WifiConfigDTO,
} from "@modern-router-management/types/router";

export interface RouterDriver {
  authenticate(): Promise<boolean>;
  getSystemStatus(): Promise<RouterStatusDTO>;
  getConnectedDevices(): Promise<DeviceDTO[]>;
  updateWifiSettings(config: WifiConfigDTO): Promise<void>;
  reboot(): Promise<void>;
}
