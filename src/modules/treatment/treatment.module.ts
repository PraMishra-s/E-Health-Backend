import { TreatmentController } from "./treatment.controller";
import { TreatmentService } from "./treatment.service";


const treatmentService = new TreatmentService()
const treatmentController = new TreatmentController(treatmentService)

export {treatmentService, treatmentController}
