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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_1 = require("../../database/drizzle");
const schema_1 = require("../../database/schema/schema");
const catch_errors_1 = require("../../common/utils/catch-errors");
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
class SessionService {
    getAllSessionsBySessionId(userId, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionRecords = yield drizzle_1.db
                    .select()
                    .from(schema_1.sessions)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.sessions.user_id, userId), (0, drizzle_orm_1.gt)(schema_1.sessions.expired_at, new Date())))
                    .orderBy((0, drizzle_orm_1.desc)(schema_1.sessions.created_at));
                return sessionRecords.map(session => (Object.assign(Object.assign({}, session), { isCurrent: session.id === sessionId })));
            }
            catch (error) {
                console.error("Error fetching sessions:", error);
                throw new catch_errors_1.InternalServerException("Failed to fetch sessions.");
            }
        });
    }
    getSessionById(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionKey = `session:${sessionId}`;
            const sessionData = yield redis_service_1.default.get(sessionKey);
            const haData = yield redis_service_1.default.get("ha:available");
            const leaveKey = `ha:leave`;
            const leaveData = yield redis_service_1.default.get(leaveKey);
            let is_onLeave = false;
            let onLeaveData = [];
            if (sessionData && haData) {
                let parsedSession = typeof sessionData === "string" ? JSON.parse(sessionData) : sessionData;
                const haDataParsed = typeof haData === "string" ? JSON.parse(haData) : haData;
                parsedSession.is_available = haDataParsed.is_available;
                if (leaveData) {
                    const haLeaveData = typeof leaveData === "string" ? JSON.parse(leaveData) : leaveData;
                    const { is_onLeave } = haLeaveData, restLeaveData = __rest(haLeaveData, ["is_onLeave"]);
                    parsedSession.is_onLeave = is_onLeave;
                    parsedSession = Object.assign(Object.assign({}, parsedSession), restLeaveData);
                }
                return { user: parsedSession };
            }
            const result = yield drizzle_1.db
                .select({
                session_id: schema_1.sessions.id,
                user_agent: schema_1.sessions.user_agent || "Unknown",
                createdAt: schema_1.sessions.created_at,
                expiredAt: schema_1.sessions.expired_at,
                email: schema_1.login.email,
                user_id: schema_1.users.id,
                student_id: schema_1.users.student_id,
                name: schema_1.users.name,
                gender: schema_1.users.gender,
                department_id: schema_1.users.department_id,
                std_year: schema_1.users.std_year,
                userType: schema_1.users.userType,
                blood_type: schema_1.users.blood_type,
                contact_number: schema_1.users.contact_number,
                profile_url: schema_1.users.profile_url,
                mfa_required: schema_1.login.mfa_required
            })
                .from(schema_1.sessions)
                .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.sessions.user_id, schema_1.users.id))
                .innerJoin(schema_1.login, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.login.user_id))
                .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId));
            if (!result.length) {
                throw new catch_errors_1.NotFoundException("Session not found.");
            }
            const sessionResult = result[0];
            const availabilityKey = `ha:available`;
            const availabilityData = yield redis_service_1.default.get(availabilityKey);
            let isCurrent = true;
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
            const newResult = Object.assign({ id: sessionResult.session_id, userId: sessionResult.user_id, userAgent: sessionResult.user_agent, createdAt: sessionResult.createdAt, expiredAt: sessionResult.expiredAt, email: sessionResult.email, 
                // Flatten the user data
                student_id: sessionResult.student_id, name: sessionResult.name, gender: sessionResult.gender, department_id: sessionResult.department_id, std_year: sessionResult.std_year, userType: sessionResult.userType, blood_type: sessionResult.blood_type, contact_number: sessionResult.contact_number, mfa_required: schema_1.login.mfa_required, profile_url: sessionResult.profile_url, is_available: isCurrent, isOnLeave: is_onLeave }, onLeaveData);
            return { user: newResult };
        });
    }
    deleteSession(sessionId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionKey = `session:${sessionId}`;
            const redisSession = yield redis_service_1.default.get(sessionKey);
            // Delete session from Redis if it exists
            if (redisSession) {
                yield redis_service_1.default.del(sessionKey);
                // Ensure the session exists and belongs to the user
                const session = yield drizzle_1.db
                    .select({ user_id: schema_1.sessions.user_id })
                    .from(schema_1.sessions)
                    .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId))
                    .limit(1);
                if (!session.length || session[0].user_id !== userId) {
                    throw new catch_errors_1.NotFoundException("Session not found or unauthorized to delete.", "AUTH_UNAUTHORIZED_ACCESS" /* ErrorCode.AUTH_UNAUTHORIZED_ACCESS */);
                }
                const deletedSession = yield drizzle_1.db
                    .delete(schema_1.sessions)
                    .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId))
                    .returning();
                if (!deletedSession.length) {
                    throw new catch_errors_1.NotFoundException("Session already deleted.", "AUTH_NOT_FOUND" /* ErrorCode.AUTH_NOT_FOUND */);
                }
            }
        });
    }
    deleteAllSessions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const userSessions = yield drizzle_1.db
                .select({ id: schema_1.sessions.id })
                .from(schema_1.sessions)
                .where((0, drizzle_orm_1.eq)(schema_1.sessions.user_id, userId));
            if (!userSessions.length) {
                throw new catch_errors_1.NotFoundException("No active sessions found for this user.");
            }
            // Build Redis keys for each session and delete them
            const redisKeys = userSessions.map(session => `session:${session.id}`);
            if (redisKeys.length > 0) {
                yield redis_service_1.default.del(...redisKeys);
            }
            // Delete all sessions from PostgreSQL for this user
            const response = yield drizzle_1.db.delete(schema_1.sessions).where((0, drizzle_orm_1.eq)(schema_1.sessions.user_id, userId));
            if (!response) {
                throw new catch_errors_1.InternalServerException("Failed to delete sessions222.");
            }
            return { message: "All sessions removed successfully" };
        });
    }
}
exports.SessionService = SessionService;
