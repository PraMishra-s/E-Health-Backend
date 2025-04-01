import { HaDashboardController } from "./ha_dashboard.controller"
import { HaDashboardService } from "./ha_dashboard.service"



const haDashboardService = new HaDashboardService()
const haDashoardController = new HaDashboardController(haDashboardService)

export {haDashboardService, haDashoardController}