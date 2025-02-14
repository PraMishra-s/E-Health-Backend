import { z } from "zod";


export const emailSchema = z.string().trim().email().min(1).max(255).regex(/^[a-zA-Z0-9._%+-]+@rub\.edu\.bt$/, "Email must be from @rub.edu.bt domain")
export const passwordSchema = z.string().trim().min(6).max(255)

export const genderEnum = z.enum(["MALE", "FEMALE", "OTHERS"]);
export const bloodTypeEnum = z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]);
export const userTypeEnum = z.enum(["STUDENT", "STAFF", "DEAN", "NON-STAFF", "HA"]);
export const roleEnum = z.enum(["STUDENT", "STAFF", "DEAN", "HA"]);
export const PROGRAMME_ID_ENUM = z.enum([
  "P01", "P02", "P03", "P04", "P05",
  "P06", "P07", "P08", "P09", "P10", "P12"
]);

export const registrationSchema = z.object({
    name: z.string().trim().min(2).max(100),
    student_id: z.string().trim().min(8).max(8).optional(), 
    email: emailSchema.optional(), 
    contact_number: z.string().trim().min(8).max(15).regex(/^\d+$/, "Invalid phone number"),
    password: passwordSchema.optional(),
    confirmPassword: passwordSchema.optional(),
    gender: genderEnum,
    blood_type: bloodTypeEnum.optional(),
    department_id: PROGRAMME_ID_ENUM.optional(), 
    std_year: z.string().trim().max(1).optional(), 
    user_type: userTypeEnum, 
    role: roleEnum.optional(), 
}).refine((val) => {
    if (val.password) return val.password === val.confirmPassword; 
    return true;
}, {
    message: "Password does not match",
    path: ["confirmPassword"],
});

export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    userAgent: z.string().optional() 
})
