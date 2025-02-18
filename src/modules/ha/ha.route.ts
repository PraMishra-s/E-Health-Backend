import { Router } from "express";
import { haController } from "./ha.module";
import { authenticateJWT } from "../../common/strageties/jwt.strategy";


const haRoutes = Router()
haRoutes.post("/fogot-password", haController.forgotPassword)
haRoutes.put("/update", authenticateJWT, haController.changeSecretWord)
haRoutes.post("/toggle-availability", authenticateJWT, haController.toggleAvailability);
haRoutes.post("/set-leave", authenticateJWT, haController.setLeave);
haRoutes.put("/cancel-leave", authenticateJWT, haController.cancelLeave)



export default haRoutes