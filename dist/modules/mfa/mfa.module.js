"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mfaController = exports.mfaService = void 0;
const mfa_controller_1 = require("./mfa.controller");
const mfa_service_1 = require("./mfa.service");
const mfaService = new mfa_service_1.MFAService();
exports.mfaService = mfaService;
const mfaController = new mfa_controller_1.MFAController(mfaService);
exports.mfaController = mfaController;
