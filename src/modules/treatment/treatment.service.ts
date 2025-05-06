import { BadRequestException, NotFoundException } from "../../common/utils/catch-errors";
import { db } from "../../database/drizzle";
import { illness_categories, illnesses, inventory_transactions, medicines, mental_health_cases, patient_treatment_history, staff_family_members, treatment_illnesses, treatment_medicines, users } from "../../database/schema/schema";
import { desc, eq, sql, or, inArray, isNotNull, and } from "drizzle-orm";

export class TreatmentService{
  public async addTreatment(userId: string, data: any) {
    const {
      patient_id,
      family_member_id,
      illness_ids,
      severity,
      notes,
      leave_notes,
      medicines,
      blood_pressure,
      forward_to_hospital,
      forwarded_by_hospital
    } = data;

    if (!patient_id && !family_member_id) {
      throw new BadRequestException("Either patient_id or family_member_id is required.");
    }

    if (patient_id && family_member_id) {
      throw new BadRequestException("Only one of patient_id or family_member_id should be provided.");
    }

    // ✅ Step 1: Create treatment
    const [treatment] = await db.insert(patient_treatment_history).values({
      patient_id: patient_id || null,
      family_member_id: family_member_id || null,
      doctor_id: userId,
      severity,
      notes,
      leave_notes: leave_notes || null,
      blood_pressure: blood_pressure || null,
      forward_to_hospital: forward_to_hospital || false,
      forwarded_by_hospital: forwarded_by_hospital || false
    }).returning();

    if (!treatment) throw new BadRequestException("Failed to create treatment record.");

    // ✅ Step 2: Insert illnesses
    const treatmentIllnesses = illness_ids.map((illnessId: string) => ({
      treatment_id: treatment.id,
      illness_id: illnessId,
    }));
    await db.insert(treatment_illnesses).values(treatmentIllnesses);

    // ✅ Step 3: Insert prescribed medicines
    const prescribedMedicines = medicines.map((med: any) => ({
      treatment_id: treatment.id,
      medicine_id: med.medicine_id,
      batch_id: med.batch_id || null,
      dosage: med.dosage,
    }));
    await db.insert(treatment_medicines).values(prescribedMedicines);

    // ✅ Step 4: Check if any illness is mental health-related
    const [mentalIllness] = await db
      .select({ illness_id: illnesses.id })
      .from(illnesses)
      .leftJoin(illness_categories, eq(illnesses.category_id, illness_categories.id))
      .where(
        and(
          inArray(illnesses.id, illness_ids),
          eq(illness_categories.name, "Mental Health")
        )
      )
      .limit(1);

    // ✅ Step 5: If mental health case found, insert into mental_health_cases
    if (mentalIllness) {
      await db.insert(mental_health_cases).values({
        user_id: patient_id || null,
        family_member_id: family_member_id || null,
        illness_id: mentalIllness.illness_id,
        treatment_id: treatment.id,
        is_resolved: false,
        action_taken: null
      });
    }

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
      // Fetch all family members linked to the staff user (if applicable)
      const familyMembers = await db
          .select({ familyMemberId: staff_family_members.id })
          .from(staff_family_members)
          .where(eq(staff_family_members.staff_id, patientId));

      // Extract family member IDs
      const familyMemberIds = familyMembers.map(fm => fm.familyMemberId);

      return await db
          .select({
              treatmentId: patient_treatment_history.id,
              patientId: patient_treatment_history.patient_id,
              familyMemberId: patient_treatment_history.family_member_id,
              doctorId: patient_treatment_history.doctor_id,
              severity: patient_treatment_history.severity,
              notes: patient_treatment_history.notes,
              leaveNotes: patient_treatment_history.leave_notes,
              bloodPressue: patient_treatment_history.blood_pressure,
              forwardedToHospital: patient_treatment_history.forward_to_hospital,
              forwardedByHospital: patient_treatment_history.forwarded_by_hospital,
              createdAt: patient_treatment_history.created_at,
              patientName: sql`
                COALESCE(${users.name}, ${staff_family_members.name})
              `,
              patientGender: sql`
                COALESCE(${users.gender}, ${staff_family_members.gender})
              `,
              patientBloodType: sql`
                COALESCE(${users.blood_type}, ${staff_family_members.blood_type})
              `,
              patientContactNumber: sql`
                COALESCE(${users.contact_number}, ${staff_family_members.contact_number})
              `,
              patientDateOfBirth: sql`
                COALESCE(${users.date_of_birth}, ${staff_family_members.date_of_birth})
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
          .where(
              or(
                  eq(patient_treatment_history.patient_id, patientId), // Staff's own treatments
                  familyMemberIds.length > 0 ? inArray(patient_treatment_history.family_member_id, familyMemberIds) : undefined // Family members' treatments
              )
          )
          .orderBy(desc(patient_treatment_history.created_at));
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
        leaveNotes: patient_treatment_history.leave_notes,
        bloodPressue: patient_treatment_history.blood_pressure,
        forwardedToHospital: patient_treatment_history.forward_to_hospital,
        forwardedByHospital: patient_treatment_history.forwarded_by_hospital,
        createdAt: patient_treatment_history.created_at,
        departmentId: sql`COALESCE(${users.department_id}, NULL)`,
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

  public async getAllStudents() {
    return await db
      .select({
        treatmentId: patient_treatment_history.id,
        patientId: patient_treatment_history.patient_id,
        doctorId: patient_treatment_history.doctor_id,
        severity: patient_treatment_history.severity,
        notes: patient_treatment_history.notes,
        leaveNotes: patient_treatment_history.leave_notes,
        createdAt: patient_treatment_history.created_at,
        departmentId: sql`COALESCE(${users.department_id}, NULL)`,
        patientName: users.name,
        patientGender: users.gender,
        studentNumber: users.student_id,
        patientType: sql`'PATIENT'`
      })
      .from(patient_treatment_history)
      .leftJoin(users, eq(users.id, patient_treatment_history.patient_id))
      .where(
        // Only get records for actual students (not family members)
        and(
          isNotNull(users.id),
          eq(users.userType, 'STUDENT')
        )
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
          leaveNotes: patient_treatment_history.leave_notes,
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