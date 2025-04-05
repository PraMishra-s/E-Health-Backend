import { eq, sql } from "drizzle-orm";
import { db } from "../../database/drizzle";
import { login, programmes, staff_family_members, users } from "../../database/schema/schema";
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
      const userResult = await db.select().from(login).where(eq(login.user_id, userId));

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
            .where(eq(login.user_id, userId));
        return;
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
    public async updateProfilePic(userId: string, updatedData: Partial<typeof users.$inferInsert>, sessionId: string){
         const [updatedUser] = await db
            .update(users)
            .set({ profile_url: updatedData.profile_url })
            .where(eq(users.id, userId))
            .returning();

            if (!updatedUser) {
                throw new NotFoundException("User not found or update failed.");
            }
            const sessionKey = `session:${sessionId}`;
            const sessionData = await redis.get(sessionKey);
            if (sessionData) {
                const session = typeof sessionData === "string" ? JSON.parse(sessionData) : sessionData; 
                session.profile_url = updatedData.profile_url;
                await redis.set(sessionKey, JSON.stringify(session));
            }


            return updatedUser;
    }
    public async getUsers() {
        try {
            return await db
                .select({
                    id: users.id,
                    student_id: users.student_id,
                    name: users.name,
                    gender: users.gender,
                    department_id: users.department_id,
                    std_year: users.std_year,
                    userType: users.userType,
                    blood_type: users.blood_type,
                    contact_number: users.contact_number,
                    profile_url: users.profile_url,
                    family_members: sql<any>`COALESCE(json_agg(json_build_object(
                        'id', staff_family_members.id,
                        'name', staff_family_members.name,
                        'gender', staff_family_members.gender,
                        'contact_number', staff_family_members.contact_number,
                        'relation', staff_family_members.relation,
                        'blood_type', staff_family_members.blood_type,
                        'date_of_birth', staff_family_members.date_of_birth
                    )) FILTER (WHERE staff_family_members.id IS NOT NULL), '[]')`.as("family_members")
                })
                .from(users)
                .leftJoin(staff_family_members, eq(users.id, staff_family_members.staff_id)) // ✅ Join family members
                .groupBy(users.id); // ✅ Group by user ID to avoid duplicates

        } catch (error) {
            throw new InternalServerException(
                "Failed to fetch users",
                ErrorCode.INTERNAL_SERVER_ERROR
            );
        }
    }
    public async getProgrammes() {
        try {
            return await db
                .select().from(programmes)
                   
        } catch (error) {
            throw new InternalServerException(
                "Failed to fetch users",
                ErrorCode.INTERNAL_SERVER_ERROR
            );
        }
    }


}