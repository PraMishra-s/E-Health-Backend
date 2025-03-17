import { eq } from "drizzle-orm";
import { LoginDto, RegisterDto, resetPasswordDto } from "../../common/interface/auth.interface";
import { db } from "../../database/drizzle";
import { login, users, sessions, ha_details } from "../../database/schema/schema";
import { BadRequestException, InternalServerException, NotFoundException, UnauthorizedException } from "../../common/utils/catch-errors";
import { ErrorCode } from "../../common/enums/error-code.enum";
import { compareValue, hashValue } from "../../common/utils/bcrypt";
import { refreshTokenSignOptions, RefreshTPayload, signJwtToken, verifyJwtToken } from "../../common/utils/jwt";
import { generateOTP, generateUniqueCode } from "../../common/utils/uuid";
import { deleteKey, getKey, setKeyWithTTL } from "../../common/utils/redis";
import { sendEmail } from "../../mailer/mailer";
import { mfaOtpTemplate, passwordResetTemplate, verifyEmailTemplate } from "../../mailer/template/template";
import { config } from "../../config/app.config";
import redis from "../../common/service/redis.service";
import { anHourFromNow, calculateExpirationDate, ONE_DAY_IN_MS } from "../../common/utils/date-time";

export class AuthService{
    public async register(registerData: RegisterDto) {
        if (registerData.email) {
            const existingUser = await db
                .select()
                .from(login)
                .where(eq(login.email, registerData.email));

            if (existingUser.length > 0) {  
                throw new BadRequestException(
                    "User already exists with this email",
                    ErrorCode.AUTH_EMAIL_ALREADY_EXISTS
                );
            }
        }

        let hashedPassword: string | null = null;
        if (registerData.password) {
            hashedPassword = await hashValue(registerData.password!);
        }

        const userId = crypto.randomUUID(); 

        try {
            const [newUser] = await db.insert(users).values({
                id: userId, 
                student_id: registerData.student_id || null,
                name: registerData.name,
                gender: registerData.gender,
                department_id: registerData.department_id || null,
                std_year: registerData.std_year || null,
                userType: registerData.user_type,
                blood_type: registerData.blood_type || null,
                contact_number: registerData.contact_number
            }).returning();

        if(newUser){
            if (registerData.email && hashedPassword) {
                await db.insert(login).values({
                    user_id: newUser.id,
                    email: registerData.email,
                    password: hashedPassword,
                    role: registerData.user_type === "NON-STAFF" ? "STAFF" : registerData.user_type || "STUDENT",
                    verified: false
                });
            }

            if(newUser.userType === "HA"){
            let hashedSecret: string | null = null;
            hashedSecret = await hashValue(registerData.secret_word!)
             await db.insert(ha_details).values({
                ha_id: newUser.id,
                secret_key: hashedSecret,
                is_available: false,
                is_onLeave: false
            })
        }
        }
       
        const code = generateUniqueCode();

        const redisKey = `verification:code:${code}`;
        
        await setKeyWithTTL(redisKey, userId, 2700);

        const verificationUrl = `${config.APP_ORIGIN}/confirm-account?code=${code}`;
        
        await sendEmail({
            to: registerData.email!,
            ...verifyEmailTemplate(verificationUrl)
        });

            return { user: newUser };
        } catch (error: any) {
            throw new InternalServerException(
                error,
                ErrorCode.AUTH_REGISTRATION_FAILED,

            );
        }
    }
    public async login(loginData: LoginDto){
        const { email, password, userAgent } = loginData
        const user = await db.select().from(login).where(eq(login.email, email))
        if(user.length === 0){
            throw new BadRequestException(
            "Invalid email or password Provided",
            ErrorCode.AUTH_USER_NOT_FOUND
        )
        }
        if(user[0].verified === false){
            throw new BadRequestException(
            "Verify your email first",
            ErrorCode.AUTH_USER_NOT_FOUND
        )

        } 
        const isPasswordValid = await compareValue(password, user[0].password);
        if (!isPasswordValid){
            throw new BadRequestException(
                "Invalid email or password Provided",
                ErrorCode.AUTH_USER_NOT_FOUND
            )
        }
        if(user[0].mfa_required){
            const otp = generateOTP()
            const otpKey = `mfa:otp:${user[0].email}`
            await setKeyWithTTL(otpKey, otp, 300)
            await sendEmail({
                to: user[0].email,
                ...mfaOtpTemplate(otp)
            })
            return {
                user: null,
                accessToken: null,
                refreshToken: null,
                mfaRequired: true
            }
        }  
        let sessionId = user[0].user_id
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
        .where(eq(users.id, user[0].user_id))
        .limit(1);

        const availabilityKey = `ha:available`;
        const availabilityData = await redis.get(availabilityKey);

        const leaveKey = `ha:leave`;
        const leaveData = await redis.get(leaveKey);
        let is_onLeave = false
        let isCurrent = true
        let onLeaveData = []
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
        if (leaveData) {
            const ha_data = typeof leaveData === "string" ? JSON.parse(leaveData) : leaveData;
            is_onLeave = ha_data.is_onLeave;
            onLeaveData = ha_data;
        }


    if (!userDetails.length) {
        throw new NotFoundException("User details not found", ErrorCode.AUTH_USER_NOT_FOUND);
    }

    const fullUser = userDetails[0];
        try {
            const [session] = await db.insert(sessions).values({
                user_id: user[0].user_id,
                user_agent: userAgent || "Unknown",
                expired_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) 
            }).returning();
                sessionId = session.id; 
                const sessionKey = `session:${sessionId}`;
                const sessionData = {
                    sessionid: sessionId,
                    userId: user[0].user_id,
                    userAgent,
                    createdAt: session.created_at,
                    expiredAt: session.expired_at,
                    email: user[0]?.email, // 7 days
                    ...fullUser,
                    mfaRequired: user[0].mfa_required,
                    isAvailable: isCurrent,
                    isOnLeave: is_onLeave,
                    ...onLeaveData

                };

                await redis.set(sessionKey, JSON.stringify(sessionData), { ex: 60 * 60 * 24  });
        } catch (error: any) {
            throw new InternalServerException(
                "Failed to insert in the session table",
                ErrorCode.FAILED_SESSSION
            )
        }

