import { BadRequestException, NotFoundException } from "../../common/utils/catch-errors";
import { db } from "../../database/drizzle";
import { illnesses, inventory_transactions, patient_treatment_history, treatment_illnesses, treatment_medicines } from "../../database/schema/schema";
import { eq, sql } from "drizzle-orm";

export class TreatmentService{
  public async addTreatment(userId: string, data: any) {
      const { patient_id, family_member_id, illness_ids, severity, notes, medicines } = data;

      if (!patient_id && !family_member_id) {
          throw new BadRequestException("Either patient_id or family_member_id is required.");
      }

      if (patient_id && family_member_id) {
          throw new BadRequestException("Only one of patient_id or family_member_id should be provided.");
      }

      const [treatment] = await db.insert(patient_treatment_history).values({
          patient_id: patient_id || null, // College users
          family_member_id: family_member_id || null, // Staff family members
          doctor_id: userId,
          severity,
          notes
      }).returning();

      if (!treatment) throw new BadRequestException("Failed to create treatment record.");

      // ✅ Insert Illnesses associated with the treatment
      const treatmentIllnesses = illness_ids.map((illnessId: string) => ({
          treatment_id: treatment.id,
          illness_id: illnessId,
      }));
      await db.insert(treatment_illnesses).values(treatmentIllnesses);

      // ✅ Insert Prescribed Medicines
      const prescribedMedicines = medicines.map((med: any) => ({
          treatment_id: treatment.id,
          medicine_id: med.medicine_id,
          batch_id: med.batch_id || null,
          dosage: med.dosage,
      }));
      await db.insert(treatment_medicines).values(prescribedMedicines);

      return treatment;
  }


    public async updateTreatment(treatmentId: string, data: any) {
        const [updatedTreatment] = await db
            .update(patient_treatment_history)
            .set(data)
            .where(eq(patient_treatment_history.id, treatmentId))
            .returning();

        if (!updatedTreatment) throw new NotFoundException("Treatment record not found.");
        return updatedTreatment;
    }


    public async getPatientTreatments(patientId: string) {
        return await db
            .select()
            .from(patient_treatment_history)
            .where(eq(patient_treatment_history.patient_id, patientId));
    }


   public async getTreatmentById(treatmentId: string) {
    const treatment = await db
      .select({
        id: patient_treatment_history.id,
        patient_id: patient_treatment_history.patient_id,
        doctor_id: patient_treatment_history.doctor_id,
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
        )) FILTER (WHERE treatment_medicines.medicine_id IS NOT NULL)`.as(
          'medicines',
        ),
        illnesses: sql<any>`json_agg(json_build_object(
          'illness_id', treatment_illnesses.illness_id,
          'illness_name', illnesses.name
        )) FILTER (WHERE treatment_illnesses.illness_id IS NOT NULL)`.as(
          'illnesses',
        ),
      })
      .from(patient_treatment_history)
      .leftJoin(
        treatment_medicines,
        eq(patient_treatment_history.id, treatment_medicines.treatment_id),
      )
      .leftJoin(
        inventory_transactions,
        eq(patient_treatment_history.patient_id, inventory_transactions.patient_id),
      )
      .leftJoin(
        treatment_illnesses,
        eq(patient_treatment_history.id, treatment_illnesses.treatment_id),
      )
      .leftJoin(
        illnesses,
        eq(treatment_illnesses.illness_id, illnesses.id),
      )
      .where(eq(patient_treatment_history.id, treatmentId))
      .groupBy(
        patient_treatment_history.id,
      );

    if (!treatment || treatment.length === 0) {
      throw new NotFoundException('Treatment record not found.');
    }
    return treatment[0]; // Return the first element of the array
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