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
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_1 = require("../../database/drizzle");
const schema_1 = require("../../database/schema/schema");
const redis_service_1 = __importDefault(require("../service/redis.service"));
const updateHaAvailability = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Running HA availability scheduler...");
    const now = new Date();
    const startingLeaves = yield drizzle_1.db
        .select({ ha_id: schema_1.ha_availability.ha_id })
        .from(schema_1.ha_availability)
        .innerJoin(schema_1.ha_details, (0, drizzle_orm_1.eq)(schema_1.ha_availability.ha_id, schema_1.ha_details.ha_id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ha_details.is_onLeave, false), (0, drizzle_orm_1.lte)(schema_1.ha_availability.start_date, now), (0, drizzle_orm_1.gt)(schema_1.ha_availability.end_date, now), (0, drizzle_orm_1.eq)(schema_1.ha_availability.processed, false)));
    for (const leave of startingLeaves) {
        if (!leave.ha_id)
            continue;
        yield drizzle_1.db
            .update(schema_1.ha_details)
            .set({ is_available: false, is_onLeave: true })
            .where((0, drizzle_orm_1.eq)(schema_1.ha_details.ha_id, leave.ha_id));
        const redisKey = `ha:available`;
        const leaveredisKey = `ha:leave`;
        const leaveData = yield redis_service_1.default.get(leaveredisKey);
        if (leaveData) {
            const ha_data = typeof leaveData === "string" ? JSON.parse(leaveData) : leaveData;
            ha_data.is_onLeave = true;
            yield redis_service_1.default.set(leaveredisKey, JSON.stringify(ha_data));
        }
        yield redis_service_1.default.set(redisKey, JSON.stringify({ is_available: false }));
    }
});
// Schedule the job to run every minute
node_cron_1.default.schedule("* * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    yield updateHaAvailability();
}));
