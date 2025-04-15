"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuidSchema = exports.batchUpdateSchema = exports.transactionSchema = exports.medicineSchema = exports.categorySchema = void 0;
const zod_1 = require("zod");
exports.categorySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(3, { message: "Category name must be at least 3 characters" }).max(50),
});
exports.medicineSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, { message: "Medicine name must be at least 2 characters" }).max(100),
    category_id: zod_1.z.string().uuid({ message: "Invalid category ID" }),
    unit: zod_1.z.string().trim().min(1, { message: "Unit must be at least 1 character" }),
});
exports.transactionSchema = zod_1.z.object({
    medicine_id: zod_1.z.string().uuid({ message: "Invalid medical ID" }).optional(),
    batch_id: zod_1.z.string().uuid({ message: "Invalid batch ID" }).optional(),
    batch_name: zod_1.z.string().optional(),
    quantity: zod_1.z.number().int().positive({ message: "Quantity must be a positive integer" }).optional(),
    expiry_date: zod_1.z.coerce.date().min(new Date(), { message: "Expiry date must be in the future" }).optional(),
    type: zod_1.z.enum(["ADDED", "USED_FOR_PATIENT", "REMOVED"]).optional(),
    reason: zod_1.z.string().min(3, { message: "Reason must be at least 3 characters long" }),
    patient_id: zod_1.z.string().uuid().nullable().optional(), // Only for "USED_FOR_PATIENT"
    family_member_id: zod_1.z.string().uuid().nullable().optional(),
}).refine((data) => {
    if (data.type === "USED_FOR_PATIENT" && !data.patient_id) {
        return false;
    }
    return true;
}, {
    message: "Patient ID is required when using medicine for a patient",
    path: ["patient_id"],
});
exports.batchUpdateSchema = zod_1.z.object({
    batch_name: zod_1.z.string().trim().min(1, { message: "Batch name must be at least 1 character." }).optional(),
    quantity: zod_1.z.number().min(1, { message: "Quantity must be at least 1." }).optional(),
    expiry_date: zod_1.z.coerce.date().min(new Date(), { message: "Expiry date must be in the future." }).optional(),
});
exports.uuidSchema = zod_1.z.string().uuid({ message: "Invalid UUID format." });
