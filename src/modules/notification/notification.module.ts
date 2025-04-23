import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";

const notificationService = new NotificationService();
const notificationController = new NotificationController(notificationService);

export {notificationController, notificationService}