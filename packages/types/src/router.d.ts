import { z } from "zod";
export declare const wifiBandSchema: z.ZodEnum<{
    "2.4ghz": "2.4ghz";
    "5ghz": "5ghz";
}>;
export declare const wifiConfigSchema: z.ZodObject<{
    ssid: z.ZodString;
    password: z.ZodString;
    band: z.ZodEnum<{
        "2.4ghz": "2.4ghz";
        "5ghz": "5ghz";
    }>;
    enabled: z.ZodBoolean;
    channel: z.ZodNumber;
}, z.core.$strip>;
export type WifiConfigDTO = z.infer<typeof wifiConfigSchema>;
export declare const deviceSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    ipAddress: z.ZodString;
    macAddress: z.ZodString;
    connectedAt: z.ZodString;
    connectionType: z.ZodEnum<{
        wired: "wired";
        wireless: "wireless";
    }>;
    signalStrength: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type DeviceDTO = z.infer<typeof deviceSchema>;
export declare const routerStatusSchema: z.ZodObject<{
    model: z.ZodString;
    firmware: z.ZodString;
    uptimeSeconds: z.ZodNumber;
    online: z.ZodBoolean;
    wanIp: z.ZodString;
    signalStrength: z.ZodOptional<z.ZodNumber>;
    supports5Ghz: z.ZodBoolean;
}, z.core.$strip>;
export type RouterStatusDTO = z.infer<typeof routerStatusSchema>;
export declare const routerDriverSchema: z.ZodEnum<{
    "zte-f6600p": "zte-f6600p";
}>;
export declare const routerCreateSchema: z.ZodObject<{
    name: z.ZodString;
    host: z.ZodDefault<z.ZodString>;
    driver: z.ZodDefault<z.ZodEnum<{
        "zte-f6600p": "zte-f6600p";
    }>>;
    username: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type RouterCreateDTO = z.infer<typeof routerCreateSchema>;
export declare const routerSummarySchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    host: z.ZodString;
    driver: z.ZodEnum<{
        "zte-f6600p": "zte-f6600p";
    }>;
    createdAt: z.ZodString;
}, z.core.$strip>;
export type RouterSummaryDTO = z.infer<typeof routerSummarySchema>;
