import { eq } from "drizzle-orm";
import { db } from "../../database/drizzle";
import { login, users } from "../../database/schema/schema";
import { BadRequestException, InternalServerException, NotFoundException } from "../../common/utils/catch-errors";
import { compareValue, hashValue } from "../../common/utils/bcrypt";
import { ErrorCode } from "../../common/enums/error-code.enum";

export class UserService{
    public async updateUser(userId: string, updatedData: Partial<typeof users.$inferInsert>) {
        try {
            const [updatedUser] = await db
            .update(users)
            .set(updatedData)
            .where(eq(users.id, userId))
            .returning();

            if (!updatedUser) {
                throw new NotFoundException("User not found or update failed.");
            }

            return updatedUser;
        } catch (error) {
            throw new InternalServerException(
                "Failed to update the user Details",
                ErrorCode.INTERNAL_SERVER_ERROR
            )
        }
    }
    public async changePassword(userId: string, currentPassword: string, newPassword: string) {
       try {
            const userResult = await db.select().from(login).where(eq(users.id, userId));

            if (userResult.length === 0) {
                throw new NotFoundException("User not found.");
            }

            const user = userResult[0];

            const isPasswordValid = await compareValue(currentPassword, user.password);
            if (!isPasswordValid) {
                throw new BadRequestException("Current password is incorrect.");
            }

            // Hash new password
            const hashedNewPassword = await hashValue(newPassword);

            // Update password in DB
            await db.update(login)
                .set({ password: hashedNewPassword })
                .where(eq(users.id, userId));

            return;
       } catch (error) {
        throw new InternalServerException(
            "Failed to update the password",
            ErrorCode.INTERNAL_SERVER_ERROR
        )
       }
    }
    public async getEmail(email: string) {
        try {
            const userResult = await db
            .select({ role: login.role })  // Only query login table
            .from(login)
            .where(eq(login.email, email))
            .limit(1);

        if (!userResult.length) {
            return "NOT_FOUND";
        }

        return userResult[0].role === "HA" ? "HA" : "USER";
        } catch (error) {
           throw new InternalServerException(
            "Unable to find the Email",
            ErrorCode.AUTH_USER_NOT_FOUND
           ) 
        }
    }

}