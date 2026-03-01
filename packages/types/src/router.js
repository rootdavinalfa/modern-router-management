"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routerSummarySchema = exports.routerCreateSchema = exports.routerDriverSchema = exports.routerStatusSchema = exports.deviceSchema = exports.wifiConfigSchema = exports.wifiBandSchema = void 0;
const zod_1 = require("zod");
exports.wifiBandSchema = zod_1.z.enum(["2.4ghz", "5ghz"]);
exports.wifiConfigSchema = zod_1.z.object({
    ssid: zod_1.z.string().min(1),
    password: zod_1.z.string().min(8),
    band: exports.wifiBandSchema,
    enabled: zod_1.z.boolean(),
    channel: zod_1.z.number().int().min(1).max(165),
});
exports.deviceSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    ipAddress: zod_1.z.string().min(1),
    macAddress: zod_1.z.string().min(1),
    connectedAt: zod_1.z.string().min(1),
    connectionType: zod_1.z.enum(["wired", "wireless"]),
    signalStrength: zod_1.z.number().int().min(0).max(100).optional(),
});
exports.routerStatusSchema = zod_1.z.object({
    model: zod_1.z.string().min(1),
    firmware: zod_1.z.string().min(1),
    uptimeSeconds: zod_1.z.number().int().nonnegative(),
    online: zod_1.z.boolean(),
    wanIp: zod_1.z.string().min(1),
    signalStrength: zod_1.z.number().int().min(0).max(100).optional(),
    supports5Ghz: zod_1.z.boolean(),
});
exports.routerDriverSchema = zod_1.z.enum(["zte-f6600p"]);
exports.routerCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    host: zod_1.z.string().min(1).default("192.168.1.1"),
    driver: exports.routerDriverSchema.default("zte-f6600p"),
    username: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1),
});
exports.routerSummarySchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    name: zod_1.z.string().min(1),
    host: zod_1.z.string().min(1),
    driver: exports.routerDriverSchema,
    createdAt: zod_1.z.string().min(1),
});
//# sourceMappingURL=router.js.map