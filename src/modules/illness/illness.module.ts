import { IllnessController } from "./illness.controller";
import { IllnessService } from "./illness.service";

const illnessService = new IllnessService()
const illnessController = new IllnessController(illnessService)

export {illnessService, illnessController}