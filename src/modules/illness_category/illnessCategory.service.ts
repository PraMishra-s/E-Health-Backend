import { eq } from "drizzle-orm";
import { ErrorCode } from "../../common/enums/error-code.enum";
import { NotFoundException } from "../../common/utils/catch-errors";
import { db } from "../../database/drizzle";
import { illness_categories, illnesses } from "../../database/schema/schema";

export class IllnessCategoryService{


    public async createCategory(data: { name: string }) {
        const [existing] = await db.select()
            .from(illness_categories)
            .where(eq(illness_categories.name, data.name));
            
        if (existing) {
            throw new Error("Category with this name already exists");
        }

        const [category] = await db.insert(illness_categories)
            .values(data)
            .returning();
        return category;
    }

    public async getAllCategories() {
        return await db.select().from(illness_categories);
    }

    public async updateCategory(id: string, data: { name?: string }) {
        const [updated] = await db.update(illness_categories).set(data).where(eq(illness_categories.id, id)).returning();
        return updated;
    }

    public async deleteCategory(id: string) {
        await db.delete(illness_categories).where(eq(illness_categories.id, id));
    }

}