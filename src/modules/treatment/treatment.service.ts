import { BadRequestException, NotFoundException } from "../../common/utils/catch-errors";
import { db } from "../../database/drizzle";
import { illnesses, inventory_transactions, medicines, patient_treatment_history, staff_family_members, treatment_illnesses, treatment_medicines, users } from "../../database/schema/schema";
import { desc, eq, sql } from "drizzle-orm";

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

   public async getAllTreatment(){
    return await db
      .select({
        treatmentId: patient_treatment_history.id,
        patientId: patient_treatment_history.patient_id,
        familyMemberId: patient_treatment_history.family_member_id,
        doctorId: patient_treatment_history.doctor_id,
        severity: patient_treatment_history.severity,
        notes: patient_treatment_history.notes,
        createdAt: patient_treatment_history.created_at,
        patientName: sql`
          COALESCE(
            ${users.name}, 
            ${staff_family_members.name}
          )
        `,
        patientGender: sql`
          COALESCE(
            ${users.gender}, 
            ${staff_family_members.gender}
          )
        `,
        patientBloodType: sql`
          COALESCE(
            ${users.blood_type}, 
            ${staff_family_members.blood_type}
          )
        `,
        patientContactNumber: sql`
          COALESCE(
            ${users.contact_number}, 
            ${staff_family_members.contact_number}
          )
        `,
        patientDateOfBirth: sql`
          COALESCE(
            ${users.date_of_birth}, 
            ${staff_family_members.date_of_birth}
          )
        `,
        patientType: sql`
          CASE 
            WHEN ${users.id} IS NOT NULL THEN 'PATIENT'
            WHEN ${staff_family_members.id} IS NOT NULL THEN 'FAMILY_MEMBER'
            ELSE 'UNKNOWN'
          END
        `,
        medicines: sql`(
          SELECT json_agg(json_build_object(
            'medicineId', ${medicines.id},
            'medicineName', ${medicines.name},
            'medicineCount', COALESCE(
              (
                SELECT SUM(${inventory_transactions.change})
                FROM ${inventory_transactions}
                WHERE 
                  ${inventory_transactions.medicine_id} = ${medicines.id} AND
                  (${inventory_transactions.patient_id} = ${patient_treatment_history.patient_id} OR
                   ${inventory_transactions.family_member_id} = ${patient_treatment_history.family_member_id}) AND
                  ${inventory_transactions.type} = 'USED_FOR_PATIENT'
              ), 
              0
            )
          ))
          FROM ${treatment_medicines}
          LEFT JOIN ${medicines} ON ${treatment_medicines.medicine_id} = ${medicines.id}
          WHERE ${treatment_medicines.treatment_id} = ${patient_treatment_history.id}
        )`,
        illnesses: sql`(
          SELECT json_agg(json_build_object(
            'illnessId', ${illnesses.id},
            'illnessName', ${illnesses.name},
            'illnessType', ${illnesses.type},
            'illnessDescription', ${illnesses.description}
          ))
          FROM ${treatment_illnesses}
          LEFT JOIN ${illnesses} ON ${treatment_illnesses.illness_id} = ${illnesses.id}
          WHERE ${treatment_illnesses.treatment_id} = ${patient_treatment_history.id}
        )`,
        medicinesUsedCount: sql`(
          SELECT COALESCE(SUM(${inventory_transactions.change}), 0)
          FROM ${inventory_transactions}
          WHERE 
            (${inventory_transactions.patient_id} = ${patient_treatment_history.patient_id} OR
            ${inventory_transactions.family_member_id} = ${patient_treatment_history.family_member_id})
            AND ${inventory_transactions.type} = 'USED_FOR_PATIENT'
        )`,
      })
      .from(patient_treatment_history)
      .leftJoin(users, eq(users.id, patient_treatment_history.patient_id))
      .leftJoin(
        staff_family_members, 
        eq(staff_family_members.id, patient_treatment_history.family_member_id)
      )
      .orderBy(desc(patient_treatment_history.created_at));
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