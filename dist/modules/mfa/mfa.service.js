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
exports.MFAService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const catch_errors_1 = require("../../common/utils/catch-errors");
const drizzle_1 = require("../../database/drizzle");
const schema_1 = require("../../database/schema/schema");
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
const jwt_1 = require("../../common/utils/jwt");
class MFAService {
    invokeMFASetup(userId, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userId) {
                throw new catch_errors_1.UnauthorizedException("User not found for the session.");
            }
            const updatedUser = yield drizzle_1.db
                .update(schema_1.login)
                .set({ mfa_required: true })
                .where((0, drizzle_orm_1.eq)(schema_1.login.user_id, userId))
                .returning();
            if (!updatedUser.length) {
                throw new catch_errors_1.InternalServerException("Failed to enable MFA", "ACCESS_FORBIDDEN" /* ErrorCode.ACCESS_FORBIDDEN */);
            }
            const sessionKey = `session:${sessionId}`;
            const sessionData = yield redis_service_1.default.get(sessionKey);
            if (sessionData) {
                const session = typeof sessionData === "string" ? JSON.parse(sessionData) : sessionData;
                session.mfa_required = true;
                yield redis_service_1.default.set(sessionKey, JSON.stringify(session));
            }
            const sanitizedUser = {
                id: updatedUser[0].user_id,
                email: updatedUser[0].email,
                role: updatedUser[0].role,
                verified: updatedUser[0].verified,
                mfa_required: updatedUser[0].mfa_required
            };
            return sanitizedUser;
        });
    }
    verifyMFAForLogin(code, email, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            const userResult = yield drizzle_1.db.select().from(schema_1.login).where((0, drizzle_orm_1.eq)(schema_1.login.email, email));
            if (userResult.length === 0) {
                throw new catch_errors_1.NotFoundException("User not found.");
            }
            const user = userResult[0];
            if (!user.mfa_required) {
                throw new catch_errors_1.BadRequestException("MFA is not enabled for this user.");
            }
            const otpKey = `mfa:otp:${user.email}`;
            const storedOtp = yield redis_service_1.default.get(otpKey);
            if (!storedOtp || storedOtp.toString().trim() !== code.toString().trim()) {
                throw new catch_errors_1.BadRequestException("Invalid or expired OTP.");
            }
            yield redis_service_1.default.del(otpKey);
            let sessionId;
            try {
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
                    profile_url: schema_1.users.profile_url
                })
                    .from(schema_1.users)
                    .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.user_id))
                    .limit(1);
                if (!userDetails.length) {
                    throw new catch_errors_1.NotFoundException("User details not found", "AUTH_USER_NOT_FOUND" /* ErrorCode.AUTH_USER_NOT_FOUND */);
                }
                const fullUser = userDetails[0];
                try {
                    const [session] = yield drizzle_1.db.insert(schema_1.sessions).values({
                        user_id: user.user_id,
                        user_agent: userAgent || "Unknown",
                        expired_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
                    }).returning();
                    sessionId = session.id;
                    const sessionKey = `session:${sessionId}`;
                    const sessionData = Object.assign(Object.assign({ sessionid: sessionId, userId: user.user_id, userAgent, createdAt: session.created_at, expiredAt: session.expired_at, email: user === null || user === void 0 ? void 0 : user.email }, fullUser), { mfa_required: user.mfa_required });
                    yield redis_service_1.default.set(sessionKey, JSON.stringify(sessionData), { ex: 60 * 60 * 24 * 7 });
                }
                catch (error) {
                    throw new catch_errors_1.InternalServerException("Failed to insert in the session table", "FAILED_TO_CREATE_SESSION" /* ErrorCode.FAILED_SESSSION */);
                }
            }
            catch (error) {
                throw new catch_errors_1.InternalServerException("Failed to create session after MFA", "AUTH_INVALID_TOKEN" /* ErrorCode.AUTH_INVALID_TOKEN */);
            }
            const accessToken = (0, jwt_1.signJwtToken)({
                userId: user.user_id,
                sessionId,
                userType: user.role,
            });
            const refreshToken = (0, jwt_1.signJwtToken)({ sessionId }, jwt_1.refreshTokenSignOptions);
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
        });
    }
    revokeMFA(userId, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedUser = yield drizzle_1.db
                .update(schema_1.login)
                .set({ mfa_required: false })
                .where((0, drizzle_orm_1.eq)(schema_1.login.user_id, userId))
                .returning();
            if (!updatedUser.length) {
                throw new catch_errors_1.NotFoundException("User not found or MFA already disabled.");
            }
            const sessionKey = `session:${sessionId}`;
            const sessionData = yield redis_service_1.default.get(sessionKey);
            if (sessionData) {
                const session = typeof sessionData === "string" ? JSON.parse(sessionData) : sessionData;
                session.mfa_required = false;
                yield redis_service_1.default.set(sessionKey, JSON.stringify(session));
            }
            return { message: "MFA successfully disabled." };
        });
    }
}
exports.MFAService = MFAService;
