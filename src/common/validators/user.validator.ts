import { z } from "zod";

export const updateUserSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    gender:  z.enum(["MALE", "FEMALE", "OTHERS"]).optional(),
    contact_number: z.string().min(8, "Invalid contact number").optional(),
    blood_type: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]).optional(),
    department_id: z.string().optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(6, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
});

export const updateProfilePicSchema = z.object({profile_url: z.string().url()})
