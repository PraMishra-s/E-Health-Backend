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
exports.HaDashboardService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_1 = require("../../database/drizzle");
const schema_1 = require("../../database/schema/schema");
class HaDashboardService {
    getAnalytics() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            // 1. Total treatments
            const totalTreatments = yield drizzle_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.patient_treatment_history);
            // 2. Most treated illnesses
            const mostTreatedIllnesses = yield drizzle_1.db
                .select({
                illness_id: schema_1.treatment_illnesses.illness_id,
                illness_name: schema_1.illnesses.name,
                illness_type: schema_1.illnesses.type,
                count: (0, drizzle_orm_1.count)(),
            })
                .from(schema_1.treatment_illnesses)
                .innerJoin(schema_1.illnesses, (0, drizzle_orm_1.eq)(schema_1.treatment_illnesses.illness_id, schema_1.illnesses.id))
                .groupBy(schema_1.treatment_illnesses.illness_id, schema_1.illnesses.name, schema_1.illnesses.type)
                .orderBy((0, drizzle_orm_1.desc)((0, drizzle_orm_1.count)()));
            // 3. Most prescribed medicines
            const mostPrescribedMedicines = yield drizzle_1.db
                .select({
                medicine_id: schema_1.treatment_medicines.medicine_id,
                medicine_name: schema_1.medicines.name,
                category_name: schema_1.medicine_categories.name,
                count: (0, drizzle_orm_1.count)(),
            })
                .from(schema_1.treatment_medicines)
                .innerJoin(schema_1.medicines, (0, drizzle_orm_1.eq)(schema_1.treatment_medicines.medicine_id, schema_1.medicines.id))
                .leftJoin(schema_1.medicine_categories, (0, drizzle_orm_1.eq)(schema_1.medicines.category_id, schema_1.medicine_categories.id))
                .groupBy(schema_1.treatment_medicines.medicine_id, schema_1.medicines.name, schema_1.medicine_categories.name)
                .orderBy((0, drizzle_orm_1.desc)((0, drizzle_orm_1.count)()));
            // 4. Total medicines dispensed
            const totalMedicinesDispensed = yield drizzle_1.db
                .select({ total: (0, drizzle_orm_1.sum)(schema_1.inventory_transactions.change) })
                .from(schema_1.inventory_transactions)
                .where((0, drizzle_orm_1.eq)(schema_1.inventory_transactions.type, "USED_FOR_PATIENT"));
            // 5. Patient demographics (students, staff, family)
            const patientDemographics = yield drizzle_1.db
                .select({
                userType: schema_1.users.userType,
                count: (0, drizzle_orm_1.count)(),
            })
                .from(schema_1.patient_treatment_history)
                .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.patient_treatment_history.patient_id, schema_1.users.id))
                .groupBy(schema_1.users.userType);
            // 6. Treatment severity breakdown
            const treatmentSeverity = yield drizzle_1.db
                .select({
                severity: schema_1.patient_treatment_history.severity,
                count: (0, drizzle_orm_1.count)(),
            })
                .from(schema_1.patient_treatment_history)
                .groupBy(schema_1.patient_treatment_history.severity);
            // 7. Medicine inventory status
            const medicineInventory = yield drizzle_1.db
                .select({
                medicine_id: schema_1.medicine_batches.medicine_id,
                medicine_name: schema_1.medicines.name,
                total_quantity: (0, drizzle_orm_1.sum)(schema_1.medicine_batches.quantity),
                expiring_soon_count: (0, drizzle_orm_1.count)((0, drizzle_orm_1.and)((0, drizzle_orm_1.gt)(schema_1.medicine_batches.quantity, 0), (0, drizzle_orm_1.lt)(schema_1.medicine_batches.expiry_date, new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) // 90 days
                )),
            })
                .from(schema_1.medicine_batches)
                .innerJoin(schema_1.medicines, (0, drizzle_orm_1.eq)(schema_1.medicine_batches.medicine_id, schema_1.medicines.id))
                .groupBy(schema_1.medicine_batches.medicine_id, schema_1.medicines.name);
            // 8. Doctor (HA) workload
            const doctorWorkload = yield drizzle_1.db
                .select({
                doctor_id: schema_1.patient_treatment_history.doctor_id,
                doctor_name: schema_1.users.name,
                count: (0, drizzle_orm_1.count)(),
            })
                .from(schema_1.patient_treatment_history)
                .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.patient_treatment_history.doctor_id, schema_1.users.id))
                .groupBy(schema_1.patient_treatment_history.doctor_id, schema_1.users.name)
                .orderBy((0, drizzle_orm_1.desc)((0, drizzle_orm_1.count)()));
            // 9. Treatments over time (monthly)
            const currentDate = new Date();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
            const treatmentsOverTime = yield drizzle_1.db
                .select({
                month: (0, drizzle_orm_1.sql) `to_char(${schema_1.patient_treatment_history.created_at}, 'YYYY-MM')`,
                count: (0, drizzle_orm_1.count)(),
            })
                .from(schema_1.patient_treatment_history)
                .where((0, drizzle_orm_1.gt)(schema_1.patient_treatment_history.created_at, sixMonthsAgo))
                .groupBy((0, drizzle_orm_1.sql) `to_char(${schema_1.patient_treatment_history.created_at}, 'YYYY-MM')`)
                .orderBy((0, drizzle_orm_1.sql) `to_char(${schema_1.patient_treatment_history.created_at}, 'YYYY-MM')`);
            // 10. Complete gender distribution for treatments
            const allGenders = ['MALE', 'FEMALE', 'OTHERS'];
            const treatmentsByGenderResult = yield drizzle_1.db
                .select({
                gender: schema_1.users.gender,
                count: (0, drizzle_orm_1.count)((0, drizzle_orm_1.sql) `DISTINCT ${schema_1.patient_treatment_history.patient_id}`),
            })
                .from(schema_1.patient_treatment_history)
                .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.patient_treatment_history.patient_id, schema_1.users.id))
                .groupBy(schema_1.users.gender);
            const treatmentsByGender = allGenders.map(gender => {
                const found = treatmentsByGenderResult.find(g => g.gender === gender);
                return {
                    gender,
                    count: found ? found.count : 0
                };
            });
            // 11. Complete gender distribution for users
            const usersByGenderResult = yield drizzle_1.db
                .select({
                gender: schema_1.users.gender,
                count: (0, drizzle_orm_1.count)(),
            })
                .from(schema_1.users)
                .groupBy(schema_1.users.gender);
            const usersByGender = allGenders.map(gender => {
                const found = usersByGenderResult.find(g => g.gender === gender);
                return {
                    gender,
                    count: found ? found.count : 0
                };
            });
            // 12. Illness trends over time (monthly)
            const illnessesOverTime = yield drizzle_1.db
                .select({
                month: (0, drizzle_orm_1.sql) `to_char(${schema_1.patient_treatment_history.created_at}, 'YYYY-MM')`,
                illness_id: schema_1.treatment_illnesses.illness_id,
                illness_name: schema_1.illnesses.name,
                count: (0, drizzle_orm_1.count)(),
            })
                .from(schema_1.patient_treatment_history)
                .innerJoin(schema_1.treatment_illnesses, (0, drizzle_orm_1.eq)(schema_1.treatment_illnesses.treatment_id, schema_1.patient_treatment_history.id))
                .innerJoin(schema_1.illnesses, (0, drizzle_orm_1.eq)(schema_1.treatment_illnesses.illness_id, schema_1.illnesses.id))
                .where((0, drizzle_orm_1.gt)(schema_1.patient_treatment_history.created_at, sixMonthsAgo))
                .groupBy((0, drizzle_orm_1.sql) `to_char(${schema_1.patient_treatment_history.created_at}, 'YYYY-MM')`, schema_1.treatment_illnesses.illness_id, schema_1.illnesses.name)
                .orderBy((0, drizzle_orm_1.sql) `to_char(${schema_1.patient_treatment_history.created_at}, 'YYYY-MM')`, (0, drizzle_orm_1.desc)((0, drizzle_orm_1.count)()));
            // 13. Age group analysis of patients
            const ageGroups = yield drizzle_1.db
                .select({
                age_group: (0, drizzle_orm_1.sql) `
                CASE 
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${schema_1.users.date_of_birth})) < 18 THEN 'Under 18'
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${schema_1.users.date_of_birth})) BETWEEN 18 AND 25 THEN '18-25'
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${schema_1.users.date_of_birth})) BETWEEN 26 AND 40 THEN '26-40'
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${schema_1.users.date_of_birth})) BETWEEN 41 AND 60 THEN '41-60'
                    ELSE 'Over 60'
                END
            `,
                count: (0, drizzle_orm_1.count)(),
            })
                .from(schema_1.patient_treatment_history)
                .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.patient_treatment_history.patient_id, schema_1.users.id))
                .where((0, drizzle_orm_1.isNotNull)(schema_1.users.date_of_birth))
                .groupBy(schema_1.users.date_of_birth)
                .orderBy((0, drizzle_orm_1.sql) `
            CASE 
                WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${schema_1.users.date_of_birth})) < 18 THEN 1
                WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${schema_1.users.date_of_birth})) BETWEEN 18 AND 25 THEN 2
                WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${schema_1.users.date_of_birth})) BETWEEN 26 AND 40 THEN 3
                WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${schema_1.users.date_of_birth})) BETWEEN 41 AND 60 THEN 4
                ELSE 5
            END
        `);
            // 14. Staff family member treatment stats
            const familyMemberTreatments = yield drizzle_1.db
                .select({
                relation: schema_1.staff_family_members.relation,
                count: (0, drizzle_orm_1.count)(),
            })
                .from(schema_1.patient_treatment_history)
                .innerJoin(schema_1.staff_family_members, (0, drizzle_orm_1.eq)(schema_1.patient_treatment_history.family_member_id, schema_1.staff_family_members.id))
                .groupBy(schema_1.staff_family_members.relation);
            // 15. Student program analysis (for student patients)
            const studentProgramStats = yield drizzle_1.db
                .select({
                programme_id: schema_1.users.department_id,
                programme_name: schema_1.programmes.programme_name,
                count: (0, drizzle_orm_1.count)(),
            })
                .from(schema_1.patient_treatment_history)
                .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.patient_treatment_history.patient_id, schema_1.users.id))
                .leftJoin(schema_1.programmes, (0, drizzle_orm_1.eq)(schema_1.users.department_id, schema_1.programmes.programme_id))
                .where((0, drizzle_orm_1.eq)(schema_1.users.userType, "STUDENT"))
                .groupBy(schema_1.users.department_id, schema_1.programmes.programme_name)
                .orderBy((0, drizzle_orm_1.desc)((0, drizzle_orm_1.count)()));
            // 16. Medicine usage trends over time
            const medicineUsageOverTime = yield drizzle_1.db
                .select({
                month: (0, drizzle_orm_1.sql) `to_char(${schema_1.inventory_transactions.created_at}, 'YYYY-MM')`,
                medicine_id: schema_1.inventory_transactions.medicine_id,
                medicine_name: schema_1.medicines.name,
                total_used: (0, drizzle_orm_1.sum)(schema_1.inventory_transactions.change),
            })
                .from(schema_1.inventory_transactions)
                .innerJoin(schema_1.medicines, (0, drizzle_orm_1.eq)(schema_1.inventory_transactions.medicine_id, schema_1.medicines.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.inventory_transactions.type, "USED_FOR_PATIENT"), (0, drizzle_orm_1.gt)(schema_1.inventory_transactions.created_at, sixMonthsAgo)))
                .groupBy((0, drizzle_orm_1.sql) `to_char(${schema_1.inventory_transactions.created_at}, 'YYYY-MM')`, schema_1.inventory_transactions.medicine_id, schema_1.medicines.name)
                .orderBy((0, drizzle_orm_1.sql) `to_char(${schema_1.inventory_transactions.created_at}, 'YYYY-MM')`);
            // 17. Inventory health summary
            const inventoryHealthSummary = {
                total_medicines: yield drizzle_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.medicines),
                total_batches: yield drizzle_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.medicine_batches),
                expiring_soon_percentage: yield drizzle_1.db
                    .select({
                    percentage: (0, drizzle_orm_1.sql) `
                    ROUND(
                        (COUNT(CASE WHEN ${schema_1.medicine_batches.expiry_date} < CURRENT_DATE + INTERVAL '90 days' 
                        AND ${schema_1.medicine_batches.quantity} > 0 THEN 1 END)::NUMERIC / 
                        NULLIF(COUNT(*)::NUMERIC, 0)) * 100, 
                        2
                    )
                `
                })
                    .from(schema_1.medicine_batches),
                out_of_stock_count: yield drizzle_1.db
                    .select({ count: (0, drizzle_orm_1.count)() })
                    .from(schema_1.medicines)
                    .leftJoin(drizzle_1.db
                    .select({
                    medicine_id: schema_1.medicine_batches.medicine_id,
                    total_quantity: (0, drizzle_orm_1.sql) `SUM(${schema_1.medicine_batches.quantity})`.as("total_quantity"),
                })
                    .from(schema_1.medicine_batches)
                    .groupBy(schema_1.medicine_batches.medicine_id)
                    .as("inventory_summary"), (0, drizzle_orm_1.eq)(schema_1.medicines.id, (0, drizzle_orm_1.sql) `"inventory_summary"."medicine_id"`))
                    .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)((0, drizzle_orm_1.sql) `"inventory_summary"."total_quantity"`), (0, drizzle_orm_1.eq)((0, drizzle_orm_1.sql) `"inventory_summary"."total_quantity"`, 0)))
            };
            return {
                totalTreatments: totalTreatments[0].count,
                mostTreatedIllnesses,
                mostPrescribedMedicines,
                totalMedicinesDispensed: ((_a = totalMedicinesDispensed[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
                patientDemographics,
                treatmentSeverity,
                medicineInventory,
                doctorWorkload,
                treatmentsOverTime,
                treatmentsByGender,
                usersByGender,
                illnessesOverTime,
                ageGroups,
                familyMemberTreatments,
                studentProgramStats,
                medicineUsageOverTime,
                inventoryHealthSummary: {
                    totalMedicines: ((_b = inventoryHealthSummary.total_medicines[0]) === null || _b === void 0 ? void 0 : _b.count) || 0,
                    totalBatches: ((_c = inventoryHealthSummary.total_batches[0]) === null || _c === void 0 ? void 0 : _c.count) || 0,
                    expiringSoonPercentage: ((_d = inventoryHealthSummary.expiring_soon_percentage[0]) === null || _d === void 0 ? void 0 : _d.percentage) || 0,
                    outOfStockCount: ((_e = inventoryHealthSummary.out_of_stock_count[0]) === null || _e === void 0 ? void 0 : _e.count) || 0,
                },
            };
        });
    }
}
exports.HaDashboardService = HaDashboardService;
