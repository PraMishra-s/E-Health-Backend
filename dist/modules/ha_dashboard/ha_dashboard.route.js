"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ha_dashboard_module_1 = require("./ha_dashboard.module");
const haDashboardRoute = (0, express_1.Router)();
haDashboardRoute.get("/", ha_dashboard_module_1.haDashoardController.getAnalytics);
exports.default = haDashboardRoute;
