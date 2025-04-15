"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.userService = void 0;
const user_controller_1 = require("./user.controller");
const user_service_1 = require("./user.service");
const userService = new user_service_1.UserService();
exports.userService = userService;
const userController = new user_controller_1.UserController(userService);
exports.userController = userController;
