import { z } from "zod";

export const wifiBandSchema = z.enum(["2.4ghz", "5ghz"]);

export const wifiConfigSchema = z.object({
  ssid: z.string().min(1),
  password: z.string().min(8),
  band: wifiBandSchema,
  enabled: z.boolean(),
  channel: z.number().int().min(1).max(165),
});

export type WifiConfigDTO = z.infer<typeof wifiConfigSchema>;

export const deviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  ipAddress: z.string().min(1),
  macAddress: z.string().min(1),
  connectedAt: z.string().min(1),
  connectionType: z.enum(["wired", "wireless"]),
  signalStrength: z.number().int().min(0).max(100).optional(),
});

export type DeviceDTO = z.infer<typeof deviceSchema>;

export const routerStatusSchema = z.object({
  model: z.string().min(1),
  firmware: z.string().min(1),
  uptimeSeconds: z.number().int().nonnegative(),
  online: z.boolean(),
  wanIp: z.string().min(1),
  signalStrength: z.number().int().min(0).max(100).optional(),
  supports5Ghz: z.boolean(),
});

export type RouterStatusDTO = z.infer<typeof routerStatusSchema>;

export const routerDriverSchema = z.enum(["zte-f6600p"]);

export const routerCreateSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1).default("192.168.1.1"),
  driver: routerDriverSchema.default("zte-f6600p"),
  username: z.string().min(1),
  password: z.string().min(1),
});

export type RouterCreateDTO = z.infer<typeof routerCreateSchema>;

export const routerSummarySchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  host: z.string().min(1),
  driver: routerDriverSchema,
  createdAt: z.string().min(1),
});

export type RouterSummaryDTO = z.infer<typeof routerSummarySchema>;

export const systemStatusSchema = z.object({
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  hardwareVersion: z.string().min(1),
  softwareVersion: z.string().min(1),
  softwareVersionExtent: z.string().min(1),
  bootVersion: z.string().min(1),
  serialNumber: z.string().min(1),
  onuAlias: z.string().min(1),
  verDate: z.string().min(1),
  cpuUsage: z.number().int().min(0).max(100),
  memoryUsage: z.number().int().min(0).max(100),
  powerOnTime: z.number().int().nonnegative(),
});

export type SystemStatusDTO = z.infer<typeof systemStatusSchema>;

export const ponStatusSchema = z.object({
  rxPower: z.number(),
  txPower: z.number(),
  voltage: z.number().int(),
  temperature: z.number(),
  current: z.number(),
  rfTxPower: z.number().int(),
  videoRxPower: z.number().int(),
  onuState: z.string().min(1),
  onuId: z.number().int(),
  losInfo: z.number().int(),
  catvEnable: z.number().int(),
  ponOnTime: z.number().int().nonnegative(),
});

export type PONStatusDTO = z.infer<typeof ponStatusSchema>;

export const wanConnectionSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  ipVersion: z.string().min(1),
  nat: z.string().min(1),
  ipAddress: z.string().min(1),
  dns: z.string().min(1),
  gateway: z.string().min(1),
  connectionStatus: z.string().min(1),
  uptime: z.string().min(1),
  uptimeSeconds: z.number().int().nonnegative(),
  disconnectReason: z.string().min(1),
  macAddress: z.string().min(1),
  vlanId: z.string().min(1),
  isPrivate: z.boolean(),
  lla: z.string().min(1).optional(),
  gua: z.string().min(1).optional(),
  dnsV6: z.string().min(1).optional(),
  connectionStatusV6: z.string().min(1).optional(),
  uptimeV6: z.string().min(1).optional(),
  uptimeV6Seconds: z.number().int().nonnegative().optional(),
  gatewayV6: z.string().min(1).optional(),
});

export type WanConnectionDTO = z.infer<typeof wanConnectionSchema>;
