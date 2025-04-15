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
exports.FeedService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const catch_errors_1 = require("../../common/utils/catch-errors");
const drizzle_1 = require("../../database/drizzle");
const schema_1 = require("../../database/schema/schema");
class FeedService {
    createFeed(userId, feedData) {
        return __awaiter(this, void 0, void 0, function* () {
            const [newFeed] = yield drizzle_1.db.insert(schema_1.feeds).values({
                user_id: userId,
                title: feedData.title,
                description: feedData.description,
                image_urls: feedData.image_urls || [],
                video_url: feedData.video_url || [],
            }).returning();
            return newFeed;
        });
    }
    updateFeed(userId, feedId, feedData) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingFeed = yield drizzle_1.db.select().from(schema_1.feeds).where((0, drizzle_orm_1.eq)(schema_1.feeds.id, feedId)).limit(1);
            if (!existingFeed.length)
                throw new catch_errors_1.NotFoundException("Feed not found");
            if (existingFeed[0].user_id !== userId)
                throw new catch_errors_1.UnauthorizedException("Not authorized to update this feed");
            yield drizzle_1.db.update(schema_1.feeds).set(feedData).where((0, drizzle_orm_1.eq)(schema_1.feeds.id, feedId));
        });
    }
    deleteFeed(userId, feedId) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingFeed = yield drizzle_1.db.select().from(schema_1.feeds).where((0, drizzle_orm_1.eq)(schema_1.feeds.id, feedId)).limit(1);
            if (!existingFeed.length)
                throw new catch_errors_1.NotFoundException("Feed not found");
            if (existingFeed[0].user_id !== userId)
                throw new catch_errors_1.UnauthorizedException("Not authorized to delete this feed");
            yield drizzle_1.db.delete(schema_1.feeds).where((0, drizzle_orm_1.eq)(schema_1.feeds.id, feedId));
        });
    }
    deleteAllFeeds(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield drizzle_1.db.delete(schema_1.feeds).where((0, drizzle_orm_1.eq)(schema_1.feeds.user_id, userId));
        });
    }
    getFeeds() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield drizzle_1.db.select().from(schema_1.feeds).orderBy((0, drizzle_orm_1.desc)(schema_1.feeds.created_at));
        });
    }
}
exports.FeedService = FeedService;
