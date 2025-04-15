"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haDashoardController = exports.haDashboardService = void 0;
const ha_dashboard_controller_1 = require("./ha_dashboard.controller");
const ha_dashboard_service_1 = require("./ha_dashboard.service");
const haDashboardService = new ha_dashboard_service_1.HaDashboardService();
exports.haDashboardService = haDashboardService;
const haDashoardController = new ha_dashboard_controller_1.HaDashboardController(haDashboardService);
exports.haDashoardController = haDashoardController;
