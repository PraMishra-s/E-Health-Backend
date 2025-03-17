import cron from "node-cron";
import { db } from "../../database/drizzle";
import { ha_availability, ha_details } from "../../database/schema/schema";
import { eq, lt, and } from "drizzle-orm";
import redis from "../service/redis.service";

const endLeaveScheduler = async () => {
    console.log("Running end-of-leave scheduler...");

    const now = new Date();

    const endedLeaves = await db
        .select({ ha_id: ha_availability.ha_id })
        .from(ha_availability)
        .innerJoin(ha_details, eq(ha_availability.ha_id, ha_details.ha_id))
        .where(and(eq(ha_details.is_onLeave, true), lt(ha_availability.end_date, now), eq(ha_availability.processed, false)));


    for (const leave of endedLeaves) {
        if (!leave.ha_id) continue;
        await db
            .update(ha_details)
            .set({ is_available: true, is_onLeave: false })
            .where(eq(ha_details.ha_id, leave.ha_id));

        const redisKey = `ha:available`;
        await redis.set(redisKey, JSON.stringify({ is_available: true }));

        const leaveKey = `ha:leave`;
        await redis.del(leaveKey);

        await db
        .update(ha_availability)
        .set({ processed: true }) 
        .where(eq(ha_availability.ha_id, leave.ha_id));
    }
};

// Schedule the job to run every minute
cron.schedule("* * * * *", async () => {
    await endLeaveScheduler();
});
