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
export declare const systemStatusSchema: z.ZodObject<{
    manufacturer: z.ZodString;
    model: z.ZodString;
    hardwareVersion: z.ZodString;
    softwareVersion: z.ZodString;
    softwareVersionExtent: z.ZodString;
    bootVersion: z.ZodString;
    serialNumber: z.ZodString;
    onuAlias: z.ZodString;
    verDate: z.ZodString;
    cpuUsage: z.ZodNumber;
    memoryUsage: z.ZodNumber;
    powerOnTime: z.ZodNumber;
}, z.core.$strip>;
export type SystemStatusDTO = z.infer<typeof systemStatusSchema>;
export declare const ponStatusSchema: z.ZodObject<{
    rxPower: z.ZodNumber;
    txPower: z.ZodNumber;
    voltage: z.ZodNumber;
    temperature: z.ZodNumber;
    current: z.ZodNumber;
    rfTxPower: z.ZodNumber;
    videoRxPower: z.ZodNumber;
    onuState: z.ZodString;
    onuId: z.ZodNumber;
    losInfo: z.ZodNumber;
    catvEnable: z.ZodNumber;
    ponOnTime: z.ZodNumber;
}, z.core.$strip>;
export type PONStatusDTO = z.infer<typeof ponStatusSchema>;
export declare const wanConnectionSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodString;
    ipVersion: z.ZodString;
    nat: z.ZodString;
    ipAddress: z.ZodString;
    dns: z.ZodString;
    gateway: z.ZodString;
    connectionStatus: z.ZodString;
    uptime: z.ZodNumber;
    uptimeSeconds: z.ZodNumber;
    disconnectReason: z.ZodString;
    macAddress: z.ZodString;
    vlanId: z.ZodString;
    isPrivate: z.ZodBoolean;
    lla: z.ZodOptional<z.ZodString>;
    gua: z.ZodOptional<z.ZodString>;
    dnsV6: z.ZodOptional<z.ZodString>;
    connectionStatusV6: z.ZodOptional<z.ZodString>;
    uptimeV6: z.ZodOptional<z.ZodNumber>;
    uptimeV6Seconds: z.ZodOptional<z.ZodNumber>;
    gatewayV6: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type WanConnectionDTO = z.infer<typeof wanConnectionSchema>;
