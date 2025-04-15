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
exports.UserService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_1 = require("../../database/drizzle");
const schema_1 = require("../../database/schema/schema");
const catch_errors_1 = require("../../common/utils/catch-errors");
const bcrypt_1 = require("../../common/utils/bcrypt");
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
class UserService {
    updateUser(userId, updatedData, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [updatedUser] = yield drizzle_1.db
                    .update(schema_1.users)
                    .set(updatedData)
                    .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
                    .returning();
                if (!updatedUser) {
                    throw new catch_errors_1.NotFoundException("User not found or update failed.");
                }
                const sessionKey = `session:${sessionId}`;
                const sessionData = yield redis_service_1.default.get(sessionKey);
                console.log(sessionKey);
                if (sessionData) {
                    const session = typeof sessionData === "string" ? JSON.parse(sessionData) : sessionData; // Ensure parsing only if needed
                    // Update the session user properties directly
                    session.name = updatedData.name;
                    session.gender = updatedData.gender;
                    session.contact_number = updatedData.contact_number;
                    session.blood_type = updatedData.blood_type;
                    session.department_id = updatedData.department_id;
                    yield redis_service_1.default.set(sessionKey, JSON.stringify(session));
                }
                return updatedUser;
            }
            catch (error) {
                throw new catch_errors_1.InternalServerException("Failed to update the user Details", "INTERNAL_SERVER_ERROR" /* ErrorCode.INTERNAL_SERVER_ERROR */);
            }
        });
    }
    changePassword(userId, currentPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const userResult = yield drizzle_1.db.select().from(schema_1.login).where((0, drizzle_orm_1.eq)(schema_1.login.user_id, userId));
            if (userResult.length === 0) {
                throw new catch_errors_1.NotFoundException("User not found.");
            }
            const user = userResult[0];
            const isPasswordValid = yield (0, bcrypt_1.compareValue)(currentPassword, user.password);
            if (!isPasswordValid) {
                throw new catch_errors_1.BadRequestException("Current password is incorrect.");
            }
            const hashedNewPassword = yield (0, bcrypt_1.hashValue)(newPassword);
            yield drizzle_1.db.update(schema_1.login)
                .set({ password: hashedNewPassword })
                .where((0, drizzle_orm_1.eq)(schema_1.login.user_id, userId));
            return;
        });
    }
    getEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userResult = yield drizzle_1.db
                    .select({ role: schema_1.login.role }) // Only query login table
                    .from(schema_1.login)
                    .where((0, drizzle_orm_1.eq)(schema_1.login.email, email))
                    .limit(1);
                if (!userResult.length) {
                    return "NOT_FOUND";
                }
                return userResult[0].role === "HA" ? "HA" : "USER";
            }
            catch (error) {
                throw new catch_errors_1.InternalServerException("Unable to find the Email", "AUTH_USER_NOT_FOUND" /* ErrorCode.AUTH_USER_NOT_FOUND */);
            }
        });
    }
    updateProfilePic(userId, updatedData, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [updatedUser] = yield drizzle_1.db
                .update(schema_1.users)
                .set({ profile_url: updatedData.profile_url })
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
                .returning();
            if (!updatedUser) {
                throw new catch_errors_1.NotFoundException("User not found or update failed.");
            }
            const sessionKey = `session:${sessionId}`;
            const sessionData = yield redis_service_1.default.get(sessionKey);
            if (sessionData) {
                const session = typeof sessionData === "string" ? JSON.parse(sessionData) : sessionData;
                session.profile_url = updatedData.profile_url;
                yield redis_service_1.default.set(sessionKey, JSON.stringify(session));
            }
            return updatedUser;
        });
    }
    getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield drizzle_1.db
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
                    family_members: (0, drizzle_orm_1.sql) `COALESCE(json_agg(json_build_object(
                        'id', staff_family_members.id,
                        'name', staff_family_members.name,
                        'gender', staff_family_members.gender,
                        'contact_number', staff_family_members.contact_number,
                        'relation', staff_family_members.relation,
                        'blood_type', staff_family_members.blood_type,
                        'date_of_birth', staff_family_members.date_of_birth
                    )) FILTER (WHERE staff_family_members.id IS NOT NULL), '[]')`.as("family_members")
                })
                    .from(schema_1.users)
                    .leftJoin(schema_1.staff_family_members, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.staff_family_members.staff_id)) // ✅ Join family members
                    .groupBy(schema_1.users.id); // ✅ Group by user ID to avoid duplicates
            }
            catch (error) {
                throw new catch_errors_1.InternalServerException("Failed to fetch users", "INTERNAL_SERVER_ERROR" /* ErrorCode.INTERNAL_SERVER_ERROR */);
            }
        });
    }
    getProgrammes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield drizzle_1.db
                    .select().from(schema_1.programmes);
            }
            catch (error) {
                throw new catch_errors_1.InternalServerException("Failed to fetch users", "INTERNAL_SERVER_ERROR" /* ErrorCode.INTERNAL_SERVER_ERROR */);
            }
        });
    }
    changeUserType(userId, type) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Update both users and login tables
                const [updatedUser] = yield drizzle_1.db.update(schema_1.users)
                    .set({ userType: type })
                    .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
                    .returning();
                const loginRole = type === "NON-STAFF" ? "STAFF" : type;
                yield drizzle_1.db.update(schema_1.login)
                    .set({ role: loginRole })
                    .where((0, drizzle_orm_1.eq)(schema_1.login.user_id, userId));
                if (!updatedUser) {
                    throw new catch_errors_1.NotFoundException("User not found or update failed.");
                }
                return updatedUser;
            }
            catch (error) {
                throw new catch_errors_1.InternalServerException("Failed to update the user type", "INTERNAL_SERVER_ERROR" /* ErrorCode.INTERNAL_SERVER_ERROR */);
            }
        });
    }
    getStaff() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield drizzle_1.db
                    .select({
                    id: schema_1.users.id,
                    name: schema_1.users.name,
                    gender: schema_1.users.gender,
                    department_id: schema_1.users.department_id,
                    userType: schema_1.users.userType,
                    contact_number: schema_1.users.contact_number,
                })
                    .from(schema_1.users)
                    .where((0, drizzle_orm_1.sql) `${schema_1.users.userType} IN ('STAFF', 'DEAN')`);
            }
            catch (error) {
                throw new catch_errors_1.InternalServerException("Failed to fetch staff members", "INTERNAL_SERVER_ERROR" /* ErrorCode.INTERNAL_SERVER_ERROR */);
            }
        });
    }
}
exports.UserService = UserService;
