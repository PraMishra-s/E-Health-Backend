import { z } from "zod";
import { emailSchema } from "./auth.validator";

export const fogotPasswordSchema = z.object({
    email: emailSchema,
    secret_word: z.string().trim().nonempty().min(6)
})
export const changeSecretWordSchema = z.object({
    currentSecret: z.string().min(6, "Current secret is required."),
    newSecret: z.string().min(6, "New secret must be at least 6 characters."),
});
