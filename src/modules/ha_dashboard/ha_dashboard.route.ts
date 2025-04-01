import { Router } from "express";
import { authenticateJWT } from "../../common/strageties/jwt.strategy";
import { haDashoardController } from "./ha_dashboard.module";


const haDashboardRoute = Router()
haDashboardRoute.get("/", haDashoardController.getAnalytics);

export default haDashboardRoute