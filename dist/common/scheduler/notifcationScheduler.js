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
exports.stopNotificationScheduler = exports.startNotificationScheduler = exports.notificationScheduler = void 0;
// src/common/scheduler/notificationScheduler.ts
const node_cron_1 = __importDefault(require("node-cron"));
const drizzle_1 = require("../../database/drizzle");
const drizzle_orm_1 = require("drizzle-orm");
const date_fns_1 = require("date-fns");
const schema_1 = require("../../database/schema/schema");
const socket_manager_1 = require("../service/socket.manager");
// Constants
const LOW_STOCK_THRESHOLD = 10;
const EXPIRY_THRESHOLD_DAYS = 7;
exports.notificationScheduler = node_cron_1.default.schedule('*/15 * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('[Scheduler] Checking for medicine expiry and low stock...');
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + EXPIRY_THRESHOLD_DAYS);
    try {
        // Get low stock batches with medicine names
        const lowStockBatches = yield drizzle_1.db
            .select({
            id: schema_1.medicine_batches.id,
            batch_name: schema_1.medicine_batches.batch_name,
            quantity: schema_1.medicine_batches.quantity,
            medicine_id: schema_1.medicine_batches.medicine_id,
            medicine_name: schema_1.medicines.name
        })
            .from(schema_1.medicine_batches)
            .innerJoin(schema_1.medicines, (0, drizzle_orm_1.eq)(schema_1.medicine_batches.medicine_id, schema_1.medicines.id))
            .where((0, drizzle_orm_1.lte)(schema_1.medicine_batches.quantity, LOW_STOCK_THRESHOLD));
        // Get batches nearing expiry with medicine names
        const expiringBatches = yield drizzle_1.db
            .select({
            id: schema_1.medicine_batches.id,
            batch_name: schema_1.medicine_batches.batch_name,
            medicine_id: schema_1.medicine_batches.medicine_id,
            medicine_name: schema_1.medicines.name,
            expiry_date: schema_1.medicine_batches.expiry_date
        })
            .from(schema_1.medicine_batches)
            .innerJoin(schema_1.medicines, (0, drizzle_orm_1.eq)(schema_1.medicine_batches.medicine_id, schema_1.medicines.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.lte)(schema_1.medicine_batches.expiry_date, thresholdDate), (0, drizzle_orm_1.gt)(schema_1.medicine_batches.expiry_date, now)));
        // Get already expired batches
        const expiredBatches = yield drizzle_1.db
            .select({
            id: schema_1.medicine_batches.id,
            batch_name: schema_1.medicine_batches.batch_name,
            medicine_id: schema_1.medicine_batches.medicine_id,
            medicine_name: schema_1.medicines.name,
            expiry_date: schema_1.medicine_batches.expiry_date
        })
            .from(schema_1.medicine_batches)
            .innerJoin(schema_1.medicines, (0, drizzle_orm_1.eq)(schema_1.medicine_batches.medicine_id, schema_1.medicines.id))
            .where((0, drizzle_orm_1.lt)(schema_1.medicine_batches.expiry_date, now));
        let notificationsCreated = false;
        // Enhanced create or update notifications function
        const createOrUpdateNotification = (type, batch) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            // First, check if any notification exists for this batch and type, regardless of read status
            const allExisting = yield drizzle_1.db
                .select()
                .from(schema_1.notifications)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notifications.batch_id, batch.id), (0, drizzle_orm_1.eq)(schema_1.notifications.type, type)))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.notifications.created_at)); // Get most recent first
            // Generate appropriate message based on notification type
            let message = '';
            switch (type) {
                case 'LOW_STOCK':
                    message = `${batch.medicine_name} (${batch.batch_name}) is low in stock (${batch.quantity} remaining)`;
                    break;
                case 'EXPIRING':
                    const daysUntilExpiry = (0, date_fns_1.differenceInDays)(new Date(batch.expiry_date), now);
                    message = `${batch.medicine_name} (${batch.batch_name}) will expire in ${daysUntilExpiry} days`;
                    break;
                case 'EXPIRED':
                    message = `${batch.medicine_name} (${batch.batch_name}) has expired and should be removed`;
                    break;
            }
            if (allExisting.length > 0) {
                const latestNotification = allExisting[0]; // Most recent notification
                if (!latestNotification.is_read) {
                    // Case: Exists and is_read = false
                    const lastUpdated = new Date((_a = latestNotification.updated_at) !== null && _a !== void 0 ? _a : Date.now());
                    if ((0, date_fns_1.isToday)(lastUpdated))
                        return; // Do nothing if already updated today
                    // Update the existing notification
                    yield drizzle_1.db.update(schema_1.notifications)
                        .set({
                        updated_at: new Date(),
                        message: message // Update message to reflect current status
                    })
                        .where((0, drizzle_orm_1.eq)(schema_1.notifications.id, latestNotification.id));
                    console.log(`[Scheduler] Updated ${type} notification for ${batch.medicine_name}`);
                }
                else {
                    // Case: Exists and is_read = true
                    const lastUpdated = new Date((_b = latestNotification.updated_at) !== null && _b !== void 0 ? _b : Date.now());
                    if ((0, date_fns_1.isToday)(lastUpdated)) {
                        // Case: Exists and is_read = true AND today's date - Do nothing
                        console.log(`[Scheduler] Skipped ${type} notification for ${batch.medicine_name} (already read today)`);
                        return;
                    }
                    else {
                        // Case: Exists and is_read = true AND older date - Insert new notification
                        yield drizzle_1.db.insert(schema_1.notifications).values({
                            batch_id: batch.id,
                            medicine_id: batch.medicine_id,
                            message: message,
                            type,
                            for_role: "HA", // Explicitly set the role
                            is_read: false,
                            updated_at: new Date(),
                            created_at: new Date(),
                        });
                        notificationsCreated = true;
                        console.log(`[Scheduler] Created new ${type} notification for ${batch.medicine_name} (previous was read)`);
                    }
                }
            }
            else {
                // Case: No existing notification
                yield drizzle_1.db.insert(schema_1.notifications).values({
                    batch_id: batch.id,
                    medicine_id: batch.medicine_id,
                    message: message,
                    type,
                    for_role: "HA", // Explicitly set the role
                    is_read: false,
                    updated_at: new Date(),
                    created_at: new Date(),
                });
                notificationsCreated = true;
                console.log(`[Scheduler] Created new ${type} notification for ${batch.medicine_name}`);
            }
        });
        // Process each batch type
        for (const batch of lowStockBatches) {
            yield createOrUpdateNotification('LOW_STOCK', batch);
        }
        for (const batch of expiringBatches) {
            yield createOrUpdateNotification('EXPIRING', batch);
        }
        for (const batch of expiredBatches) {
            yield createOrUpdateNotification('EXPIRED', batch);
        }
        // Notify clients if any new notifications were created
        if (notificationsCreated) {
            (0, socket_manager_1.sendNotificationToClients)();
        }
        console.log('[Scheduler] Notification check complete.');
    }
    catch (error) {
        console.error('[Scheduler] Error checking for notifications:', error);
    }
}));
// Export a function to manually start the scheduler
const startNotificationScheduler = () => {
    exports.notificationScheduler.start();
    console.log('[Scheduler] Notification scheduler started');
    return exports.notificationScheduler;
};
exports.startNotificationScheduler = startNotificationScheduler;
// Export a function to stop the scheduler
const stopNotificationScheduler = () => {
    exports.notificationScheduler.stop();
    console.log('[Scheduler] Notification scheduler stopped');
};
exports.stopNotificationScheduler = stopNotificationScheduler;
