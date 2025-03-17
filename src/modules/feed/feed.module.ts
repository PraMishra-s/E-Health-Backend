import { FeedController } from "./feed.controller";
import { FeedService } from "./feed.service";

const feedService = new FeedService();
const feedController = new FeedController(feedService);

export { feedService, feedController };