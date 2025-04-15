"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMFAForLoginSchema = void 0;
const zod_1 = require("zod");
exports.verifyMFAForLoginSchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(1).max(6),
    email: zod_1.z.string().trim().email().min(1),
    userAgent: zod_1.z.string().optional(),
});
