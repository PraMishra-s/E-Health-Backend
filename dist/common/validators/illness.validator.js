"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateIllnessCategorySchema = exports.createIllnessCategorySchema = exports.updateIllnessSchema = exports.illnessSchema = void 0;
const zod_1 = require("zod");
exports.illnessSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(3).max(100),
    type: zod_1.z.enum(["COMMUNICABLE", "NON_COMMUNICABLE"]),
    description: zod_1.z.string().trim().max(500).optional(),
    category_id: zod_1.z.string().uuid().optional(),
});
exports.updateIllnessSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    type: zod_1.z.enum(["COMMUNICABLE", "NON_COMMUNICABLE"]).optional(),
    description: zod_1.z.string().min(1).optional(),
    category_id: zod_1.z.string().uuid().optional(),
});
exports.createIllnessCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Category name is required'),
});
exports.updateIllnessCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Category name is required').optional(),
});
