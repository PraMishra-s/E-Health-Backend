"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.illnessCategoryController = exports.illnessCategoryService = void 0;
const illnessCategory_controller_1 = require("./illnessCategory.controller");
const illnessCategory_service_1 = require("./illnessCategory.service");
const illnessCategoryService = new illnessCategory_service_1.IllnessCategoryService();
exports.illnessCategoryService = illnessCategoryService;
const illnessCategoryController = new illnessCategory_controller_1.IllnessCategoryController(illnessCategoryService);
exports.illnessCategoryController = illnessCategoryController;
