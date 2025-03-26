import { StaffController } from "./staff.controller";
import { StaffService } from "./staff.service";

const staffService = new StaffService()
const staffController = new StaffController(staffService)

export {staffService, staffController}