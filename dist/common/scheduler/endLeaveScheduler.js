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
const node_cron_1 = __importDefault(require("node-cron"));
const drizzle_1 = require("../../database/drizzle");
const schema_1 = require("../../database/schema/schema");
const drizzle_orm_1 = require("drizzle-orm");
const redis_service_1 = __importDefault(require("../service/redis.service"));
const endLeaveScheduler = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Running end-of-leave scheduler...");
    const now = new Date();
    const endedLeaves = yield drizzle_1.db
        .select({ ha_id: schema_1.ha_availability.ha_id })
        .from(schema_1.ha_availability)
        .innerJoin(schema_1.ha_details, (0, drizzle_orm_1.eq)(schema_1.ha_availability.ha_id, schema_1.ha_details.ha_id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ha_details.is_onLeave, true), (0, drizzle_orm_1.lt)(schema_1.ha_availability.end_date, now), (0, drizzle_orm_1.eq)(schema_1.ha_availability.processed, false)));
    for (const leave of endedLeaves) {
        if (!leave.ha_id)
            continue;
        yield drizzle_1.db
            .update(schema_1.ha_details)
            .set({ is_available: true, is_onLeave: false })
            .where((0, drizzle_orm_1.eq)(schema_1.ha_details.ha_id, leave.ha_id));
        const redisKey = `ha:available`;
        yield redis_service_1.default.set(redisKey, JSON.stringify({ is_available: true }));
        const leaveKey = `ha:leave`;
        yield redis_service_1.default.del(leaveKey);
        yield drizzle_1.db
            .update(schema_1.ha_availability)
            .set({ processed: true })
            .where((0, drizzle_orm_1.eq)(schema_1.ha_availability.ha_id, leave.ha_id));
    }
});
// Schedule the job to run every minute
node_cron_1.default.schedule("* * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    yield endLeaveScheduler();
}));
