import { Router } from "express";
import { haController } from "./ha.module";
import { authenticateJWT } from "../../common/strageties/jwt.strategy";


const haRoutes = Router()
haRoutes.post("/fogot-password", haController.forgotPassword)
haRoutes.put("/update", authenticateJWT, haController.changeSecretWord)


export default haRoutes