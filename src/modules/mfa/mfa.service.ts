import { eq } from "drizzle-orm";
import { ErrorCode } from "../../common/enums/error-code.enum";
import { BadRequestException, InternalServerException, NotFoundException, UnauthorizedException } from "../../common/utils/catch-errors";
import { db } from "../../database/drizzle";
import { login, sessions } from "../../database/schema/schema";
import redis from "../../common/service/redis.service";
import { refreshTokenSignOptions, signJwtToken } from "../../common/utils/jwt";

export class MFAService{

    public async getUserIdBySessionId(sessionId: string): Promise<string> {
        // Try to fetch from Redis first
        const sessionKey = `session:${sessionId}`;
        const cachedSession = await redis.get(sessionKey);
        if (cachedSession) {
            try {
            const sessionObj = typeof cachedSession === "string" ? JSON.parse(cachedSession) : cachedSession;
            if (sessionObj.userId) {
                return sessionObj.userId;
            }
            } catch (error) {
            console.error("Error parsing Redis session data:", error);
            }
        }
        
        // Fallback: Query the DB for the session record
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

    public async invokeMFASetup(currentSessionId: string) {
    // Retrieve the user ID using the current session ID
        const userId = await this.getUserIdBySessionId(currentSessionId);
        if (!userId) {
            throw new UnauthorizedException("User not found for the session.");
        }
        
        // Update the login record to set MFA as enabled
        const updatedUser = await db
            .update(login)
            .set({ mfa_required: true })
            .where(eq(login.user_id, userId))
            .returning();
        
        if (!updatedUser.length) {
            throw new InternalServerException(
                "Failed to enable MFA", 
                ErrorCode.ACCESS_FORBIDDEN
            );
        }
        const sanitizedUser = {
            id: updatedUser[0].user_id,
            email: updatedUser[0].email,
            role: updatedUser[0].role,
            verified: updatedUser[0].verified,
            mfa_required: updatedUser[0].mfa_required
        };
        return sanitizedUser;
    }
   public async verifyMFAForLogin(code: string, email: string, userAgent?: string) {
        const userResult = await db.select().from(login).where(eq(login.email, email));

        if (userResult.length === 0) {
            throw new NotFoundException("User not found.");
        }

        const user = userResult[0];

        if (!user.mfa_required) {
            throw new BadRequestException("MFA is not enabled for this user.");
        }

        const otpKey = `mfa:otp:${user.email}`;
        const storedOtp = await redis.get(otpKey) as string;

        if (!storedOtp || storedOtp.toString().trim() !== code.toString().trim()) {
            throw new BadRequestException("Invalid or expired OTP.");
        }


        await redis.del(otpKey);


        let sessionId: string;
        try {
            const [session] = await db.insert(sessions).values({
                user_id: user.user_id,
                user_agent: userAgent || "Unknown",
                created_at: new Date(),
                expired_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
            }).returning();

            sessionId = session.id;


            const sessionKey = `session:${sessionId}`;
            const sessionData = {
                id: sessionId,
                userId: user.user_id,
                userAgent: userAgent || "Unknown",
                createdAt: session.created_at,
                expiredAt: session.expired_at,
            };
            await redis.set(sessionKey, JSON.stringify(sessionData), { ex: 60 * 60 * 24 * 7 });

        } catch (error) {
            throw new InternalServerException("Failed to create session after MFA", ErrorCode.AUTH_INVALID_TOKEN);
        }


        const accessToken = signJwtToken({
            userId: user.user_id,
            sessionId
        });

        const refreshToken = signJwtToken(
            { sessionId },
            refreshTokenSignOptions
        );

        const sanitizedUser = {
            id: user.user_id,
            email: user.email,
            role: user.role,
            verified: user.verified,
            mfa_required: user.mfa_required
        };

        return {
            user: sanitizedUser,
            accessToken,
            refreshToken,
        };
    }
   public async revokeMFA(sessionId: string) {
        // Retrieve the user ID from session
        const userSession = await db
            .select({ user_id: sessions.user_id })
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

        if (!userSession.length) {
            throw new NotFoundException("Session not found.");
        }

        const userId = userSession[0].user_id;

        // Update MFA status in login table
        const updatedUser = await db
            .update(login)
            .set({ mfa_required: false })
            .where(eq(login.user_id, userId))
            .returning();

        if (!updatedUser.length) {
            throw new NotFoundException("User not found or MFA already disabled.");
        }

        return { message: "MFA successfully disabled." };
    }



}