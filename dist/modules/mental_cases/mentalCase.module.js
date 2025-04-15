"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mentalController = exports.mentalService = void 0;
const mentalCase_controller_1 = require("./mentalCase.controller");
const mentalCase_service_1 = require("./mentalCase.service");
const mentalService = new mentalCase_service_1.MentalService();
exports.mentalService = mentalService;
const mentalController = new mentalCase_controller_1.MentalController(mentalService);
exports.mentalController = mentalController;
