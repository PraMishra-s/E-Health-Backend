import { Router } from "express";
import { haController } from "./ha.module";
import { authenticateJWT } from "../../common/strageties/jwt.strategy";


const haRoutes = Router()
haRoutes.post("/forgot-password", haController.forgotPassword)
haRoutes.put("/update", authenticateJWT, haController.changeSecretWord)
haRoutes.put("/toggle-availability", authenticateJWT, haController.toggleAvailability);
haRoutes.post("/set-leave", authenticateJWT, haController.setLeave);
haRoutes.put("/cancel-leave", authenticateJWT, haController.cancelLeave)
haRoutes.get("/get-leave", authenticateJWT, haController.getLeave)



export default haRoutes