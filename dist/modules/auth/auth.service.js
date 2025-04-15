"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_1 = require("../../database/drizzle");
const schema_1 = require("../../database/schema/schema");
const catch_errors_1 = require("../../common/utils/catch-errors");
const bcrypt_1 = require("../../common/utils/bcrypt");
const jwt_1 = require("../../common/utils/jwt");
const uuid_1 = require("../../common/utils/uuid");
const redis_1 = require("../../common/utils/redis");
const mailer_1 = require("../../mailer/mailer");
const template_1 = require("../../mailer/template/template");
const app_config_1 = require("../../config/app.config");
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
const date_time_1 = require("../../common/utils/date-time");
class AuthService {
    register(registerData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (registerData.email) {
                const existingUser = yield drizzle_1.db
                    .select()
                    .from(schema_1.login)
                    .where((0, drizzle_orm_1.eq)(schema_1.login.email, registerData.email));
                if (existingUser.length > 0) {
                    throw new catch_errors_1.BadRequestException("User already exists with this email", "AUTH_EMAIL_ALREADY_EXISTS" /* ErrorCode.AUTH_EMAIL_ALREADY_EXISTS */);
                }
            }
            let hashedPassword = null;
            if (registerData.password) {
                hashedPassword = yield (0, bcrypt_1.hashValue)(registerData.password);
            }
            const userId = crypto.randomUUID();
            try {
                const [newUser] = yield drizzle_1.db.insert(schema_1.users).values({
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
                if (newUser) {
                    let newRole = "";
                    if (newUser.userType !== "HA") {
                        newRole = newUser.userType === "NON-STAFF" ? "STAFF" : newUser.userType || "STUDENT";
                    }
                    else {
                        newRole = "HA";
                    }
                    if (registerData.email && hashedPassword) {
                        yield drizzle_1.db.insert(schema_1.login).values({
                            user_id: newUser.id,
                            email: registerData.email,
                            password: hashedPassword,
                            role: newRole,
                            verified: false
                        });
                    }
                    if (newUser.userType === "HA") {
                        let hashedSecret = null;
                        hashedSecret = yield (0, bcrypt_1.hashValue)(registerData.secret_word);
                        yield drizzle_1.db.insert(schema_1.ha_details).values({
                            ha_id: newUser.id,
                            secret_key: hashedSecret,
                            is_available: false,
                            is_onLeave: false
                        });
                    }
                }
                const code = (0, uuid_1.generateUniqueCode)();
                const redisKey = `verification:code:${code}`;
                yield (0, redis_1.setKeyWithTTL)(redisKey, userId, 2700);
                const verificationUrl = `${app_config_1.config.APP_ORIGIN}/confirm-account?code=${code}`;
                yield (0, mailer_1.sendEmail)(Object.assign({ to: registerData.email }, (0, template_1.verifyEmailTemplate)(verificationUrl)));
                return { user: newUser };
            }
            catch (error) {
                throw new catch_errors_1.InternalServerException(error, "AUTH_REGISTRATION_FAILED" /* ErrorCode.AUTH_REGISTRATION_FAILED */);
            }
        });
    }
    login(loginData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { email, password, userAgent } = loginData;
            const user = yield drizzle_1.db.select().from(schema_1.login).where((0, drizzle_orm_1.eq)(schema_1.login.email, email));
            if (user.length === 0) {
                throw new catch_errors_1.BadRequestException("Invalid email or password Provided", "AUTH_USER_NOT_FOUND" /* ErrorCode.AUTH_USER_NOT_FOUND */);
            }
            if (user[0].verified === false) {
                throw new catch_errors_1.BadRequestException("Verify your email first", "AUTH_USER_NOT_FOUND" /* ErrorCode.AUTH_USER_NOT_FOUND */);
            }
            const isPasswordValid = yield (0, bcrypt_1.compareValue)(password, user[0].password);
            if (!isPasswordValid) {
                throw new catch_errors_1.BadRequestException("Invalid email or password Provided", "AUTH_USER_NOT_FOUND" /* ErrorCode.AUTH_USER_NOT_FOUND */);
            }
            if (user[0].mfa_required) {
                const otp = (0, uuid_1.generateOTP)();
                const otpKey = `mfa:otp:${user[0].email}`;
                yield (0, redis_1.setKeyWithTTL)(otpKey, otp, 300);
                yield (0, mailer_1.sendEmail)(Object.assign({ to: user[0].email }, (0, template_1.mfaOtpTemplate)(otp)));
                return {
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    mfaRequired: true
                };
            }
            let sessionId = user[0].user_id;
            const userDetails = yield drizzle_1.db
                .select({
                id: schema_1.users.id,
                student_id: schema_1.users.student_id,
                name: schema_1.users.name,
                gender: schema_1.users.gender,
                department_id: schema_1.users.department_id,
                std_year: schema_1.users.std_year,
                userType: schema_1.users.userType,
                blood_type: schema_1.users.blood_type,
                contact_number: schema_1.users.contact_number,
                profile_url: schema_1.users.profile_url,
                HA_Contact_Number: (0, drizzle_orm_1.sql) `(SELECT contact_number FROM ${schema_1.users} WHERE ${schema_1.users.userType} = 'HA' LIMIT 1)`
            })
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, user[0].user_id))
                .limit(1);
            const availabilityKey = `ha:available`;
            const availabilityData = yield redis_service_1.default.get(availabilityKey);
            const leaveKey = `ha:leave`;
            const leaveData = yield redis_service_1.default.get(leaveKey);
            let is_onLeave = false;
            let isCurrent = true;
            let onLeaveData = [];
            if (availabilityData) {
                const ha_data = typeof availabilityData === "string" ? JSON.parse(availabilityData) : availabilityData;
                isCurrent = ha_data.is_available;
            }
            else {
                const [haAvailability] = yield drizzle_1.db
                    .select({ is_available: schema_1.ha_details.is_available })
                    .from(schema_1.ha_details)
                    .limit(1);
                isCurrent = haAvailability === null || haAvailability === void 0 ? void 0 : haAvailability.is_available;
            }
            if (leaveData) {
                const ha_data = typeof leaveData === "string" ? JSON.parse(leaveData) : leaveData;
                is_onLeave = ha_data.is_onLeave;
                onLeaveData = ha_data;
            }
            if (!userDetails.length) {
                throw new catch_errors_1.NotFoundException("User details not found", "AUTH_USER_NOT_FOUND" /* ErrorCode.AUTH_USER_NOT_FOUND */);
            }
            const fullUser = userDetails[0];
            try {
                const [session] = yield drizzle_1.db.insert(schema_1.sessions).values({
                    user_id: user[0].user_id,
                    user_agent: userAgent || "Unknown",
                    expired_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
                }).returning();
                sessionId = session.id;
                const sessionKey = `session:${sessionId}`;
                const sessionData = Object.assign(Object.assign(Object.assign({ sessionid: sessionId, userId: user[0].user_id, userAgent, createdAt: session.created_at, expiredAt: session.expired_at, email: (_a = user[0]) === null || _a === void 0 ? void 0 : _a.email }, fullUser), { mfaRequired: user[0].mfa_required, isAvailable: isCurrent, isOnLeave: is_onLeave }), onLeaveData);
                yield redis_service_1.default.set(sessionKey, JSON.stringify(sessionData), { ex: 60 * 60 * 24 });
            }
            catch (error) {
                throw new catch_errors_1.InternalServerException("Failed to insert in the session table", "FAILED_TO_CREATE_SESSION" /* ErrorCode.FAILED_SESSSION */);
            }
            const accessToken = (0, jwt_1.signJwtToken)({
                userId: user[0].user_id,
                sessionId,
                userType: user[0].role
            });
            const refreshToken = (0, jwt_1.signJwtToken)({
                sessionId
            }, jwt_1.refreshTokenSignOptions);
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
            };
        });
    }
    verifyEmail(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const redisKey = `verification:code:${code}`;
            const userId = yield (0, redis_1.getKey)(redisKey);
            if (!userId) {
                throw new catch_errors_1.BadRequestException("Invalid or expired verification code", "VERIFICATION_ERROR" /* ErrorCode.VERIFICATION_ERROR */);
            }
            try {
                yield drizzle_1.db.update(schema_1.login)
                    .set({ verified: true })
                    .where((0, drizzle_orm_1.eq)(schema_1.login.user_id, userId));
                yield (0, redis_1.deleteKey)(redisKey);
            }
            catch (error) {
                throw new catch_errors_1.InternalServerException(error, "VERIFICATION_ERROR" /* ErrorCode.VERIFICATION_ERROR */);
            }
        });
    }
    resendVerificationEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield drizzle_1.db.select().from(schema_1.login).where((0, drizzle_orm_1.eq)(schema_1.login.email, email));
                if (!user.length) {
                    throw new catch_errors_1.NotFoundException("User not found.");
                }
                if (user[0].verified) {
                    throw new catch_errors_1.BadRequestException("This email is already verified.");
                }
                const redisKey = `verification:code:${user[0].user_id}`;
                yield redis_service_1.default.del(redisKey);
                const newCode = (0, uuid_1.generateUniqueCode)();
                const newredisKey = `verification:code:${newCode}`;
                yield (0, redis_1.setKeyWithTTL)(newredisKey, user[0].user_id, 2700);
                const verificationUrl = `${app_config_1.config.APP_ORIGIN}/confirm-account?code=${newCode}`;
                yield (0, mailer_1.sendEmail)(Object.assign({ to: email }, (0, template_1.verifyEmailTemplate)(verificationUrl)));
                return { message: "Verification email resent successfully." };
            }
            catch (error) {
                throw new catch_errors_1.InternalServerException("Failed to resend Verification Email", "AUTH_USER_NOT_FOUND" /* ErrorCode.AUTH_USER_NOT_FOUND */);
            }
        });
    }
    forgotPassword(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield drizzle_1.db.select().from(schema_1.login).where((0, drizzle_orm_1.eq)(schema_1.login.email, email));
            if (user.length === 0) {
                throw new catch_errors_1.NotFoundException("User not found");
            }
            const userId = user[0].user_id;
            const rateLimitKey = `password-reset:rate-limit:${userId}`;
            const requestCount = yield redis_service_1.default.incr(rateLimitKey);
            if (requestCount === 1) {
                yield redis_service_1.default.expire(rateLimitKey, 180);
            }
            else if (requestCount > 2) {
                throw new catch_errors_1.BadRequestException("Too many requests, try again later", "AUTH_TOO_MANY_ATTEMPTS" /* ErrorCode.AUTH_TOO_MANY_ATTEMPTS */);
            }
            const expiresAt = (0, date_time_1.anHourFromNow)();
            const resetCode = (0, uuid_1.generateUniqueCode)();
            const redisKey = `password-reset:code:${resetCode}`;
            yield redis_service_1.default.set(redisKey, userId, { ex: 240 });
            const resetLink = `${app_config_1.config.APP_ORIGIN}/reset-password?code=${resetCode}&exp=${expiresAt.getTime()}`;
            const { data, error } = yield (0, mailer_1.sendEmail)(Object.assign({ to: email }, (0, template_1.passwordResetTemplate)(resetLink)));
            if (!data) {
                throw new catch_errors_1.InternalServerException(`${error === null || error === void 0 ? void 0 : error.name} - ${error === null || error === void 0 ? void 0 : error.message}`);
            }
            return {
                url: resetLink,
                emailId: data.response
            };
        });
    }
    resetPassword(_a) {
        return __awaiter(this, arguments, void 0, function* ({ password, verificationCode }) {
            const redisKey = `password-reset:code:${verificationCode}`;
            const userId = yield (0, redis_1.getKey)(redisKey);
            if (!userId) {
                throw new catch_errors_1.NotFoundException("Invalid or expired Verification Code");
            }
            try {
                const hashedPassword = yield (0, bcrypt_1.hashValue)(password);
                const [updatedUser] = yield drizzle_1.db.update(schema_1.login)
                    .set({ password: hashedPassword })
                    .where((0, drizzle_orm_1.eq)(schema_1.login.user_id, userId))
                    .returning();
                if (!updatedUser) {
                    throw new catch_errors_1.BadRequestException("Failed to reset password");
                }
                yield (0, redis_1.deleteKey)(redisKey);
                yield drizzle_1.db.delete(schema_1.sessions).where((0, drizzle_orm_1.eq)(schema_1.sessions.user_id, userId));
                return {
                    message: "Password reset successful",
                };
            }
            catch (error) {
                throw new catch_errors_1.InternalServerException(error, "AUTH_PASSWORD_DOESNOT_MATCH" /* ErrorCode.AUTH_PASSOWORD_WRONG */);
            }
        });
    }
    refreshToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const { payload } = (0, jwt_1.verifyJwtToken)(refreshToken, {
                secret: jwt_1.refreshTokenSignOptions.secret
            });
            if (!payload) {
                throw new catch_errors_1.UnauthorizedException("Invalid refresh token");
            }
            const [session] = yield drizzle_1.db.select().from(schema_1.sessions).where((0, drizzle_orm_1.eq)(schema_1.sessions.id, payload.sessionId));
            if (!session) {
                throw new catch_errors_1.UnauthorizedException("Session does not exist");
            }
            const now = Date.now();
            const sessionExpiry = new Date(session.expired_at).getTime();
            if (sessionExpiry <= now) {
                throw new catch_errors_1.UnauthorizedException("Session expired");
            }
            const sessionRequiresRefresh = sessionExpiry - now <= date_time_1.ONE_DAY_IN_MS;
            let newRefreshToken;
            if (sessionRequiresRefresh) {
                const newExpiry = (0, date_time_1.calculateExpirationDate)(app_config_1.config.JWT.REFRESH_EXPIRES_IN);
                yield drizzle_1.db.update(schema_1.sessions)
                    .set({ expired_at: newExpiry })
                    .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, session.id));
                newRefreshToken = (0, jwt_1.signJwtToken)({ sessionId: session.id }, jwt_1.refreshTokenSignOptions);
            }
            const accessToken = (0, jwt_1.signJwtToken)({
                userId: session.user_id,
                sessionId: session.id
            });
            return {
                accessToken,
                newRefreshToken
            };
        });
    }
    logout(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield drizzle_1.db.delete(schema_1.sessions).where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId));
        });
    }
}
exports.AuthService = AuthService;
