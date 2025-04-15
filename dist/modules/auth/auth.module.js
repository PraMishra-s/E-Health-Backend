"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.authService = void 0;
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const authService = new auth_service_1.AuthService();
exports.authService = authService;
const authController = new auth_controller_1.AuthController(authService);
exports.authController = authController;
