"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMentalHealthCaseSchema = void 0;
const zod_1 = require("zod");
exports.updateMentalHealthCaseSchema = zod_1.z.object({
    action_taken: zod_1.z.string().min(1, 'Action taken is required'),
    is_resolved: zod_1.z.boolean()
});
