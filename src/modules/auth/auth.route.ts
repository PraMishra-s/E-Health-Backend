import { Router } from "express";
import { authController } from "./auth.module";
import { authenticateJWT } from "../../common/strageties/jwt.strategy";

const authRoutes = Router()
authRoutes.post("/register", authController.register)
authRoutes.post("/login", authController.login);
authRoutes.post("/verify/email", authController.verifyEmail);
authRoutes.post("/logout", authenticateJWT, authController.logout)

export default authRoutes;