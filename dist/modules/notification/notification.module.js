"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.notificationController = void 0;
const notification_controller_1 = require("./notification.controller");
const notification_service_1 = require("./notification.service");
const notificationService = new notification_service_1.NotificationService();
exports.notificationService = notificationService;
const notificationController = new notification_controller_1.NotificationController(notificationService);
exports.notificationController = notificationController;
