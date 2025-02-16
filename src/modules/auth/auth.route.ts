import { Router } from "express";
import { authController } from "./auth.module";
import { authenticateJWT } from "../../common/strageties/jwt.strategy";
import { rateLimiter } from "../../middlewares/rateLimiter";

const authRoutes = Router()
authRoutes.post("/register", authController.register)
authRoutes.post("/login",rateLimiter, authController.login);
authRoutes.post("/verify/email", authController.verifyEmail);
authRoutes.post("/verify/resend-email", authController.resendVerifyEmail);
authRoutes.post("/password/forgot", authController.forgotPassword)
authRoutes.post("/password/reset", authController.resetPassword)
authRoutes.post("/logout", authenticateJWT, authController.logout)


authRoutes.get("/refresh", authController.refreshToken)
export default authRoutes;