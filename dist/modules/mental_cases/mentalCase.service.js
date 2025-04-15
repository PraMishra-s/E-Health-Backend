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
exports.MentalService = void 0;
const drizzle_1 = require("../../database/drizzle");
const schema_1 = require("../../database/schema/schema");
const drizzle_orm_1 = require("drizzle-orm");
class MentalService {
    getAllCases() {
        return __awaiter(this, void 0, void 0, function* () {
            // Get unresolved cases with college users
            const collegeCases = yield drizzle_1.db
                .select({
                case_id: schema_1.mental_health_cases.id,
                illness_id: schema_1.mental_health_cases.illness_id,
                treatment_id: schema_1.mental_health_cases.treatment_id,
                action_taken: schema_1.mental_health_cases.action_taken,
                created_at: schema_1.mental_health_cases.created_at,
                patient_type: (0, drizzle_orm_1.sql) `'COLLEGE_USER'`.as('patient_type'),
                name: schema_1.users.name,
                gender: schema_1.users.gender,
                contact_number: schema_1.users.contact_number,
                std_year: schema_1.users.std_year,
                department_id: schema_1.users.department_id,
                email: schema_1.login.email
            })
                .from(schema_1.mental_health_cases)
                .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.mental_health_cases.user_id))
                .leftJoin(schema_1.login, (0, drizzle_orm_1.eq)(schema_1.login.user_id, schema_1.users.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.mental_health_cases.is_resolved, false), (0, drizzle_orm_1.not)((0, drizzle_orm_1.isNull)(schema_1.mental_health_cases.user_id))));
            // Get unresolved cases with staff family members
            const familyCases = yield drizzle_1.db
                .select({
                case_id: schema_1.mental_health_cases.id,
                illness_id: schema_1.mental_health_cases.illness_id,
                treatment_id: schema_1.mental_health_cases.treatment_id,
                action_taken: schema_1.mental_health_cases.action_taken,
                created_at: schema_1.mental_health_cases.created_at,
                patient_type: (0, drizzle_orm_1.sql) `'STAFF_FAMILY'`.as('patient_type'),
                name: schema_1.staff_family_members.name,
                gender: schema_1.staff_family_members.gender,
                contact_number: schema_1.staff_family_members.contact_number,
                department_id: (0, drizzle_orm_1.sql) `NULL`.as('department_id'),
                email: (0, drizzle_orm_1.sql) `NULL`.as('email')
            })
                .from(schema_1.mental_health_cases)
                .innerJoin(schema_1.staff_family_members, (0, drizzle_orm_1.eq)(schema_1.staff_family_members.id, schema_1.mental_health_cases.family_member_id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.mental_health_cases.is_resolved, false), (0, drizzle_orm_1.not)((0, drizzle_orm_1.isNull)(schema_1.mental_health_cases.family_member_id))));
            // Merge both types
            return [...collegeCases, ...familyCases];
        });
    }
    updateCase(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const [updated] = yield drizzle_1.db
                .update(schema_1.mental_health_cases)
                .set(data)
                .where((0, drizzle_orm_1.eq)(schema_1.mental_health_cases.id, id))
                .returning();
            return updated;
        });
    }
}
exports.MentalService = MentalService;
