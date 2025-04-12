import { MentalController } from "./mentalCase.controller";
import { MentalService } from "./mentalCase.service";


const mentalService = new MentalService();
const mentalController = new MentalController(mentalService);
export {mentalService, mentalController}