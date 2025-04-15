"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryController = exports.inventoryService = void 0;
const inventory_controller_1 = require("./inventory.controller");
const inventory_service_1 = require("./inventory.service");
const inventoryService = new inventory_service_1.InventoryService();
exports.inventoryService = inventoryService;
const inventoryController = new inventory_controller_1.InventoryController(inventoryService);
exports.inventoryController = inventoryController;
