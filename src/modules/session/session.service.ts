import { eq, gt, and, desc } from "drizzle-orm";
import { db } from "../../database/drizzle";
import { sessions, users } from "../../database/schema/schema";
import { InternalServerException, NotFoundException } from "../../common/utils/catch-errors";
import redis from "../../common/service/redis.service";
import { ErrorCode } from "../../common/enums/error-code.enum";

export class SessionService {

    public async getAllSessionsBySessionId(userId: string, sessionId: string) {
        try {
            const sessionRecords = await db
                .select()
                .from(sessions)
                .where(
                    and(
                        eq(sessions.user_id, userId),
                        gt(sessions.expired_at, new Date()) 
                    )
                )
                .orderBy(desc(sessions.created_at));

            return sessionRecords.map(session => ({
                ...session,
                isCurrent: session.id === sessionId, 
            }));

        } catch (error) {
            console.error("Error fetching sessions:", error);
            throw new InternalServerException("Failed to fetch sessions.");
        }
    }


    public async getSessionById(sessionId: string) {
        const sessionKey = `session:${sessionId}`;
        const sessionData = await redis.get(sessionKey);

        if (sessionData) {
            const parsedSession = typeof sessionData === "string" ? JSON.parse(sessionData) : sessionData; // Ensure parsing only if needed
            return { user: parsedSession };
        }

        const result = await db
            .select({
                session_id: sessions.id,
                user: {
                    id: users.id,
                    student_id: users.student_id,
                    name: users.name,
                    gender: users.gender,
                    department_id: users.department_id,
                    std_year: users.std_year,
                    userType: users.userType,
                    blood_type: users.blood_type,
                    contact_number: users.contact_number,
                },
            })
            .from(sessions)
            .innerJoin(users, eq(sessions.user_id, users.id))
            .where(eq(sessions.id, sessionId));

        if (!result.length) {
            throw new NotFoundException("Session not found.");
        }

        return { user: result[0]};
    }

 
    public async deleteSession(sessionId: string, userId: string) { 
        try {
            const sessionKey = `session:${sessionId}`;
            const redisSession = await redis.get(sessionKey);

            // Delete session from Redis if it exists
            if (redisSession) {
                await redis.del(sessionKey);
            }

            // Ensure the session exists and belongs to the user
            const session = await db
                .select({ user_id: sessions.user_id })
                .from(sessions)
                .where(eq(sessions.id, sessionId))
                .limit(1);

            if (!session.length || session[0].user_id !== userId) {
                throw new NotFoundException(
                    "Session not found or unauthorized to delete.",
                    ErrorCode.AUTH_UNAUTHORIZED_ACCESS
                );
            }
            
            const deletedSession = await db
                .delete(sessions)
                .where(eq(sessions.id, sessionId))
                .returning();

            if (!deletedSession.length) {
                throw new NotFoundException(
                    "Session already deleted.",
                    ErrorCode.AUTH_NOT_FOUND
                );
            }
        } catch (error) {
            console.error("Error deleting session:", error);
            throw new InternalServerException("Failed to delete session.");
        }
    }

    
    public async deleteAllSessions(userId: string) {
 

    const userSessions = await db
        .select({ id: sessions.id })
        .from(sessions)
        .where(eq(sessions.user_id, userId));

    if (!userSessions.length) {
        throw new NotFoundException("No active sessions found for this user.");
    }

    // Build Redis keys for each session and delete them
    const redisKeys = userSessions.map(session => `session:${session.id}`);
    if (redisKeys.length > 0) {
        await redis.del(...redisKeys);
    }

    // Delete all sessions from PostgreSQL for this user
    await db.delete(sessions).where(eq(sessions.user_id, userId));

    return { message: "All sessions removed successfully" };
    }

}
