import { eq, gt, and, desc } from "drizzle-orm";
import { db } from "../../database/drizzle";
import { sessions, users } from "../../database/schema/schema";
import { InternalServerException, NotFoundException } from "../../common/utils/catch-errors";
import redis from "../../common/service/redis.service";
import { ErrorCode } from "../../common/enums/error-code.enum";

export class SessionService {

    public async getAllSessionsBySessionId(sessionId: string) {
        try {
            const sessionKey = `session:${sessionId}`;
            const cachedSession = await redis.get(sessionKey) as any;

            let userId: string;

            if (cachedSession) {
                userId = typeof cachedSession === "string" ? JSON.parse(cachedSession).userId : cachedSession.userId;
            } else {
                const userSession = await db
                    .select({ user_id: sessions.user_id })
                    .from(sessions)
                    .where(eq(sessions.id, sessionId))
                    .limit(1);

                if (!userSession.length) {
                    throw new NotFoundException("Session not found.");
                }

                userId = userSession[0].user_id;
            }

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

 
    public async deleteSession(sessionId: string, currentSessionId: string) {
    try {
        const sessionKey = `session:${sessionId}`;
        const redisSession = await redis.get(sessionKey);

        if (redisSession) {
            await redis.del(sessionKey);
        }

        const session = await db
            .select({ user_id: sessions.user_id })
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

        if (!session.length) {
            throw new NotFoundException(
                "Session not found or already deleted.",
                ErrorCode.AUTH_NOT_FOUND
            );
        }

        const userId = session[0].user_id;

        const deletedSession = await db
            .delete(sessions)
            .where(and(eq(sessions.id, sessionId), eq(sessions.user_id, userId)))
            .returning();

        if (!deletedSession.length) {
            throw new NotFoundException(
                "Session not found or unauthorized to delete.",
                ErrorCode.AUTH_UNAUTHORIZED_ACCESS
            );
        }

        } catch (error) {
            console.error("Error deleting session:", error);
            throw new InternalServerException("Failed to delete session.");
        }
    }
    public async getUserIdBySessionId(sessionId: string): Promise<string> {
        // First, try to get the session data from Redis
        const redisKey = `session:${sessionId}`;
        const redisData = await redis.get(redisKey);
        if (redisData) {
            try {
            const sessionObj = typeof redisData === "string" ? JSON.parse(redisData) : redisData;
            if (sessionObj.userId) {
                return sessionObj.userId;
            }
            } catch (error) {
            console.error("Error parsing Redis session data:", error);
            }
        }

        // Fallback: query PostgreSQL
        const result = await db
            .select({ user_id: sessions.user_id })
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

        if (!result.length) {
            throw new NotFoundException("Session not found");
        }

        return result[0].user_id;
        }

    

    public async deleteAllSessions(currentSessionId: string) {
    // Retrieve the userId associated with the current session
    const userId = await this.getUserIdBySessionId(currentSessionId);

    // Fetch all session IDs for this user from PostgreSQL
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
