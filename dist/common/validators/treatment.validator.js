"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTreatmentSchema = exports.createTreatmentSchema = void 0;
const zod_1 = require("zod");
const inventory_validator_1 = require("./inventory.validator");
exports.createTreatmentSchema = zod_1.z.object({
    patient_id: inventory_validator_1.uuidSchema.nullable().optional(),
    family_member_id: inventory_validator_1.uuidSchema.nullable().optional(),
    illness_ids: zod_1.z.array(inventory_validator_1.uuidSchema),
    severity: zod_1.z.enum(["MILD", "MODERATE", "SEVERE"]),
    notes: zod_1.z.string().max(500).optional(),
    blood_pressure: zod_1.z.string().optional(),
    forward_to_hospital: zod_1.z.boolean().optional(),
    forwarded_by_hospital: zod_1.z.boolean().optional(),
    medicines: zod_1.z.array(zod_1.z.object({
        medicine_id: inventory_validator_1.uuidSchema,
        batch_id: inventory_validator_1.uuidSchema.optional(),
        dosage: zod_1.z.string().max(255),
    })).optional(),
});
exports.updateTreatmentSchema = zod_1.z.object({
    illness_id: inventory_validator_1.uuidSchema.optional(),
    severity: zod_1.z.enum(["MILD", "MODERATE", "SEVERE"]).optional(),
    notes: zod_1.z.string().max(500).optional(),
});
