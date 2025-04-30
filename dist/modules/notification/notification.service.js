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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_1 = require("../../database/drizzle");
const schema_1 = require("../../database/schema/schema");
class NotificationService {
    getAll(userType) {
        return __awaiter(this, void 0, void 0, function* () {
            return drizzle_1.db
                .select()
                .from(schema_1.notifications)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notifications.for_role, userType), (0, drizzle_orm_1.eq)(schema_1.notifications.is_read, false)))
                .orderBy(schema_1.notifications.updated_at);
        });
    }
    markAsRead(notificationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [updated] = yield drizzle_1.db
                .update(schema_1.notifications)
                .set({ is_read: true, updated_at: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.notifications.id, notificationId))
                .returning();
            return updated;
        });
    }
    deleteNotification(notificationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const deleted = yield drizzle_1.db
                .delete(schema_1.notifications)
                .where((0, drizzle_orm_1.eq)(schema_1.notifications.id, notificationId))
                .returning();
            return deleted[0];
        });
    }
    createNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const [notification] = yield drizzle_1.db
                .insert(schema_1.notifications)
                .values({
                type: data.title,
                message: data.message,
                for_role: "HA",
                is_read: false
            })
                .returning();
            return notification;
        });
    }
}
exports.NotificationService = NotificationService;
