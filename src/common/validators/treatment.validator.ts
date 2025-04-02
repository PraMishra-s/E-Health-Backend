import { z } from "zod";
import { uuidSchema } from "./inventory.validator";



export const createTreatmentSchema = z.object({
    patient_id: uuidSchema.nullable().optional(),
    family_member_id: uuidSchema.nullable().optional(),
    illness_ids: z.array(uuidSchema),
    severity: z.enum(["MILD", "MODERATE", "SEVERE"]),
    notes: z.string().max(500).optional(),
    blood_pressure: z.string().optional(),
    forward_to_hospital: z.boolean().optional(),
    forwarded_by_hospital: z.boolean().optional(),
    medicines: z.array(
        z.object({
            medicine_id: uuidSchema,
            batch_id: uuidSchema.optional(),
            dosage: z.string().max(255),
        })
    ).optional(),
});

export const updateTreatmentSchema = z.object({
    illness_id: uuidSchema.optional(),
    severity: z.enum(["MILD", "MODERATE", "SEVERE"]).optional(),
    notes: z.string().max(500).optional(),
});
