"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../common/strageties/jwt.strategy");
const inventory_module_1 = require("./inventory.module");
const inventoryRoutes = (0, express_1.Router)();
// Medicine_Categories Routes
inventoryRoutes.post("/categories/add", jwt_strategy_1.authenticateJWT, inventory_module_1.inventoryController.createCategory);
inventoryRoutes.get("/categories", inventory_module_1.inventoryController.getCategories);
inventoryRoutes.put("/categories/:id", jwt_strategy_1.authenticateJWT, inventory_module_1.inventoryController.updateCategory);
inventoryRoutes.delete("/categories/:id", jwt_strategy_1.authenticateJWT, inventory_module_1.inventoryController.deleteCategory);
//Medicine Categories Counts
inventoryRoutes.get("/categories/counts", inventory_module_1.inventoryController.getCategoriesCount);
// Medicine Routes
inventoryRoutes.post("/medicines", jwt_strategy_1.authenticateJWT, inventory_module_1.inventoryController.createMedicine);
inventoryRoutes.get("/medicines", inventory_module_1.inventoryController.getMedicines);
inventoryRoutes.get("/medicines/:id", inventory_module_1.inventoryController.getMedicineById);
inventoryRoutes.put("/medicines/:id", jwt_strategy_1.authenticateJWT, inventory_module_1.inventoryController.updateMedicine);
inventoryRoutes.delete("/medicines/:id", jwt_strategy_1.authenticateJWT, inventory_module_1.inventoryController.deleteMedicine);
inventoryRoutes.get("/medicines-expired", inventory_module_1.inventoryController.getMedicinesExpired);
//Medical Transcations
inventoryRoutes.post("/transactions/add", jwt_strategy_1.authenticateJWT, inventory_module_1.inventoryController.addStock);
inventoryRoutes.post("/transactions/use", jwt_strategy_1.authenticateJWT, inventory_module_1.inventoryController.useMedicine);
inventoryRoutes.post("/transactions/remove", jwt_strategy_1.authenticateJWT, inventory_module_1.inventoryController.removeStock);
inventoryRoutes.get("/transactions/", jwt_strategy_1.authenticateJWT, inventory_module_1.inventoryController.getTransactions);
//Medicine Batches
inventoryRoutes.get("/medicine/batch/:id", jwt_strategy_1.authenticateJWT, inventory_module_1.inventoryController.getBatchesById); // ✅ Get all batches for a medicine
inventoryRoutes.get("/medicine/batch/", jwt_strategy_1.authenticateJWT, inventory_module_1.inventoryController.getBatches); // ✅ Get all batches for a medicine
inventoryRoutes.put("/medicine/batch/update/:id", jwt_strategy_1.authenticateJWT, inventory_module_1.inventoryController.updateBatch); // ✅ Update batch details
inventoryRoutes.delete("/medicine/batch/delete/:id", jwt_strategy_1.authenticateJWT, inventory_module_1.inventoryController.deleteBatch); // ✅ Delete batch
inventoryRoutes.delete("/medicine/batch/expired/delete/:id", jwt_strategy_1.authenticateJWT, inventory_module_1.inventoryController.deleteBatchById);
exports.default = inventoryRoutes;
