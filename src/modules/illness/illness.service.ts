import { eq } from "drizzle-orm";
import { ErrorCode } from "../../common/enums/error-code.enum";
import { NotFoundException } from "../../common/utils/catch-errors";
import { db } from "../../database/drizzle";
import { illness_categories, illnesses } from "../../database/schema/schema";

export class IllnessService{

    public async createIllness(data: any) {
        const [illness] = await db.insert(illnesses).values(data).returning();
        return illness;
    }

    public async getIllnesses() {
        return await db.select().from(illnesses);
    }

    public async getIllnessById(id: string) {
        const [illness] = await db.select().from(illnesses).where(eq(illnesses.id, id));
        if (!illness) throw new NotFoundException("Illness not found", ErrorCode.RESOURCE_NOT_FOUND);
        return illness;
    }

    public async updateIllness(id: string, data: any) {
        const [updatedIllness] = await db.update(illnesses).set(data).where(eq(illnesses.id, id)).returning();
        if (!updatedIllness) throw new NotFoundException("Illness not found", ErrorCode.RESOURCE_NOT_FOUND);
        return updatedIllness;
    }

    public async deleteIllness(id: string) {
        const result = await db.delete(illnesses).where(eq(illnesses.id, id));
        if (!result.rowCount) throw new NotFoundException("Illness not found", ErrorCode.RESOURCE_NOT_FOUND);
    }
}