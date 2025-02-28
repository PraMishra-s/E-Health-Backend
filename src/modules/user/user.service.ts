import { eq } from "drizzle-orm";
import { db } from "../../database/drizzle";
import { login, users } from "../../database/schema/schema";
import { BadRequestException, InternalServerException, NotFoundException } from "../../common/utils/catch-errors";
import { compareValue, hashValue } from "../../common/utils/bcrypt";
import { ErrorCode } from "../../common/enums/error-code.enum";
import redis from "../../common/service/redis.service";

export class UserService{
    public async updateUser(userId: string, updatedData: Partial<typeof users.$inferInsert>, sessionId: string) {
        try {
            const [updatedUser] = await db
            .update(users)
            .set(updatedData)
            .where(eq(users.id, userId))
            .returning();

            if (!updatedUser) {
                throw new NotFoundException("User not found or update failed.");
            }
            const sessionKey = `session:${sessionId}`;
            const sessionData = await redis.get(sessionKey);
            console.log(sessionKey)
            if (sessionData) {
                const session = typeof sessionData === "string" ? JSON.parse(sessionData) : sessionData; // Ensure parsing only if needed

                // Update the session user properties directly
                session.name = updatedData.name ;
                session.gender = updatedData.gender;
                session.contact_number = updatedData.contact_number
                session.blood_type = updatedData.blood_type ;
                session.department_id = updatedData.department_id ;
                await redis.set(sessionKey, JSON.stringify(session));
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

            const hashedNewPassword = await hashValue(newPassword);

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