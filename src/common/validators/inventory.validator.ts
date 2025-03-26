import { z } from "zod";

export const categorySchema = z.object({
    name: z.string().trim().min(3, { message: "Category name must be at least 3 characters" }).max(50),
});

export const medicineSchema = z.object({
    name: z.string().trim().min(2, { message: "Medicine name must be at least 2 characters" }).max(100),
    category_id: z.string().uuid({ message: "Invalid category ID" }),
    unit: z.string().trim().min(1, { message: "Unit must be at least 1 character"}),
});

export const transactionSchema = z.object({
    medicine_id: z.string().uuid({ message: "Invalid medical ID" }).optional(),
    batch_id: z.string().uuid({ message: "Invalid batch ID" }).optional(),
    batch_name: z.string().optional(),
    quantity: z.number().int().positive({ message: "Quantity must be a positive integer" }).optional(),
    expiry_date: z.coerce.date().min(new Date(), { message: "Expiry date must be in the future" }).optional(),
    type: z.enum(["ADDED", "USED_FOR_PATIENT", "REMOVED"]).optional(),
    reason: z.string().min(3, { message: "Reason must be at least 3 characters long" }),
    patient_id: z.string().uuid().nullable().optional(), // Only for "USED_FOR_PATIENT"
    family_member_id: z.string().uuid().nullable().optional(),
}).refine((data) => {
    if (data.type === "USED_FOR_PATIENT" && !data.patient_id) {
        return false;
    }
    return true;
}, {
    message: "Patient ID is required when using medicine for a patient",
    path: ["patient_id"],
});

export const batchUpdateSchema = z.object({
    batch_name: z.string().trim().min(1, { message: "Batch name must be at least 1 character." }).optional(),
    quantity: z.number().min(1, { message: "Quantity must be at least 1." }).optional(),
    expiry_date: z.coerce.date().min(new Date(), { message: "Expiry date must be in the future." }).optional(),
});
export const uuidSchema = z.string().uuid({ message: "Invalid UUID format." });


