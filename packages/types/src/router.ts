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
