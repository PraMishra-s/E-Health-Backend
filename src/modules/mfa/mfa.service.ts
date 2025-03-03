import { eq } from "drizzle-orm";
import { ErrorCode } from "../../common/enums/error-code.enum";
import { BadRequestException, InternalServerException, NotFoundException, UnauthorizedException } from "../../common/utils/catch-errors";
import { db } from "../../database/drizzle";
import { login, sessions, users } from "../../database/schema/schema";
import redis from "../../common/service/redis.service";
import { refreshTokenSignOptions, signJwtToken } from "../../common/utils/jwt";

export class MFAService{

    

    public async invokeMFASetup(userId: string, sessionId: string) {

        if (!userId) {
            throw new UnauthorizedException("User not found for the session.");
        }
        
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
        const sessionKey = `session:${sessionId}`;
            const sessionData = await redis.get(sessionKey);
            if (sessionData) {
                const session = typeof sessionData === "string" ? JSON.parse(sessionData) : sessionData; 
                session.mfa_required = true;
                await redis.set(sessionKey, JSON.stringify(session));
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
            

        const userDetails = await db
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
            profile_url: users.profile_url
        })
        .from(users)
        .where(eq(users.id, user.user_id))
        .limit(1);

    if (!userDetails.length) {
        throw new NotFoundException("User details not found", ErrorCode.AUTH_USER_NOT_FOUND);
    }

    const fullUser = userDetails[0];
        try {
            const [session] = await db.insert(sessions).values({
                user_id: user.user_id,
                user_agent: userAgent || "Unknown",
                expired_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) 
            }).returning();
                sessionId = session.id; 
                const sessionKey = `session:${sessionId}`;
                const sessionData = {
                    sessionid: sessionId,
                    userId: user.user_id,
                    userAgent,
                    createdAt: session.created_at,
                    expiredAt: session.expired_at,
                    email: user?.email, // 7 days
                    ...fullUser,
                    mfa_required: user.mfa_required
                };

                await redis.set(sessionKey, JSON.stringify(sessionData), { ex: 60 * 60 * 24 * 7 });
            } catch (error: any) {
                throw new InternalServerException(
                    "Failed to insert in the session table",
                    ErrorCode.FAILED_SESSSION
                )
            }

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
   public async revokeMFA(userId: string, sessionId: string) {

        const updatedUser = await db
            .update(login)
            .set({ mfa_required: false })
            .where(eq(login.user_id, userId))
            .returning();

        if (!updatedUser.length) {
            throw new NotFoundException("User not found or MFA already disabled.");
        }
            const sessionKey = `session:${sessionId}`;
            const sessionData = await redis.get(sessionKey);
            if (sessionData) {
                const session = typeof sessionData === "string" ? JSON.parse(sessionData) : sessionData; 
                session.mfa_required = false;
                await redis.set(sessionKey, JSON.stringify(session));
            }

        return { message: "MFA successfully disabled." };
    }
    
}