import { eq, desc } from "drizzle-orm";
import { NotFoundException, UnauthorizedException } from "../../common/utils/catch-errors";
import { db } from "../../database/drizzle";
import { feeds } from "../../database/schema/schema";

export class FeedService{
    public async createFeed(userId: string, feedData: any) {
        const [newFeed] = await db.insert(feeds).values({
            user_id: userId,
            title: feedData.title,
            description: feedData.description,
            image_urls: feedData.image_urls || [],
            video_url: feedData.video_url || [],
        }).returning();
        return newFeed;
    }

    public async updateFeed(userId: string, feedId: string, feedData: any) {
        const existingFeed = await db.select().from(feeds).where(eq(feeds.id, feedId)).limit(1);
        if (!existingFeed.length) throw new NotFoundException("Feed not found");

        if (existingFeed[0].user_id !== userId) throw new UnauthorizedException("Not authorized to update this feed");

        await db.update(feeds).set(feedData).where(eq(feeds.id, feedId));
    }

    public async deleteFeed(userId: string, feedId: string) {
        const existingFeed = await db.select().from(feeds).where(eq(feeds.id, feedId)).limit(1);
        if (!existingFeed.length) throw new NotFoundException("Feed not found");

        if (existingFeed[0].user_id !== userId) throw new UnauthorizedException("Not authorized to delete this feed");

        await db.delete(feeds).where(eq(feeds.id, feedId));
    }

    public async deleteAllFeeds(userId: string) {
        await db.delete(feeds).where(eq(feeds.user_id, userId));
    }

    public async getFeeds() {
        return await db.select().from(feeds).orderBy(desc(feeds.created_at))
    }
}