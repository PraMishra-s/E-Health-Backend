import { User } from "../../common/@types";
import { ErrorCode } from "../../common/enums/error-code.enum";
import { UnauthorizedException } from "../../common/utils/catch-errors";
import { uuidSchema } from "../../common/validators/inventory.validator";
import { createNotificationSchema } from "../../common/validators/notification.validator";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { NotificationService } from "./notification.service";
import { Request, Response } from "express";

export class NotificationController{

    private notificationService

    constructor(notificationService: NotificationService){
        this.notificationService = notificationService;
    }
    public createNotification = asyncHandler(async (req: Request, res: Response) => {
        const data = createNotificationSchema.parse(req.body);
        const notification = await this.notificationService.createNotification(data);
    
        res.status(201).json({
          message: "Notification created successfully",
          notification,
        });
      });

    public getAll = asyncHandler(async (req: Request, res: Response) => {
        const userType = (req.user as User)?.userType
        if(!userType || userType !== "HA"){
            throw new UnauthorizedException("Unauthorized access", ErrorCode.ACCESS_FORBIDDEN);
        }
        const notifications = await this.notificationService.getAll(userType);
        res.status(200).json({ message: "Notifications fetched", notifications });
      });
    
    public markAsRead = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id
        const notification = await this.notificationService.markAsRead(id);
        res.status(200).json({ message: "Notification marked as read", notification });
    });
    public deleteNotification = asyncHandler(async (req: Request, res: Response) => {
        const id = uuidSchema.parse(req.params.id);
        const deleted = await this.notificationService.deleteNotification(id);
    
        if (!deleted) {
          return res.status(404).json({ message: "Notification not found" });
        }
    
        return res.status(200).json({
          message: "Notification deleted successfully",
          deleted,
        });
      });
}