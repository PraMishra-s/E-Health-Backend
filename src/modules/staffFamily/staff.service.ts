import { NotFoundException } from "../../common/utils/catch-errors";
import { db } from "../../database/drizzle";
import { staff_family_members } from "../../database/schema/schema";
import { eq, and } from "drizzle-orm";

export class StaffService{
    public  async createFamilyMember(data: any) {
        const [familyMember] = await db.insert(staff_family_members).values({
            ...data
        }).returning();

        return familyMember;
    }

    // ✅ Get all family members of a staff
    public async getFamilyMembers(staffId: string) {
        const familyMembers = await db
            .select()
            .from(staff_family_members)
            .where(and(
                eq(staff_family_members.staff_id, staffId),
                eq(staff_family_members.is_active, true) // ✅ Fetch only active members
            ));

        if (familyMembers.length === 0) throw new NotFoundException("No active family members found.");
        
        return familyMembers;
    }

    public async getAllFamilyMembers(staffId: string) {
        const familyMembers = await db
            .select()
            .from(staff_family_members)
            .where(eq(staff_family_members.staff_id, staffId));

        if (familyMembers.length === 0) throw new NotFoundException("No family members found.");
        
        return familyMembers;
    }
    // ✅ Update family member details
    public  async updateFamilyMember(id: string, data: any) {
        const [updatedMember] = await db
            .update(staff_family_members)
            .set(data)
            .where(eq(staff_family_members.id, id))
            .returning();

        if (!updatedMember) throw new NotFoundException("Family member not found.");

        return updatedMember;
    }

    // ✅ Soft delete a family member
    public  async deleteFamilyMember(id: string) {
        const [deletedMember] = await db
            .update(staff_family_members)
            .set({ is_active: false })
            .where(eq(staff_family_members.id, id))
            .returning();

        if (!deletedMember) throw new NotFoundException("Family member not found.");
    }

    public async hardDeleteFamilyMember(id: string) {
        const deletedMember = await db
            .delete(staff_family_members)
            .where(eq(staff_family_members.id, id))
            .returning();

        if (deletedMember.length === 0) throw new NotFoundException("Family member not found.");
    }
}