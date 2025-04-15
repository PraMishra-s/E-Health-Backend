"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfilePicSchema = exports.changePasswordSchema = exports.changeUserTypeSchema = exports.updateUserSchema = void 0;
const zod_1 = require("zod");
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").optional(),
    gender: zod_1.z.enum(["MALE", "FEMALE", "OTHERS"]).optional(),
    contact_number: zod_1.z.string().min(8, "Invalid contact number").optional(),
    blood_type: zod_1.z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]).optional(),
    department_id: zod_1.z.string().optional(),
});
exports.changeUserTypeSchema = zod_1.z.object({
    type: zod_1.z.enum(["STUDENT", "STAFF", "DEAN", "NON-STAFF", "HA"]),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(6, "Current password is required."),
    newPassword: zod_1.z.string().min(8, "New password must be at least 8 characters."),
});
exports.updateProfilePicSchema = zod_1.z.object({ profile_url: zod_1.z.string().url() });
