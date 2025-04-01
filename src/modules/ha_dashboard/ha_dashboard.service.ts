import { count, desc, sum, eq, and, gt, lt, sql, isNotNull, isNull, or } from "drizzle-orm";
import { db } from "../../database/drizzle";
import { illnesses, inventory_transactions, medicine_batches, medicine_categories, medicines, patient_treatment_history, programmes, staff_family_members, treatment_illnesses, treatment_medicines, users } from "../../database/schema/schema";

export class HaDashboardService{
    public async getAnalytics() {
    // 1. Total treatments
    const totalTreatments = await db.select({ count: count() }).from(patient_treatment_history);

    // 2. Most treated illnesses
    const mostTreatedIllnesses = await db
        .select({
            illness_id: treatment_illnesses.illness_id,
            illness_name: illnesses.name,
            illness_type: illnesses.type,
            count: count(),
        })
        .from(treatment_illnesses)
        .innerJoin(illnesses, eq(treatment_illnesses.illness_id, illnesses.id))
        .groupBy(treatment_illnesses.illness_id, illnesses.name, illnesses.type)
        .orderBy(desc(count()));

    // 3. Most prescribed medicines
    const mostPrescribedMedicines = await db
        .select({
            medicine_id: treatment_medicines.medicine_id,
            medicine_name: medicines.name,
            category_name: medicine_categories.name,
            count: count(),
        })
        .from(treatment_medicines)
        .innerJoin(medicines, eq(treatment_medicines.medicine_id, medicines.id))
        .leftJoin(medicine_categories, eq(medicines.category_id, medicine_categories.id))
        .groupBy(treatment_medicines.medicine_id, medicines.name, medicine_categories.name)
        .orderBy(desc(count()));

    // 4. Total medicines dispensed
    const totalMedicinesDispensed = await db
        .select({ total: sum(inventory_transactions.change) })
        .from(inventory_transactions)
        .where(eq(inventory_transactions.type, "USED_FOR_PATIENT"));

    // 5. Patient demographics (students, staff, family)
    const patientDemographics = await db
        .select({
            userType: users.userType,
            count: count(),
        })
        .from(patient_treatment_history)
        .innerJoin(users, eq(patient_treatment_history.patient_id, users.id))
        .groupBy(users.userType);

    // 6. Treatment severity breakdown
    const treatmentSeverity = await db
        .select({
            severity: patient_treatment_history.severity,
            count: count(),
        })
        .from(patient_treatment_history)
        .groupBy(patient_treatment_history.severity);

    // 7. Medicine inventory status
    const medicineInventory = await db
        .select({
            medicine_id: medicine_batches.medicine_id,
            medicine_name: medicines.name,
            total_quantity: sum(medicine_batches.quantity),
            expiring_soon_count: count(
                and(
                    gt(medicine_batches.quantity, 0),
                    lt(medicine_batches.expiry_date, new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) // 90 days
                )
            ),
        })
        .from(medicine_batches)
        .innerJoin(medicines, eq(medicine_batches.medicine_id, medicines.id))
        .groupBy(medicine_batches.medicine_id, medicines.name);

    // 8. Doctor (HA) workload
    const doctorWorkload = await db
        .select({
            doctor_id: patient_treatment_history.doctor_id,
            doctor_name: users.name,
            count: count(),
        })
        .from(patient_treatment_history)
        .innerJoin(users, eq(patient_treatment_history.doctor_id, users.id))
        .groupBy(patient_treatment_history.doctor_id, users.name)
        .orderBy(desc(count()));

    // 9. Treatments over time (monthly)
    const currentDate = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
    const treatmentsOverTime = await db
        .select({
            month: sql`to_char(${patient_treatment_history.created_at}, 'YYYY-MM')`,
            count: count(),
        })
        .from(patient_treatment_history)
        .where(gt(patient_treatment_history.created_at, sixMonthsAgo))
        .groupBy(sql`to_char(${patient_treatment_history.created_at}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${patient_treatment_history.created_at}, 'YYYY-MM')`);

    // 10. Complete gender distribution for treatments
    const allGenders = ['MALE', 'FEMALE', 'OTHERS'];
    const treatmentsByGenderResult = await db
        .select({
            gender: users.gender,
            count: count(sql`DISTINCT ${patient_treatment_history.patient_id}`),
        })
        .from(patient_treatment_history)
        .innerJoin(users, eq(patient_treatment_history.patient_id, users.id))
        .groupBy(users.gender)

    const treatmentsByGender = allGenders.map(gender => {
        const found = treatmentsByGenderResult.find(g => g.gender === gender);
        return {
            gender,
            count: found ? found.count : 0
        };
    });

    // 11. Complete gender distribution for users
    const usersByGenderResult = await db
        .select({
            gender: users.gender,
            count: count(),
        })
        .from(users)
        .groupBy(users.gender);

    const usersByGender = allGenders.map(gender => {
        const found = usersByGenderResult.find(g => g.gender === gender);
        return {
            gender,
            count: found ? found.count : 0
        };
    });

    // 12. Illness trends over time (monthly)
    const illnessesOverTime = await db
        .select({
            month: sql`to_char(${patient_treatment_history.created_at}, 'YYYY-MM')`,
            illness_id: treatment_illnesses.illness_id,
            illness_name: illnesses.name,
            count: count(),
        })
        .from(patient_treatment_history)
        .innerJoin(treatment_illnesses, eq(treatment_illnesses.treatment_id, patient_treatment_history.id))
        .innerJoin(illnesses, eq(treatment_illnesses.illness_id, illnesses.id))
        .where(gt(patient_treatment_history.created_at, sixMonthsAgo))
        .groupBy(
            sql`to_char(${patient_treatment_history.created_at}, 'YYYY-MM')`,
            treatment_illnesses.illness_id,
            illnesses.name
        )
        .orderBy(
            sql`to_char(${patient_treatment_history.created_at}, 'YYYY-MM')`,
            desc(count())
        );

    // 13. Age group analysis of patients
    const ageGroups = await db
        .select({
            age_group: sql`
                CASE 
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${users.date_of_birth})) < 18 THEN 'Under 18'
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${users.date_of_birth})) BETWEEN 18 AND 25 THEN '18-25'
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${users.date_of_birth})) BETWEEN 26 AND 40 THEN '26-40'
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${users.date_of_birth})) BETWEEN 41 AND 60 THEN '41-60'
                    ELSE 'Over 60'
                END
            `,
            count: count(),
        })
        .from(patient_treatment_history)
        .innerJoin(users, eq(patient_treatment_history.patient_id, users.id))
        .where(isNotNull(users.date_of_birth))
        .groupBy(users.date_of_birth)
        .orderBy(sql`
            CASE 
                WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${users.date_of_birth})) < 18 THEN 1
                WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${users.date_of_birth})) BETWEEN 18 AND 25 THEN 2
                WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${users.date_of_birth})) BETWEEN 26 AND 40 THEN 3
                WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${users.date_of_birth})) BETWEEN 41 AND 60 THEN 4
                ELSE 5
            END
        `);

    // 14. Staff family member treatment stats
    const familyMemberTreatments = await db
        .select({
            relation: staff_family_members.relation,
            count: count(),
        })
        .from(patient_treatment_history)
        .innerJoin(staff_family_members, eq(patient_treatment_history.family_member_id, staff_family_members.id))
        .groupBy(staff_family_members.relation);

    // 15. Student program analysis (for student patients)
    const studentProgramStats = await db
        .select({
            programme_id: users.department_id,
            programme_name: programmes.programme_name,
            count: count(),
        })
        .from(patient_treatment_history)
        .innerJoin(users, eq(patient_treatment_history.patient_id, users.id))
        .leftJoin(programmes, eq(users.department_id, programmes.programme_id))
        .where(eq(users.userType, "STUDENT"))
        .groupBy(users.department_id, programmes.programme_name)
        .orderBy(desc(count()));

    // 16. Medicine usage trends over time
    const medicineUsageOverTime = await db
        .select({
            month: sql`to_char(${inventory_transactions.created_at}, 'YYYY-MM')`,
            medicine_id: inventory_transactions.medicine_id,
            medicine_name: medicines.name,
            total_used: sum(inventory_transactions.change),
        })
        .from(inventory_transactions)
        .innerJoin(medicines, eq(inventory_transactions.medicine_id, medicines.id))
        .where(
            and(
                eq(inventory_transactions.type, "USED_FOR_PATIENT"),
                gt(inventory_transactions.created_at, sixMonthsAgo)
            )
        )
        .groupBy(
            sql`to_char(${inventory_transactions.created_at}, 'YYYY-MM')`,
            inventory_transactions.medicine_id,
            medicines.name
        )
        .orderBy(sql`to_char(${inventory_transactions.created_at}, 'YYYY-MM')`);

    // 17. Inventory health summary
    const inventoryHealthSummary = {
        total_medicines: await db.select({ count: count() }).from(medicines),
        total_batches: await db.select({ count: count() }).from(medicine_batches),
        expiring_soon_percentage: await db
            .select({
                percentage: sql`
                    ROUND(
                        (COUNT(CASE WHEN ${medicine_batches.expiry_date} < CURRENT_DATE + INTERVAL '90 days' 
                        AND ${medicine_batches.quantity} > 0 THEN 1 END)::NUMERIC / 
                        NULLIF(COUNT(*)::NUMERIC, 0)) * 100, 
                        2
                    )
                `
            })
            .from(medicine_batches),
        out_of_stock_count: await db
            .select({ count: count() })
            .from(medicines)
            .leftJoin(
                db
                    .select({
                        medicine_id: medicine_batches.medicine_id,
                        total_quantity: sql`SUM(${medicine_batches.quantity})`.as("total_quantity"),
                    })
                    .from(medicine_batches)
                    .groupBy(medicine_batches.medicine_id)
                    .as("inventory_summary"),
                eq(medicines.id, sql`"inventory_summary"."medicine_id"`)
            )
            .where(
                or(
                    isNull(sql`"inventory_summary"."total_quantity"`),
                    eq(sql`"inventory_summary"."total_quantity"`, 0)
                )
            )
    };

    return {
        totalTreatments: totalTreatments[0].count,
        mostTreatedIllnesses,
        mostPrescribedMedicines,
        totalMedicinesDispensed: totalMedicinesDispensed[0]?.total || 0,
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
            totalMedicines: inventoryHealthSummary.total_medicines[0]?.count || 0,
            totalBatches: inventoryHealthSummary.total_batches[0]?.count || 0,
            expiringSoonPercentage: inventoryHealthSummary.expiring_soon_percentage[0]?.percentage || 0,
            outOfStockCount: inventoryHealthSummary.out_of_stock_count[0]?.count || 0,
        },
    };
}
}