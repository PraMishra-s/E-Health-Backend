import { eq } from "drizzle-orm";
import { LoginDto, RegisterDto } from "../../common/interface/auth.interface";
import { db } from "../../database/drizzle";
import { login, users } from "../../database/schema/schema";
import { BadRequestException, InternalServerException } from "../../common/utils/catch-errors";
import { ErrorCode } from "../../common/enums/error-code.enum";
import { compareValue, hashValue } from "../../common/utils/bcrypt";
import { refreshTokenSignOptions, signJwtToken } from "../../common/utils/jwt";

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
                id: crypto.randomUUID(), // Generate UUID for user
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
        if(!user){
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
        const accessToken = signJwtToken({
            userId: user[0].id,
            sessionId: user[0].id
        })
        const refreshToken = signJwtToken(
        {
            sessionId: user[0].id
        },
        refreshTokenSignOptions
        )
        return {
            user,
            accessToken,
            refreshToken,
        }

    }
}