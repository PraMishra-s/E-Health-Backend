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
exports.FeedController = void 0;
const catch_errors_1 = require("../../common/utils/catch-errors");
const feed_validator_1 = require("../../common/validators/feed.validator");
const http_config_1 = require("../../config/http.config");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
class FeedController {
    constructor(feedService) {
        this.createFeed = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userType = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userType;
            const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
            if (userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Only HA can create feeds");
            }
            const validatedData = feed_validator_1.feedSchema.parse(req.body);
            const newFeed = yield this.feedService.createFeed(userId, validatedData);
            res.status(http_config_1.HTTPSTATUS.CREATED).json({ message: "Feed created successfully", feed: newFeed });
        }));
        this.updateFeed = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userType = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userType;
            const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
            if (userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Only HA can update feeds");
            }
            const feedId = req.params.id;
            if (!feedId) {
                throw new catch_errors_1.UnauthorizedException("Feed id is required");
            }
            const validatedData = feed_validator_1.feedSchema.parse(req.body);
            yield this.feedService.updateFeed(userId, feedId, validatedData);
            res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Feed updated successfully" });
        }));
        this.deleteFeed = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userType = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userType;
            const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
            if (userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Only HA can delete feeds");
            }
            const feedId = req.params.id;
            if (!feedId) {
                throw new catch_errors_1.UnauthorizedException("Feed id is required");
            }
            yield this.feedService.deleteFeed(userId, feedId);
            res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Feed deleted successfully" });
        }));
        this.deleteAllFeeds = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userType = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userType;
            const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
            if (userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Only HA can delete all feeds");
            }
            yield this.feedService.deleteAllFeeds(userId);
            res.status(http_config_1.HTTPSTATUS.OK).json({ message: "All feeds deleted successfully" });
        }));
        this.getFeeds = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const feeds = yield this.feedService.getFeeds();
            res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Feeds retrieved successfully", feeds });
        }));
        this.feedService = feedService;
    }
}
exports.FeedController = FeedController;
