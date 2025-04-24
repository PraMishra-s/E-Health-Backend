import { Router } from "express";
import { authenticateJWT } from "../../common/strageties/jwt.strategy";
import { notificationController } from "./notification.module";


const notificationRouter = Router();


notificationRouter.post("/create/", authenticateJWT, notificationController.createNotification);
notificationRouter.get("/", authenticateJWT, notificationController.getAll);
notificationRouter.put("/read/:id", authenticateJWT, notificationController.markAsRead);
notificationRouter.delete("/delete/:id", authenticateJWT, notificationController.deleteNotification);

export default notificationRouter;