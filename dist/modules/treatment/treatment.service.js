"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentService = void 0;
const catch_errors_1 = require("../../common/utils/catch-errors");
const drizzle_1 = require("../../database/drizzle");
const schema_1 = require("../../database/schema/schema");
const drizzle_orm_1 = require("drizzle-orm");
class TreatmentService {
    addTreatment(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { patient_id, family_member_id, illness_ids, severity, notes, leave_notes, medicines, blood_pressure, forward_to_hospital, forwarded_by_hospital } = data;
            if (!patient_id && !family_member_id) {
                throw new catch_errors_1.BadRequestException("Either patient_id or family_member_id is required.");
            }
            if (patient_id && family_member_id) {
                throw new catch_errors_1.BadRequestException("Only one of patient_id or family_member_id should be provided.");
            }
            // ✅ Step 1: Create treatment
            const [treatment] = yield drizzle_1.db.insert(schema_1.patient_treatment_history).values({
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
            if (!treatment)
                throw new catch_errors_1.BadRequestException("Failed to create treatment record.");
            // ✅ Step 2: Insert illnesses
            const treatmentIllnesses = illness_ids.map((illnessId) => ({
                treatment_id: treatment.id,
                illness_id: illnessId,
            }));
            yield drizzle_1.db.insert(schema_1.treatment_illnesses).values(treatmentIllnesses);
            // ✅ Step 3: Insert prescribed medicines
            const prescribedMedicines = medicines.map((med) => ({
                treatment_id: treatment.id,
                medicine_id: med.medicine_id,
                batch_id: med.batch_id || null,
                dosage: med.dosage,
            }));
            yield drizzle_1.db.insert(schema_1.treatment_medicines).values(prescribedMedicines);
            // ✅ Step 4: Check if any illness is mental health-related
            const [mentalIllness] = yield drizzle_1.db
                .select({ illness_id: schema_1.illnesses.id })
                .from(schema_1.illnesses)
                .leftJoin(schema_1.illness_categories, (0, drizzle_orm_1.eq)(schema_1.illnesses.category_id, schema_1.illness_categories.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.illnesses.id, illness_ids), (0, drizzle_orm_1.eq)(schema_1.illness_categories.name, "Mental Health")))
                .limit(1);
            // ✅ Step 5: If mental health case found, insert into mental_health_cases
            if (mentalIllness) {
                yield drizzle_1.db.insert(schema_1.mental_health_cases).values({
                    user_id: patient_id || null,
                    family_member_id: family_member_id || null,
                    illness_id: mentalIllness.illness_id,
                    treatment_id: treatment.id,
                    is_resolved: false,
                    action_taken: null
                });
            }
            return treatment;
        });
    }
    updateTreatment(treatmentId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const [updatedTreatment] = yield drizzle_1.db
                .update(schema_1.patient_treatment_history)
                .set(data)
                .where((0, drizzle_orm_1.eq)(schema_1.patient_treatment_history.id, treatmentId))
                .returning();
            if (!updatedTreatment)
                throw new catch_errors_1.NotFoundException("Treatment record not found.");
            return updatedTreatment;
        });
    }
    getPatientTreatments(patientId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Fetch all family members linked to the staff user (if applicable)
            const familyMembers = yield drizzle_1.db
                .select({ familyMemberId: schema_1.staff_family_members.id })
                .from(schema_1.staff_family_members)
                .where((0, drizzle_orm_1.eq)(schema_1.staff_family_members.staff_id, patientId));
            // Extract family member IDs
            const familyMemberIds = familyMembers.map(fm => fm.familyMemberId);
            return yield drizzle_1.db
                .select({
                treatmentId: schema_1.patient_treatment_history.id,
                patientId: schema_1.patient_treatment_history.patient_id,
                familyMemberId: schema_1.patient_treatment_history.family_member_id,
                doctorId: schema_1.patient_treatment_history.doctor_id,
                severity: schema_1.patient_treatment_history.severity,
                notes: schema_1.patient_treatment_history.notes,
                leaveNotes: schema_1.patient_treatment_history.leave_notes,
                bloodPressue: schema_1.patient_treatment_history.blood_pressure,
                forwardedToHospital: schema_1.patient_treatment_history.forward_to_hospital,
                forwardedByHospital: schema_1.patient_treatment_history.forwarded_by_hospital,
                createdAt: schema_1.patient_treatment_history.created_at,
                patientName: (0, drizzle_orm_1.sql) `
                COALESCE(${schema_1.users.name}, ${schema_1.staff_family_members.name})
              `,
                patientGender: (0, drizzle_orm_1.sql) `
                COALESCE(${schema_1.users.gender}, ${schema_1.staff_family_members.gender})
              `,
                patientBloodType: (0, drizzle_orm_1.sql) `
                COALESCE(${schema_1.users.blood_type}, ${schema_1.staff_family_members.blood_type})
              `,
                patientContactNumber: (0, drizzle_orm_1.sql) `
                COALESCE(${schema_1.users.contact_number}, ${schema_1.staff_family_members.contact_number})
              `,
                patientDateOfBirth: (0, drizzle_orm_1.sql) `
                COALESCE(${schema_1.users.date_of_birth}, ${schema_1.staff_family_members.date_of_birth})
              `,
                patientType: (0, drizzle_orm_1.sql) `
                CASE 
                  WHEN ${schema_1.users.id} IS NOT NULL THEN 'PATIENT'
                  WHEN ${schema_1.staff_family_members.id} IS NOT NULL THEN 'FAMILY_MEMBER'
                  ELSE 'UNKNOWN'
                END
              `,
                medicines: (0, drizzle_orm_1.sql) `(
                SELECT json_agg(json_build_object(
                  'medicineId', ${schema_1.medicines.id},
                  'medicineName', ${schema_1.medicines.name},
                  'medicineCount', COALESCE(
                    (
                      SELECT SUM(${schema_1.inventory_transactions.change})
                      FROM ${schema_1.inventory_transactions}
                      WHERE 
                        ${schema_1.inventory_transactions.medicine_id} = ${schema_1.medicines.id} AND
                        (${schema_1.inventory_transactions.patient_id} = ${schema_1.patient_treatment_history.patient_id} OR
                        ${schema_1.inventory_transactions.family_member_id} = ${schema_1.patient_treatment_history.family_member_id}) AND
                        ${schema_1.inventory_transactions.type} = 'USED_FOR_PATIENT'
                    ), 
                    0
                  )
                ))
                FROM ${schema_1.treatment_medicines}
                LEFT JOIN ${schema_1.medicines} ON ${schema_1.treatment_medicines.medicine_id} = ${schema_1.medicines.id}
                WHERE ${schema_1.treatment_medicines.treatment_id} = ${schema_1.patient_treatment_history.id}
              )`,
                illnesses: (0, drizzle_orm_1.sql) `(
                SELECT json_agg(json_build_object(
                  'illnessId', ${schema_1.illnesses.id},
                  'illnessName', ${schema_1.illnesses.name},
                  'illnessType', ${schema_1.illnesses.type},
                  'illnessDescription', ${schema_1.illnesses.description}
                ))
                FROM ${schema_1.treatment_illnesses}
                LEFT JOIN ${schema_1.illnesses} ON ${schema_1.treatment_illnesses.illness_id} = ${schema_1.illnesses.id}
                WHERE ${schema_1.treatment_illnesses.treatment_id} = ${schema_1.patient_treatment_history.id}
              )`,
                medicinesUsedCount: (0, drizzle_orm_1.sql) `(
                SELECT COALESCE(SUM(${schema_1.inventory_transactions.change}), 0)
                FROM ${schema_1.inventory_transactions}
                WHERE 
                  (${schema_1.inventory_transactions.patient_id} = ${schema_1.patient_treatment_history.patient_id} OR
                  ${schema_1.inventory_transactions.family_member_id} = ${schema_1.patient_treatment_history.family_member_id})
                  AND ${schema_1.inventory_transactions.type} = 'USED_FOR_PATIENT'
              )`,
            })
                .from(schema_1.patient_treatment_history)
                .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.patient_treatment_history.patient_id))
                .leftJoin(schema_1.staff_family_members, (0, drizzle_orm_1.eq)(schema_1.staff_family_members.id, schema_1.patient_treatment_history.family_member_id))
                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.patient_treatment_history.patient_id, patientId), // Staff's own treatments
            familyMemberIds.length > 0 ? (0, drizzle_orm_1.inArray)(schema_1.patient_treatment_history.family_member_id, familyMemberIds) : undefined // Family members' treatments
            ))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.patient_treatment_history.created_at));
        });
    }
    getAllTreatment() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield drizzle_1.db
                .select({
                treatmentId: schema_1.patient_treatment_history.id,
                patientId: schema_1.patient_treatment_history.patient_id,
                familyMemberId: schema_1.patient_treatment_history.family_member_id,
                doctorId: schema_1.patient_treatment_history.doctor_id,
                severity: schema_1.patient_treatment_history.severity,
                notes: schema_1.patient_treatment_history.notes,
                leaveNotes: schema_1.patient_treatment_history.leave_notes,
                bloodPressue: schema_1.patient_treatment_history.blood_pressure,
                forwardedToHospital: schema_1.patient_treatment_history.forward_to_hospital,
                forwardedByHospital: schema_1.patient_treatment_history.forwarded_by_hospital,
                createdAt: schema_1.patient_treatment_history.created_at,
                departmentId: (0, drizzle_orm_1.sql) `COALESCE(${schema_1.users.department_id}, NULL)`,
                patientName: (0, drizzle_orm_1.sql) `
          COALESCE(
            ${schema_1.users.name}, 
            ${schema_1.staff_family_members.name}
          )
        `,
                patientGender: (0, drizzle_orm_1.sql) `
          COALESCE(
            ${schema_1.users.gender}, 
            ${schema_1.staff_family_members.gender}
          )
        `,
                patientBloodType: (0, drizzle_orm_1.sql) `
          COALESCE(
            ${schema_1.users.blood_type}, 
            ${schema_1.staff_family_members.blood_type}
          )
        `,
                patientContactNumber: (0, drizzle_orm_1.sql) `
          COALESCE(
            ${schema_1.users.contact_number}, 
            ${schema_1.staff_family_members.contact_number}
          )
        `,
                patientDateOfBirth: (0, drizzle_orm_1.sql) `
          COALESCE(
            ${schema_1.users.date_of_birth}, 
            ${schema_1.staff_family_members.date_of_birth}
          )
        `,
                patientType: (0, drizzle_orm_1.sql) `
          CASE 
            WHEN ${schema_1.users.id} IS NOT NULL THEN 'PATIENT'
            WHEN ${schema_1.staff_family_members.id} IS NOT NULL THEN 'FAMILY_MEMBER'
            ELSE 'UNKNOWN'
          END
        `,
                medicines: (0, drizzle_orm_1.sql) `(
          SELECT json_agg(json_build_object(
            'medicineId', ${schema_1.medicines.id},
            'medicineName', ${schema_1.medicines.name},
            'medicineCount', COALESCE(
              (
                SELECT SUM(${schema_1.inventory_transactions.change})
                FROM ${schema_1.inventory_transactions}
                WHERE 
                  ${schema_1.inventory_transactions.medicine_id} = ${schema_1.medicines.id} AND
                  (${schema_1.inventory_transactions.patient_id} = ${schema_1.patient_treatment_history.patient_id} OR
                   ${schema_1.inventory_transactions.family_member_id} = ${schema_1.patient_treatment_history.family_member_id}) AND
                  ${schema_1.inventory_transactions.type} = 'USED_FOR_PATIENT'
              ), 
              0
            )
          ))
          FROM ${schema_1.treatment_medicines}
          LEFT JOIN ${schema_1.medicines} ON ${schema_1.treatment_medicines.medicine_id} = ${schema_1.medicines.id}
          WHERE ${schema_1.treatment_medicines.treatment_id} = ${schema_1.patient_treatment_history.id}
        )`,
                illnesses: (0, drizzle_orm_1.sql) `(
          SELECT json_agg(json_build_object(
            'illnessId', ${schema_1.illnesses.id},
            'illnessName', ${schema_1.illnesses.name},
            'illnessType', ${schema_1.illnesses.type},
            'illnessDescription', ${schema_1.illnesses.description}
          ))
          FROM ${schema_1.treatment_illnesses}
          LEFT JOIN ${schema_1.illnesses} ON ${schema_1.treatment_illnesses.illness_id} = ${schema_1.illnesses.id}
          WHERE ${schema_1.treatment_illnesses.treatment_id} = ${schema_1.patient_treatment_history.id}
        )`,
                medicinesUsedCount: (0, drizzle_orm_1.sql) `(
          SELECT COALESCE(SUM(${schema_1.inventory_transactions.change}), 0)
          FROM ${schema_1.inventory_transactions}
          WHERE 
            (${schema_1.inventory_transactions.patient_id} = ${schema_1.patient_treatment_history.patient_id} OR
            ${schema_1.inventory_transactions.family_member_id} = ${schema_1.patient_treatment_history.family_member_id})
            AND ${schema_1.inventory_transactions.type} = 'USED_FOR_PATIENT'
        )`,
            })
                .from(schema_1.patient_treatment_history)
                .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.patient_treatment_history.patient_id))
                .leftJoin(schema_1.staff_family_members, (0, drizzle_orm_1.eq)(schema_1.staff_family_members.id, schema_1.patient_treatment_history.family_member_id))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.patient_treatment_history.created_at));
        });
    }
    getAllStudents() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield drizzle_1.db
                .select({
                treatmentId: schema_1.patient_treatment_history.id,
                patientId: schema_1.patient_treatment_history.patient_id,
                doctorId: schema_1.patient_treatment_history.doctor_id,
                severity: schema_1.patient_treatment_history.severity,
                notes: schema_1.patient_treatment_history.notes,
                leaveNotes: schema_1.patient_treatment_history.leave_notes,
                createdAt: schema_1.patient_treatment_history.created_at,
                departmentId: (0, drizzle_orm_1.sql) `COALESCE(${schema_1.users.department_id}, NULL)`,
                patientName: schema_1.users.name,
                patientGender: schema_1.users.gender,
                studentNumber: schema_1.users.student_id,
                patientType: (0, drizzle_orm_1.sql) `'PATIENT'`
            })
                .from(schema_1.patient_treatment_history)
                .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.patient_treatment_history.patient_id))
                .where(
            // Only get records for actual students (not family members)
            (0, drizzle_orm_1.and)((0, drizzle_orm_1.isNotNull)(schema_1.users.id), (0, drizzle_orm_1.eq)(schema_1.users.userType, 'STUDENT')))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.patient_treatment_history.created_at));
        });
    }
    getTreatmentById(treatmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const treatment = yield drizzle_1.db
                .select({
                id: schema_1.patient_treatment_history.id,
                patient_id: schema_1.patient_treatment_history.patient_id,
                doctor_id: schema_1.patient_treatment_history.doctor_id,
                severity: schema_1.patient_treatment_history.severity,
                notes: schema_1.patient_treatment_history.notes,
                leaveNotes: schema_1.patient_treatment_history.leave_notes,
                created_at: schema_1.patient_treatment_history.created_at,
                medicines: (0, drizzle_orm_1.sql) `json_agg(json_build_object(
            'medicine_id', treatment_medicines.medicine_id,
            'batch_id', inventory_transactions.batch_id,
            'quantity_used', inventory_transactions.change,
            'transaction_id', inventory_transactions.id,
            'transaction_type', inventory_transactions.type,
            'transaction_reason', inventory_transactions.reason
          )) FILTER (WHERE treatment_medicines.medicine_id IS NOT NULL)`.as('medicines'),
                illnesses: (0, drizzle_orm_1.sql) `json_agg(json_build_object(
            'illness_id', treatment_illnesses.illness_id,
            'illness_name', illnesses.name
          )) FILTER (WHERE treatment_illnesses.illness_id IS NOT NULL)`.as('illnesses'),
            })
                .from(schema_1.patient_treatment_history)
                .leftJoin(schema_1.treatment_medicines, (0, drizzle_orm_1.eq)(schema_1.patient_treatment_history.id, schema_1.treatment_medicines.treatment_id))
                .leftJoin(schema_1.inventory_transactions, (0, drizzle_orm_1.eq)(schema_1.patient_treatment_history.patient_id, schema_1.inventory_transactions.patient_id))
                .leftJoin(schema_1.treatment_illnesses, (0, drizzle_orm_1.eq)(schema_1.patient_treatment_history.id, schema_1.treatment_illnesses.treatment_id))
                .leftJoin(schema_1.illnesses, (0, drizzle_orm_1.eq)(schema_1.treatment_illnesses.illness_id, schema_1.illnesses.id))
                .where((0, drizzle_orm_1.eq)(schema_1.patient_treatment_history.id, treatmentId))
                .groupBy(schema_1.patient_treatment_history.id);
            if (!treatment || treatment.length === 0) {
                throw new catch_errors_1.NotFoundException('Treatment record not found.');
            }
            return treatment[0]; // Return the first element of the array
        });
    }
    // ✅ Delete Treatment
    deleteTreatment(treatmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const deleted = yield drizzle_1.db
                .delete(schema_1.patient_treatment_history)
                .where((0, drizzle_orm_1.eq)(schema_1.patient_treatment_history.id, treatmentId))
                .returning();
            if (!deleted)
                throw new catch_errors_1.NotFoundException("Treatment record not found.");
        });
    }
}
exports.TreatmentService = TreatmentService;
