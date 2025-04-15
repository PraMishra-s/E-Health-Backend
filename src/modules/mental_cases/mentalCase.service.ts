import { db } from "../../database/drizzle";
import { login, mental_health_cases, staff_family_members, users } from "../../database/schema/schema";
import { and, eq, not, isNull, sql } from "drizzle-orm";

export class MentalService{
    public async getAllCases() {
        // Get unresolved cases with college users
        const collegeCases = await db
        .select({
            case_id: mental_health_cases.id,
            illness_id: mental_health_cases.illness_id,
            treatment_id: mental_health_cases.treatment_id,
            action_taken: mental_health_cases.action_taken,
            created_at: mental_health_cases.created_at,
            patient_type: sql`'COLLEGE_USER'`.as('patient_type'),
            name: users.name,
            gender: users.gender,
            contact_number: users.contact_number,
            std_year: users.std_year,
            department_id: users.department_id,
            email: login.email
        })
        .from(mental_health_cases)
        .innerJoin(users, eq(users.id, mental_health_cases.user_id))
        .leftJoin(login, eq(login.user_id, users.id))
        .where(
            and(
            eq(mental_health_cases.is_resolved, false),
            not(isNull(mental_health_cases.user_id))
            )
        );

        // Get unresolved cases with staff family members
        const familyCases = await db
        .select({
            case_id: mental_health_cases.id,
            illness_id: mental_health_cases.illness_id,
            treatment_id: mental_health_cases.treatment_id,
            action_taken: mental_health_cases.action_taken,
            created_at: mental_health_cases.created_at,
            patient_type: sql`'STAFF_FAMILY'`.as('patient_type'),
            name: staff_family_members.name,
            gender: staff_family_members.gender,
            contact_number: staff_family_members.contact_number,
            department_id: sql`NULL`.as('department_id'),
            email: sql`NULL`.as('email')
        })
        .from(mental_health_cases)
        .innerJoin(staff_family_members, eq(staff_family_members.id, mental_health_cases.family_member_id))
        .where(
            and(
            eq(mental_health_cases.is_resolved, false),
            not(isNull(mental_health_cases.family_member_id))
            )
        );

        // Merge both types
        return [...collegeCases, ...familyCases];
    }

    public async updateCase(id: string, data: { action_taken: string; is_resolved: boolean }) {
        const [updated] = await db
        .update(mental_health_cases)
        .set(data)
        .where(eq(mental_health_cases.id, id))
        .returning();
        return updated;
    }
}