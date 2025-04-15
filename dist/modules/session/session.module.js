"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionController = exports.sessionService = void 0;
const session_controller_1 = require("./session.controller");
const session_service_1 = require("./session.service");
const sessionService = new session_service_1.SessionService();
exports.sessionService = sessionService;
const sessionController = new session_controller_1.SessionController(sessionService);
exports.sessionController = sessionController;
