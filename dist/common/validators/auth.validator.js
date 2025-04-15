"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.verificationEmailSchema = exports.loginSchema = exports.registrationSchema = exports.PROGRAMME_ID_ENUM = exports.roleEnum = exports.userTypeEnum = exports.bloodTypeEnum = exports.genderEnum = exports.verificationCodeSchema = exports.passwordSchema = exports.emailSchema = void 0;
const zod_1 = require("zod");
exports.emailSchema = zod_1.z.string().trim().email().min(1).max(255).regex(/^[a-zA-Z0-9._%+-]+@rub\.edu\.bt$/, "Email must be from @rub.edu.bt domain");
exports.passwordSchema = zod_1.z.string().trim().min(6).max(255);
exports.verificationCodeSchema = zod_1.z.string().trim().min(1).max(25);
exports.genderEnum = zod_1.z.enum(["MALE", "FEMALE", "OTHERS"]);
exports.bloodTypeEnum = zod_1.z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]);
exports.userTypeEnum = zod_1.z.enum(["STUDENT", "STAFF", "DEAN", "NON-STAFF", "HA"]);
exports.roleEnum = zod_1.z.enum(["STUDENT", "STAFF", "DEAN", "HA"]);
exports.PROGRAMME_ID_ENUM = zod_1.z.enum([
    "P01", "P02", "P03", "P04", "P05",
    "P06", "P07", "P08", "P09", "P10", "P11"
]);
exports.registrationSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100),
    student_id: zod_1.z.string().trim().min(8).max(8).optional(),
    email: exports.emailSchema.optional(),
    contact_number: zod_1.z.string().trim().min(8).max(15).regex(/^\d+$/, "Invalid phone number").optional(),
    password: exports.passwordSchema.optional(),
    confirmPassword: exports.passwordSchema.optional(),
    gender: exports.genderEnum,
    blood_type: exports.bloodTypeEnum.optional(),
    department_id: exports.PROGRAMME_ID_ENUM.optional(),
    std_year: zod_1.z.string().trim().max(1).optional(),
    user_type: exports.userTypeEnum,
    role: exports.roleEnum.optional(),
    secret_word: zod_1.z.string().trim().min(6).optional()
}).refine((val) => {
    if (val.password)
        return val.password === val.confirmPassword;
    return true;
}, {
    message: "Password does not match",
    path: ["confirmPassword"],
});
exports.loginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: exports.passwordSchema,
    userAgent: zod_1.z.string().optional()
});
exports.verificationEmailSchema = zod_1.z.object({
    code: exports.verificationCodeSchema
});
exports.resetPasswordSchema = zod_1.z.object({
    password: exports.passwordSchema,
    verificationCode: exports.verificationCodeSchema
});
