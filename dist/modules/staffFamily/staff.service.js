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
exports.StaffService = void 0;
const catch_errors_1 = require("../../common/utils/catch-errors");
const drizzle_1 = require("../../database/drizzle");
const schema_1 = require("../../database/schema/schema");
const drizzle_orm_1 = require("drizzle-orm");
class StaffService {
    createFamilyMember(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const [familyMember] = yield drizzle_1.db.insert(schema_1.staff_family_members).values(Object.assign({}, data)).returning();
            return familyMember;
        });
    }
    // ✅ Get all family members of a staff
    getFamilyMembers(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            const familyMembers = yield drizzle_1.db
                .select()
                .from(schema_1.staff_family_members)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.staff_family_members.staff_id, staffId), (0, drizzle_orm_1.eq)(schema_1.staff_family_members.is_active, true) // ✅ Fetch only active members
            ));
            if (familyMembers.length === 0)
                throw new catch_errors_1.NotFoundException("No active family members found.");
            return familyMembers;
        });
    }
    getAllFamilyMembers(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            const familyMembers = yield drizzle_1.db
                .select()
                .from(schema_1.staff_family_members)
                .where((0, drizzle_orm_1.eq)(schema_1.staff_family_members.staff_id, staffId));
            if (familyMembers.length === 0)
                throw new catch_errors_1.NotFoundException("No family members found.");
            return familyMembers;
        });
    }
    // ✅ Update family member details
    updateFamilyMember(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const [updatedMember] = yield drizzle_1.db
                .update(schema_1.staff_family_members)
                .set(data)
                .where((0, drizzle_orm_1.eq)(schema_1.staff_family_members.id, id))
                .returning();
            if (!updatedMember)
                throw new catch_errors_1.NotFoundException("Family member not found.");
            return updatedMember;
        });
    }
    // ✅ Soft delete a family member
    deleteFamilyMember(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [deletedMember] = yield drizzle_1.db
                .update(schema_1.staff_family_members)
                .set({ is_active: false })
                .where((0, drizzle_orm_1.eq)(schema_1.staff_family_members.id, id))
                .returning();
            if (!deletedMember)
                throw new catch_errors_1.NotFoundException("Family member not found.");
        });
    }
    hardDeleteFamilyMember(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const deletedMember = yield drizzle_1.db
                .delete(schema_1.staff_family_members)
                .where((0, drizzle_orm_1.eq)(schema_1.staff_family_members.id, id))
                .returning();
            if (deletedMember.length === 0)
                throw new catch_errors_1.NotFoundException("Family member not found.");
        });
    }
}
exports.StaffService = StaffService;
