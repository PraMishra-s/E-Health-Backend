import { eq } from "drizzle-orm";
import { db } from "../../database/drizzle";
import { users } from "../../database/schema/schema";
import { NotFoundException } from "../../common/utils/catch-errors";

export class UserService{
     public async updateUser(userId: string, updatedData: Partial<typeof users.$inferInsert>) {
        const [updatedUser] = await db
            .update(users)
            .set(updatedData)
            .where(eq(users.id, userId))
            .returning();

        if (!updatedUser) {
            throw new NotFoundException("User not found or update failed.");
        }

        return updatedUser;
    }
}