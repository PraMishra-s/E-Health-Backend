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


export const setLeaveSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  reason: z.string().min(5, { message: "Reason must be at least 5 characters long." }).max(500),
})
.refine((data) => data.end_date > data.start_date, {
  message: "End date must be after the start date.",
  path: ["end_date"],
});

export const changeStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
})

