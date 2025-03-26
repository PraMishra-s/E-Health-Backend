import { z } from "zod";
import { RELATION_ENUM } from "../../database/schema/schema";


export const staffFamilySchema = z.object({
    name: z.string().min(1, "Name is required"),
    staff_id: z.string().uuid(),
    gender: z.enum(["MALE", "FEMALE", "OTHERS"]),
    contact_number: z.string().length(8).optional(),
    relation: z.enum(["CHILD", "SPOUSE", "PARENT", "SIBLING", "OTHER"]),
    date_of_birth: z.string()
    .transform((str) => new Date(str))
    .optional()
    .refine((date) => date && !isNaN(date.getTime()), {
        message: "Invalid date format"
    })
});

export const updateStaffFamilySchema = staffFamilySchema.partial();
