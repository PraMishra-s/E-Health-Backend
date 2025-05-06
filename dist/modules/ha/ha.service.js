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
exports.HaService = void 0;
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
const bcrypt_1 = require("../../common/utils/bcrypt");
const catch_errors_1 = require("../../common/utils/catch-errors");
const uuid_1 = require("../../common/utils/uuid");
const drizzle_1 = require("../../database/drizzle");
const schema_1 = require("../../database/schema/schema");
const drizzle_orm_1 = require("drizzle-orm");
const mailer_1 = require("../../mailer/mailer");
const template_1 = require("../../mailer/template/template");
const app_config_1 = require("../../config/app.config");
class HaService {
    forgotPassword(email, secretWord) {
        return __awaiter(this, void 0, void 0, function* () {
            const userResult = yield drizzle_1.db.select().from(schema_1.login).where((0, drizzle_orm_1.eq)(schema_1.login.email, email)).limit(1);
            if (userResult.length === 0) {
                throw new catch_errors_1.NotFoundException("User not found.", "AUTH_USER_NOT_FOUND" /* ErrorCode.AUTH_USER_NOT_FOUND */);
            }
            const user = userResult[0];
            if (user.role !== "HA") {
                throw new catch_errors_1.BadRequestException("Password reset via this flow is only for HA users.", "ACCESS_FORBIDDEN" /* ErrorCode.ACCESS_FORBIDDEN */);
            }
            const haResult = yield drizzle_1.db
                .select()
                .from(schema_1.ha_details)
                .where((0, drizzle_orm_1.eq)(schema_1.ha_details.ha_id, user.user_id))
                .limit(1);
            if (haResult.length === 0) {
                throw new catch_errors_1.NotFoundException("HA details not found.", "AUTH_USER_NOT_FOUND" /* ErrorCode.AUTH_USER_NOT_FOUND */);
            }
            const haRecord = haResult[0];
            const isSecretValid = yield (0, bcrypt_1.compareValue)(secretWord, haRecord.secret_key);
            if (!isSecretValid) {
                throw new catch_errors_1.UnauthorizedException("Invalid secret word.", "SECRET_WRONG" /* ErrorCode.SECRET_WRONG */);
            }
            const userId = haResult[0].ha_id;
            const rateLimitKey = `password-reset:rate-limit:${userId}`;
            const requestCount = yield redis_service_1.default.incr(rateLimitKey);
            if (requestCount === 1) {
                yield redis_service_1.default.expire(rateLimitKey, 180);
            }
            else if (requestCount > 2) {
                throw new catch_errors_1.BadRequestException("Too many requests, try again later", "AUTH_TOO_MANY_ATTEMPTS" /* ErrorCode.AUTH_TOO_MANY_ATTEMPTS */);
            }
            const otpTTL = 240;
            const expiresAt = new Date(Date.now() + otpTTL * 1000);
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
    changeSecretWord(userId, currentSecret, newSecret) {
        return __awaiter(this, void 0, void 0, function* () {
            const userResult = yield drizzle_1.db.select().from(schema_1.ha_details).where((0, drizzle_orm_1.eq)(schema_1.ha_details.ha_id, userId));
            if (userResult.length === 0) {
                throw new catch_errors_1.NotFoundException("User not found.", "AUTH_NOT_FOUND" /* ErrorCode.AUTH_NOT_FOUND */);
            }
            const user = userResult[0];
            const isSecretValid = yield (0, bcrypt_1.compareValue)(currentSecret, user.secret_key);
            if (!isSecretValid) {
                throw new catch_errors_1.BadRequestException("Current secret is incorrect.", "SECRET_WRONG" /* ErrorCode.SECRET_WRONG */);
            }
            const hashedNewSecret = yield (0, bcrypt_1.hashValue)(newSecret);
            yield drizzle_1.db.update(schema_1.ha_details)
                .set({ secret_key: hashedNewSecret })
                .where((0, drizzle_orm_1.eq)(schema_1.ha_details.ha_id, userId));
            return;
        });
    }
    toggleAvailability(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [haRecord] = yield drizzle_1.db.select().from(schema_1.ha_details).where((0, drizzle_orm_1.eq)(schema_1.ha_details.ha_id, userId));
            if (!haRecord) {
                throw new catch_errors_1.NotFoundException("HA details not found", "AUTH_NOT_FOUND" /* ErrorCode.AUTH_NOT_FOUND */);
            }
            try {
                const newStatus = !haRecord.is_available;
                yield drizzle_1.db
                    .update(schema_1.ha_details)
                    .set({ is_available: newStatus })
                    .where((0, drizzle_orm_1.eq)(schema_1.ha_details.ha_id, userId));
                yield redis_service_1.default.set("ha:available", JSON.stringify({ is_available: newStatus }));
                return newStatus;
            }
            catch (error) {
                throw new catch_errors_1.InternalServerException("Failed to Toggle status", "INTERNAL_SERVER_ERROR" /* ErrorCode.INTERNAL_SERVER_ERROR */);
            }
        });
    }
    setLeave(userId, start_date, end_date, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            const haRecord = yield drizzle_1.db.select().from(schema_1.ha_details).where((0, drizzle_orm_1.eq)(schema_1.ha_details.ha_id, userId)).limit(1);
            if (!haRecord.length) {
                throw new catch_errors_1.NotFoundException("HA details not found.", "AUTH_USER_NOT_FOUND" /* ErrorCode.AUTH_USER_NOT_FOUND */);
            }
            end_date.setHours(23, 59, 59, 999);
            const [leaveEntry] = yield drizzle_1.db.insert(schema_1.ha_availability).values({
                ha_id: userId,
                start_date,
                end_date,
                reason
            }).returning();
            const redisKey = `ha:leave`;
            const leaveData = {
                is_onLeave: false,
                start_date,
                end_date,
                reason
            };
            const expireSeconds = Math.floor((end_date.getTime() - Date.now()) / 1000);
            yield redis_service_1.default.set(redisKey, JSON.stringify(leaveData), { ex: expireSeconds });
            return leaveEntry;
        });
    }
    cancelLeave(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const activeLeaves = yield drizzle_1.db
                .select()
                .from(schema_1.ha_availability)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ha_availability.ha_id, userId), (0, drizzle_orm_1.gt)(schema_1.ha_availability.end_date, now), (0, drizzle_orm_1.eq)(schema_1.ha_availability.processed, false)));
            if (activeLeaves.length === 0) {
                throw new catch_errors_1.NotFoundException("No active leave record found for cancellation.");
            }
            try {
                yield drizzle_1.db
                    .update(schema_1.ha_details)
                    .set({ is_onLeave: false, is_available: true })
                    .where((0, drizzle_orm_1.eq)(schema_1.ha_details.ha_id, userId));
                yield drizzle_1.db
                    .update(schema_1.ha_availability)
                    .set({ processed: true })
                    .where((0, drizzle_orm_1.eq)(schema_1.ha_availability.ha_id, userId));
                console.log("updated the ha_availability table");
                yield redis_service_1.default.del(`ha:leave`);
                const availabilityKey = `ha:available`;
                yield redis_service_1.default.set(availabilityKey, JSON.stringify({ is_available: true }));
                return;
            }
            catch (error) {
                throw new catch_errors_1.InternalServerException(`Failed to cancel Leave as ${error}`, "INTERNAL_SERVER_ERROR" /* ErrorCode.INTERNAL_SERVER_ERROR */);
            }
        });
    }
    getLeave(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const leaveRecords = yield drizzle_1.db
                .select()
                .from(schema_1.ha_availability)
                .where((0, drizzle_orm_1.eq)(schema_1.ha_availability.ha_id, userId))
                .orderBy(schema_1.ha_availability.start_date);
            if (!leaveRecords.length) {
                throw new catch_errors_1.NotFoundException("No leave records found.");
            }
            return leaveRecords.map(record => ({
                start_date: record.start_date,
                end_date: record.end_date,
                reason: record.reason,
                created_at: record.created_at,
                processed: record.processed
            }));
        });
    }
    getHaDetails() {
        return __awaiter(this, void 0, void 0, function* () {
            const haDetails = yield drizzle_1.db
                .select({
                id: schema_1.ha_details.ha_id,
                status: schema_1.ha_details.status,
                name: schema_1.users.name,
                gender: schema_1.users.gender,
                contact_number: schema_1.users.contact_number,
                email: schema_1.login.email,
                is_available: schema_1.ha_details.is_available,
                is_onLeave: schema_1.ha_details.is_onLeave
            })
                .from(schema_1.ha_details)
                .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.ha_details.ha_id))
                .innerJoin(schema_1.login, (0, drizzle_orm_1.eq)(schema_1.login.user_id, schema_1.users.id))
                .orderBy(schema_1.users.name);
            if (!haDetails.length) {
                throw new catch_errors_1.NotFoundException("No HA details found.", "AUTH_USER_NOT_FOUND" /* ErrorCode.AUTH_USER_NOT_FOUND */);
            }
            return haDetails;
        });
    }
    changeStatus(userId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const haRecord = yield drizzle_1.db.select().from(schema_1.ha_details).where((0, drizzle_orm_1.eq)(schema_1.ha_details.ha_id, userId)).limit(1);
            if (!haRecord.length) {
                throw new catch_errors_1.NotFoundException("HA details not found.", "AUTH_USER_NOT_FOUND" /* ErrorCode.AUTH_USER_NOT_FOUND */);
            }
            if (status === 'ACTIVE') {
                // First, update all other active HAs
                const activeHas = yield drizzle_1.db.select().from(schema_1.ha_details).where((0, drizzle_orm_1.eq)(schema_1.ha_details.status, 'ACTIVE'));
                for (const ha of activeHas) {
                    // Update user type to PREVIOUS_HA
                    yield drizzle_1.db.update(schema_1.users)
                        .set({ userType: 'PREVIOUS_HA' })
                        .where((0, drizzle_orm_1.eq)(schema_1.users.id, ha.ha_id));
                    // Update login role to PREVIOUS_HA
                    yield drizzle_1.db.update(schema_1.login)
                        .set({ role: 'PREVIOUS_HA' })
                        .where((0, drizzle_orm_1.eq)(schema_1.login.user_id, ha.ha_id));
                    // Set status to INACTIVE
                    yield drizzle_1.db.update(schema_1.ha_details)
                        .set({ status: 'INACTIVE' })
                        .where((0, drizzle_orm_1.eq)(schema_1.ha_details.ha_id, ha.ha_id));
                }
            }
            // Update the specified HA's status, user type, and role
            yield drizzle_1.db.update(schema_1.ha_details)
                .set({ status })
                .where((0, drizzle_orm_1.eq)(schema_1.ha_details.ha_id, userId));
            if (status === 'ACTIVE') {
                yield drizzle_1.db.update(schema_1.users)
                    .set({ userType: 'HA' })
                    .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
                yield drizzle_1.db.update(schema_1.login)
                    .set({ role: 'HA' })
                    .where((0, drizzle_orm_1.eq)(schema_1.login.user_id, userId));
            }
            return;
        });
    }
}
exports.HaService = HaService;
