import { z } from "zod";

export const verifyMFAForLoginSchema = z.object({
    code: z.string().trim().min(1).max(6),
    email: z.string().trim().email().min(1),
    userAgent: z.string().optional(),
})