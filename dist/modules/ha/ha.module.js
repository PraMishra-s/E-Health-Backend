"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haController = exports.haService = void 0;
const ha_controller_1 = require("./ha.controller");
const ha_service_1 = require("./ha.service");
const haService = new ha_service_1.HaService();
exports.haService = haService;
const haController = new ha_controller_1.HaController(haService);
exports.haController = haController;
