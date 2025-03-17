import { eq, gt, and, desc } from "drizzle-orm";
import { db } from "../../database/drizzle";
import { ha_details, login, sessions, users } from "../../database/schema/schema";
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
        const haData = await redis.get("ha:available");
        const leaveKey = `ha:leave`;
        const leaveData = await redis.get(leaveKey);
        let is_onLeave = false
        let onLeaveData: any = []

        if (sessionData && haData) {
        let parsedSession =
            typeof sessionData === "string" ? JSON.parse(sessionData) : sessionData;
        const haDataParsed =
            typeof haData === "string" ? JSON.parse(haData) : haData;
        parsedSession.is_available = haDataParsed.is_available;

        if (leaveData) {
            const haLeaveData =
            typeof leaveData === "string" ? JSON.parse(leaveData) : leaveData;
            const { is_onLeave, ...restLeaveData } = haLeaveData;
            parsedSession.is_onLeave = is_onLeave;
            parsedSession = { ...parsedSession, ...restLeaveData };
        }

        return { user: parsedSession };
        }


       const result = await db
        .select({
            session_id: sessions.id,
            user_agent: sessions.user_agent || "Unknown",
            createdAt: sessions.created_at,
            expiredAt: sessions.expired_at,
            email: login.email, 
            user_id: users.id,
            student_id: users.student_id,
            name: users.name,
            gender: users.gender,
            department_id: users.department_id,
            std_year: users.std_year,
            userType: users.userType,
            blood_type: users.blood_type,
            contact_number: users.contact_number,
            profile_url: users.profile_url,
            mfa_required: login.mfa_required
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.user_id, users.id))
        .innerJoin(login, eq(users.id, login.user_id)) 
        .where(eq(sessions.id, sessionId));

        if (!result.length) {
            throw new NotFoundException("Session not found.");
        }
        const sessionResult = result[0];
        
        const availabilityKey = `ha:available`;
        const availabilityData = await redis.get(availabilityKey);

        


        let isCurrent = true
        if(availabilityData){
           const ha_data = typeof availabilityData === "string" ? JSON.parse(availabilityData) : availabilityData;
            isCurrent = ha_data.is_available
        }else{
            const [haAvailability] = await db
            .select({ is_available: ha_details.is_available })
            .from(ha_details)
            .limit(1);
            isCurrent = haAvailability?.is_available!
        }
       
          

        const newResult = {
            id: sessionResult.session_id,
            userId: sessionResult.user_id,
            userAgent: sessionResult.user_agent,
            createdAt: sessionResult.createdAt,
            expiredAt: sessionResult.expiredAt,
            email: sessionResult.email,  // Include the email
            // Flatten the user data
            student_id: sessionResult.student_id,
            name: sessionResult.name,
            gender: sessionResult.gender,
            department_id: sessionResult.department_id,
            std_year: sessionResult.std_year,
            userType: sessionResult.userType,
            blood_type: sessionResult.blood_type,
            contact_number: sessionResult.contact_number,
            mfa_required: login.mfa_required,
            profile_url: sessionResult.profile_url,
            is_available: isCurrent,
            isOnLeave: is_onLeave,
            ...onLeaveData
        };
        
        return { user: newResult};
    }

 
    public async deleteSession(sessionId: string, userId: string) { 

        const sessionKey = `session:${sessionId}`;
        const redisSession = await redis.get(sessionKey)            
        // Delete session from Redis if it exists
        if (redisSession) {
            await redis.del(sessionKey);
                // Ensure the session exists and belongs to the user
        const session = await db
            .select({ user_id: sessions.user_id })
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1)          
            if (!session.length || session[0].user_id !== userId) {
                throw new NotFoundException(
                    "Session not found or unauthorized to delete.",
                    ErrorCode.AUTH_UNAUTHORIZED_ACCESS
            );
        }

        const deletedSession = await db
            .delete(sessions)
            .where(eq(sessions.id, sessionId))
            .returning()            
            if (!deletedSession.length) {
                throw new NotFoundException(
                    "Session already deleted.",
                    ErrorCode.AUTH_NOT_FOUND
                );
            }
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
    const response = await db.delete(sessions).where(eq(sessions.user_id, userId));
    if(!response){
        throw new InternalServerException("Failed to delete sessions222.");
    }

    return { message: "All sessions removed successfully" };
    }

}
