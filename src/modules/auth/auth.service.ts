import { eq } from "drizzle-orm";
import { LoginDto, RegisterDto } from "../../common/interface/auth.interface";
import { db } from "../../database/drizzle";
import { login, users, sessions } from "../../database/schema/schema";
import { BadRequestException, InternalServerException } from "../../common/utils/catch-errors";
import { ErrorCode } from "../../common/enums/error-code.enum";
import { compareValue, hashValue } from "../../common/utils/bcrypt";
import { refreshTokenSignOptions, signJwtToken } from "../../common/utils/jwt";
import { generateUniqueCode } from "../../common/utils/uuid";
import { deleteKey, getKey, setKeyWithTTL } from "../../common/utils/redis";
import { sendEmail } from "../../mailer/mailer";
import { verifyEmailTemplate } from "../../mailer/template/template";
import { config } from "../../config/app.config";

export class AuthService{
    public async register(registerData: RegisterDto) {
        if (registerData.email) {
            const existingUser = await db
                .select()
                .from(login)
                .where(eq(login.email, registerData.email));

            if (existingUser.length > 0) {  // Fix: check length
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

        const userId = crypto.randomUUID(); // Generate UUID once

        try {
            // Create new user in the users table
            const [newUser] = await db.insert(users).values({
                id: userId, // Generate UUID for user
                student_id: registerData.student_id || null,
                name: registerData.name,
                gender: registerData.gender,
                department_id: registerData.department_id || null,
                std_year: registerData.std_year || null,
                userType: registerData.user_type,
                blood_type: registerData.blood_type || null,
                contact_number: registerData.contact_number
            }).returning();

            // If user has email & password, create login entry
        if(newUser){
            if (registerData.email && hashedPassword) {
                await db.insert(login).values({
                    id: crypto.randomUUID(),
                    user_id: newUser.id,
                    email: registerData.email,
                    password: hashedPassword,
                    role: registerData.role || "STUDENT",
                    verified: false
                });
            }
            }
        const code = generateUniqueCode();
        // Build a Redis key using the userId
        const redisKey = `verification:code:${code}`;
        
        await setKeyWithTTL(redisKey, userId, 2700);

        // Construct the verification URL
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
        let sessionId = user[0].user_id
        try {
            const [session] = await db.insert(sessions).values({
                user_id: user[0].user_id,
                user_agent: userAgent || "Unknown",
                expired_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) 
            }).returning();
                sessionId = session.id; 
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
                id: user[0].id,
                email: user[0].email,
                role: user[0].role,
                verified: user[0].verified
            },
            accessToken,
            refreshToken,
        }

    }
    public async verifyEmail(code: string){
        const redisKey = `verification:code:${code}`;
        const userId = await getKey(redisKey);
        console.log(userId)
    
        if (!userId) {
            throw new BadRequestException(
                "Invalid or expired verification code", 
                ErrorCode.VERIFICATION_ERROR);
        }

       try {
         // Update the login record to mark the email as verified
        await db.update(login)
                .set({ verified: true })
                .where(eq(login.user_id, userId as string));

        // Remove the verification code from Redis now that it's been used
        await deleteKey(redisKey); 
       } catch (error: any) {
        throw new InternalServerException(error,
               ErrorCode.VERIFICATION_ERROR)
       }
    }
    public async logout(sessionId: string){
        return await db.delete(sessions).where(eq(sessions.id, sessionId))
    }

}