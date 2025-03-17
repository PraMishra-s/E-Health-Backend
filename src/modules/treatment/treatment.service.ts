import { BadRequestException, NotFoundException } from "../../common/utils/catch-errors";
import { db } from "../../database/drizzle";
import { inventory_transactions, patient_treatment_history, treatment_medicines } from "../../database/schema/schema";
import { eq, sql } from "drizzle-orm";

export class TreatmentService{
    public async addTreatment(userId: string, data: any) {
        const { patient_id, illness_id, severity, notes, medicines } = data;

        // Create treatment record
        const [treatment] = await db.insert(patient_treatment_history).values({
            patient_id,
            doctor_id: userId,
            illness_id,
            severity,
            notes
        }).returning();

        if (!treatment) throw new BadRequestException("Failed to create treatment record.");

        // Insert prescribed medicines
        const prescribedMedicines = medicines.map((med: any) => ({
            treatment_id: treatment.id,
            medicine_id: med.medicine_id,
            batch_id: med.batch_id || null,
            dosage: med.dosage,
        }));

        await db.insert(treatment_medicines).values(prescribedMedicines);

        return treatment;
    }

    // ✅ Update Treatment
    public async updateTreatment(treatmentId: string, data: any) {
        const [updatedTreatment] = await db
            .update(patient_treatment_history)
            .set(data)
            .where(eq(patient_treatment_history.id, treatmentId))
            .returning();

        if (!updatedTreatment) throw new NotFoundException("Treatment record not found.");
        return updatedTreatment;
    }

    // ✅ Get All Treatments for a Patient
    public async getPatientTreatments(patientId: string) {
        return await db
            .select()
            .from(patient_treatment_history)
            .where(eq(patient_treatment_history.patient_id, patientId));
    }

    // ✅ Get Single Treatment Details
    public async getTreatmentById(treatmentId: string) {
        const treatment = await db
            .select({
                id: patient_treatment_history.id,
                patient_id: patient_treatment_history.patient_id,
                doctor_id: patient_treatment_history.doctor_id,
                illness_id: patient_treatment_history.illness_id,
                severity: patient_treatment_history.severity,
                notes: patient_treatment_history.notes,
                created_at: patient_treatment_history.created_at,

                medicines: sql<any>`json_agg(json_build_object(
                    'medicine_id', treatment_medicines.medicine_id,
                    'batch_id', inventory_transactions.batch_id,
                    'quantity_used', inventory_transactions.change,
                    'transaction_id', inventory_transactions.id,
                    'transaction_type', inventory_transactions.type,
                    'transaction_reason', inventory_transactions.reason
                )) FILTER (WHERE treatment_medicines.medicine_id IS NOT NULL)`.as("medicines")
            })
            .from(patient_treatment_history)
            .leftJoin(treatment_medicines, eq(patient_treatment_history.id, treatment_medicines.treatment_id))
            .leftJoin(inventory_transactions, eq(patient_treatment_history.patient_id, inventory_transactions.patient_id))
            .where(eq(patient_treatment_history.id, treatmentId))
            .groupBy(patient_treatment_history.id);


        if (!treatment) throw new NotFoundException("Treatment record not found.");
        return treatment;
    }

    // ✅ Delete Treatment
    public async deleteTreatment(treatmentId: string) {
        const deleted = await db
            .delete(patient_treatment_history)
            .where(eq(patient_treatment_history.id, treatmentId))
            .returning();

        if (!deleted) throw new NotFoundException("Treatment record not found.");
    }
}