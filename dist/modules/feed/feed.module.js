"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedController = exports.feedService = void 0;
const feed_controller_1 = require("./feed.controller");
const feed_service_1 = require("./feed.service");
const feedService = new feed_service_1.FeedService();
exports.feedService = feedService;
const feedController = new feed_controller_1.FeedController(feedService);
exports.feedController = feedController;
