"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.treatmentController = exports.treatmentService = void 0;
const treatment_controller_1 = require("./treatment.controller");
const treatment_service_1 = require("./treatment.service");
const treatmentService = new treatment_service_1.TreatmentService();
exports.treatmentService = treatmentService;
const treatmentController = new treatment_controller_1.TreatmentController(treatmentService);
exports.treatmentController = treatmentController;