        const accessToken = signJwtToken({
            userId: user[0].user_id,
            sessionId
        })
        const refreshToken = signJwtToken(
        {
            sessionId
        },
        refreshTokenSignOptions
        )
        
        return {
            user: {
                id: user[0].user_id,
                email: user[0].email,
                role: user[0].role,
                verified: user[0].verified
            },
            accessToken,
            refreshToken,
            mfaRequired: false
        }

    }
    public async verifyEmail(code: string){
        const redisKey = `verification:code:${code}`;
        const userId = await getKey(redisKey);
    
        if (!userId) {
            throw new BadRequestException(
                "Invalid or expired verification code", 
                ErrorCode.VERIFICATION_ERROR);
        }

       try {

        await db.update(login)
                .set({ verified: true })
                .where(eq(login.user_id, userId as string));


        await deleteKey(redisKey); 
       } catch (error: any) {
        throw new InternalServerException(error,
               ErrorCode.VERIFICATION_ERROR)
       }
    }

    public async resendVerificationEmail(email: string) {
       try {
             const user = await db.select().from(login).where(eq(login.email, email));

            if (!user.length) {
                throw new NotFoundException("User not found.");
            }

            if (user[0].verified) {
                throw new BadRequestException("This email is already verified.");
            }
            const redisKey = `verification:code:${user[0].user_id}`;
            

            await redis.del(redisKey);


            const newCode = generateUniqueCode();
            const newredisKey = `verification:code:${newCode}`;
        
            await setKeyWithTTL(newredisKey,  user[0].user_id, 2700);
            

            const verificationUrl = `${config.APP_ORIGIN}/confirm-account?code=${newCode}`;

            await sendEmail({
                to: email,
                ...verifyEmailTemplate(verificationUrl),
            });

        return { message: "Verification email resent successfully." };
       } catch (error) {
        throw new InternalServerException(
            "Failed to resend Verification Email",
            ErrorCode.AUTH_USER_NOT_FOUND
        )
       }
    }

    public async forgotPassword(email: string) {
        const user = await db.select().from(login).where(eq(login.email, email));

        if (user.length === 0) {
            throw new NotFoundException("User not found");
        }
        const userId = user[0].user_id;

        const rateLimitKey = `password-reset:rate-limit:${userId}`;

        const requestCount = await redis.incr(rateLimitKey); 

        if (requestCount === 1) {
            await redis.expire(rateLimitKey, 180); 
        } else if (requestCount > 2) {
            throw new BadRequestException(
                "Too many requests, try again later",
                ErrorCode.AUTH_TOO_MANY_ATTEMPTS
            );
        }

        const expiresAt = anHourFromNow();
        const resetCode = generateUniqueCode();
        const redisKey = `password-reset:code:${resetCode}`;
        await redis.set(redisKey, userId, { ex: 240 }); 

 
        const resetLink = `${config.APP_ORIGIN}/reset-password?code=${resetCode}&exp=${expiresAt.getTime()}`;
        const { data, error } = await sendEmail({
            to: email,
            ...passwordResetTemplate(resetLink)
        });

        if (!data) {
            throw new InternalServerException(`${error?.name} - ${error?.message}`);
        }

        return {
            url: resetLink,
            emailId: data.response
        };
    }
    public async resetPassword({ password, verificationCode }: resetPasswordDto) {

        const redisKey = `password-reset:code:${verificationCode}`;
        const userId = await getKey(redisKey);

        if (!userId) {
            throw new NotFoundException("Invalid or expired Verification Code");
        }

        try {
            const hashedPassword = await hashValue(password);

            const [updatedUser] = await db.update(login)
                .set({ password: hashedPassword })
                .where(eq(login.user_id, userId as string))
                .returning();

            if (!updatedUser) {
                throw new BadRequestException("Failed to reset password");
            }

            await deleteKey(redisKey);

            await db.delete(sessions).where(eq(sessions.user_id, userId as string));

            return {
                message: "Password reset successful",
            };
        } catch (error: any) {
            throw new InternalServerException(error, ErrorCode.AUTH_PASSOWORD_WRONG);
        }
    }
    public async  refreshToken(refreshToken: string) {
        const { payload } = verifyJwtToken<RefreshTPayload>(refreshToken, {
            secret: refreshTokenSignOptions.secret
        });

        if (!payload) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        const [session] = await db.select().from(sessions).where(eq(sessions.id, payload.sessionId));

        if (!session) {
            throw new UnauthorizedException("Session does not exist");
        }

        const now = Date.now();
        const sessionExpiry = new Date(session.expired_at).getTime();


        if (sessionExpiry <= now) {
            throw new UnauthorizedException("Session expired");
        }


        const sessionRequiresRefresh = sessionExpiry - now <= ONE_DAY_IN_MS;
        let newRefreshToken: string | undefined;

        if (sessionRequiresRefresh) {
            const newExpiry = calculateExpirationDate(config.JWT.REFRESH_EXPIRES_IN);

            await db.update(sessions)
                .set({ expired_at: newExpiry })
                .where(eq(sessions.id, session.id));

            newRefreshToken = signJwtToken(
                { sessionId: session.id },
                refreshTokenSignOptions
            );
        }

        const accessToken = signJwtToken({
            userId: session.user_id,
            sessionId: session.id
        });

        return {
            accessToken,
            newRefreshToken
        };
    }
    public async logout(sessionId: string){
        return await db.delete(sessions).where(eq(sessions.id, sessionId))
    }

}