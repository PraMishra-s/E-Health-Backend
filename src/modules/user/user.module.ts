import { UserController } from "./user.controller";
import { UserService } from "./user.service";

const userService = new UserService()
const userController = new UserController(userService)

export {userService, userController}
