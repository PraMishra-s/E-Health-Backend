"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStaffFamilySchema = exports.staffFamilySchema = void 0;
const zod_1 = require("zod");
const auth_validator_1 = require("./auth.validator");
exports.staffFamilySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    staff_id: zod_1.z.string().uuid(),
    gender: zod_1.z.enum(["MALE", "FEMALE", "OTHERS"]),
    contact_number: zod_1.z.string().length(8).optional(),
    relation: zod_1.z.enum(["CHILD", "SPOUSE", "PARENT", "SIBLING", "OTHER"]),
    blood_type: auth_validator_1.bloodTypeEnum.optional(),
    date_of_birth: zod_1.z.string()
        .transform((str) => new Date(str))
        .optional()
        .refine((date) => date && !isNaN(date.getTime()), {
        message: "Invalid date format"
    })
});
exports.updateStaffFamilySchema = exports.staffFamilySchema.partial();
