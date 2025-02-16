import { Router } from "express";
import { authenticateJWT } from "../../common/strageties/jwt.strategy";
import { userController } from "./user.module";


const userRoutes = Router()
userRoutes.put("/update", authenticateJWT, userController.updateUserProfile)

export default userRoutes