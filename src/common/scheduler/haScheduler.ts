import cron from "node-cron";
import { eq, and, lt, gt, lte } from "drizzle-orm";

import { db } from "../../database/drizzle";
import { ha_availability, ha_details } from "../../database/schema/schema";
import redis from "../service/redis.service";

const updateHaAvailability = async () => {
    console.log("Running HA availability scheduler...");

    const now = new Date();

    const startingLeaves = await db
    .select({ ha_id: ha_availability.ha_id })
    .from(ha_availability)
    .innerJoin(ha_details, eq(ha_availability.ha_id, ha_details.ha_id))
    .where(
        and(
        eq(ha_details.is_onLeave, false),
        lte(ha_availability.start_date, now),
        gt(ha_availability.end_date, now),
        eq(ha_availability.processed, false)
        )
    );



    for (const leave of startingLeaves) {
        if (!leave.ha_id) continue;

        await db
            .update(ha_details)
            .set({ is_available: false, is_onLeave: true })
            .where(eq(ha_details.ha_id, leave.ha_id));

        const redisKey = `ha:available`;
        const leaveredisKey = `ha:leave`;
        const leaveData = await redis.get(leaveredisKey);
        if(leaveData){
            const ha_data = typeof leaveData === "string" ? JSON.parse(leaveData) : leaveData;
            ha_data.is_onLeave = true;
            await redis.set(leaveredisKey, JSON.stringify(ha_data));
        }

        await redis.set(redisKey, JSON.stringify({ is_available: false }));
    }
};

// Schedule the job to run every minute
cron.schedule("* * * * *", async () => {
    await updateHaAvailability();
});
