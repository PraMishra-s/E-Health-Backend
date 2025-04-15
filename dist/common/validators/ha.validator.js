"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeStatusSchema = exports.setLeaveSchema = exports.changeSecretWordSchema = exports.fogotPasswordSchema = void 0;
const zod_1 = require("zod");
const auth_validator_1 = require("./auth.validator");
exports.fogotPasswordSchema = zod_1.z.object({
    email: auth_validator_1.emailSchema,
    secret_word: zod_1.z.string().trim().nonempty().min(6)
});
exports.changeSecretWordSchema = zod_1.z.object({
    currentSecret: zod_1.z.string().min(6, "Current secret is required."),
    newSecret: zod_1.z.string().min(6, "New secret must be at least 6 characters."),
});
exports.setLeaveSchema = zod_1.z.object({
    start_date: zod_1.z.coerce.date(),
    end_date: zod_1.z.coerce.date(),
    reason: zod_1.z.string().min(5, { message: "Reason must be at least 5 characters long." }).max(500),
})
    .refine((data) => data.end_date > data.start_date, {
    message: "End date must be after the start date.",
    path: ["end_date"],
});
exports.changeStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["ACTIVE", "INACTIVE"]),
});
