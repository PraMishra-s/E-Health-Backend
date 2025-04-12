import { IllnessCategoryController } from "./illnessCategory.controller";
import { IllnessCategoryService } from "./illnessCategory.service";

const illnessCategoryService = new IllnessCategoryService()
const illnessCategoryController = new IllnessCategoryController(illnessCategoryService)

export {illnessCategoryService, illnessCategoryController}