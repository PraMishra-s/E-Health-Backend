import { Router } from "express";
import { authenticateJWT } from "../../common/strageties/jwt.strategy";
import { mfaController } from "./mfa.module";

const mfaRoutes = Router()

mfaRoutes.post("/invoke", authenticateJWT, mfaController.invokeMFASetup)
mfaRoutes.post("/verify-login", mfaController.verifyMFAForLogin)
mfaRoutes.put("/revoke", authenticateJWT, mfaController.revokeMFA)



export default mfaRoutes