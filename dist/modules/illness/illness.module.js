"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.illnessController = exports.illnessService = void 0;
const illness_controller_1 = require("./illness.controller");
const illness_service_1 = require("./illness.service");
const illnessService = new illness_service_1.IllnessService();
exports.illnessService = illnessService;
const illnessController = new illness_controller_1.IllnessController(illnessService);
exports.illnessController = illnessController;
