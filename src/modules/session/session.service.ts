import { eq, gt, and, desc } from "drizzle-orm";
import { db } from "../../database/drizzle";
import { sessions, users } from "../../database/schema/schema";
import { InternalServerException, NotFoundException } from "../../common/utils/catch-errors";

export class SessionService {

    public async getAllSessionsBySessionId(sessionId: string) {
        try {
            const userSession = await db
                .select({ user_id: sessions.user_id })
                .from(sessions)
                .where(eq(sessions.id, sessionId))
                .limit(1);

            if (!userSession.length) {
                throw new NotFoundException("Session not found.");
            }

            const userId = userSession[0].user_id;

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
                isCurrent: session.id === sessionId, // Mark the current session
            }));
        } catch (error) {
            console.error("Error fetching sessions:", error);
            throw new InternalServerException("Failed to fetch sessions.");
        }
    }

    public async getSessionById(sessionId: string) {
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
        const session = await db
            .select({ user_id: sessions.user_id })
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

        if (!session.length) {
            throw new NotFoundException("Session not found or already deleted.");
        }

        const userId = session[0].user_id;

        const deletedSession = await db
            .delete(sessions)
            .where(and(eq(sessions.id, sessionId), eq(sessions.user_id, userId)))
            .returning();

        if (!deletedSession.length) {
            throw new NotFoundException("Session not found or unauthorized to delete.");
        }
    }
}
