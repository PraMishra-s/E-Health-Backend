import { Router } from "express";
import { authenticateJWT } from "../../common/strageties/jwt.strategy";
import { userController } from "./user.module";
import { rateLimiter } from "../../middlewares/rateLimiter";


const userRoutes = Router()
userRoutes.put("/update", authenticateJWT, userController.updateUserProfile)
userRoutes.post("/email",rateLimiter, userController.getEmail)
userRoutes.put("/update-profile", authenticateJWT, userController.updatePofilePic)
userRoutes.put("/change-password", authenticateJWT,rateLimiter, userController.changePassword)
userRoutes.get("/users", authenticateJWT, userController.getUsers)
userRoutes.get("/programmes", authenticateJWT, userController.getProgrammes)
userRoutes.put("/change-userType/:id", authenticateJWT, userController.changeUserType)
userRoutes.get("/getStaff", authenticateJWT, userController.getStaff)

export default userRoutes