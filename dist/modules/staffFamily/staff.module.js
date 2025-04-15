"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffController = exports.staffService = void 0;
const staff_controller_1 = require("./staff.controller");
const staff_service_1 = require("./staff.service");
const staffService = new staff_service_1.StaffService();
exports.staffService = staffService;
const staffController = new staff_controller_1.StaffController(staffService);
exports.staffController = staffController;
