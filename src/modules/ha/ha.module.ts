import { HaController } from "./ha.controller";
import { HaService } from "./ha.service";

const haService = new HaService()
const haController = new HaController(haService)

export {haService, haController}