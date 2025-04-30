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
exports.NotificationController = void 0;
const catch_errors_1 = require("../../common/utils/catch-errors");
const inventory_validator_1 = require("../../common/validators/inventory.validator");
const notification_validator_1 = require("../../common/validators/notification.validator");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
class NotificationController {
    constructor(notificationService) {
        this.createNotification = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const data = notification_validator_1.createNotificationSchema.parse(req.body);
            const notification = yield this.notificationService.createNotification(data);
            res.status(201).json({
                message: "Notification created successfully",
                notification,
            });
        }));
        this.getAll = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userType = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userType;
            if (!userType || userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Unauthorized access", "ACCESS_FORBIDDEN" /* ErrorCode.ACCESS_FORBIDDEN */);
            }
            const notifications = yield this.notificationService.getAll(userType);
            res.status(200).json({ message: "Notifications fetched", notifications });
        }));
        this.markAsRead = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const id = req.params.id;
            const notification = yield this.notificationService.markAsRead(id);
            res.status(200).json({ message: "Notification marked as read", notification });
        }));
        this.deleteNotification = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const id = inventory_validator_1.uuidSchema.parse(req.params.id);
            const deleted = yield this.notificationService.deleteNotification(id);
            if (!deleted) {
                return res.status(404).json({ message: "Notification not found" });
            }
            return res.status(200).json({
                message: "Notification deleted successfully",
                deleted,
            });
        }));
        this.notificationService = notificationService;
    }
}
exports.NotificationController = NotificationController;
