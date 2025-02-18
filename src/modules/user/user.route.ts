import { Router } from "express";
import { authenticateJWT } from "../../common/strageties/jwt.strategy";
import { userController } from "./user.module";
import { rateLimiter } from "../../middlewares/rateLimiter";


const userRoutes = Router()
userRoutes.put("/update", authenticateJWT, userController.updateUserProfile)
userRoutes.post("/email",rateLimiter, userController.getEmail)

export default userRoutes