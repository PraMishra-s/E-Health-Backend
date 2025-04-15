"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../common/strageties/jwt.strategy");
const illnessCategory_module_1 = require("./illnessCategory.module");
const illnessCategoryRoute = (0, express_1.Router)();
// Illness Category Routes
illnessCategoryRoute.post("/create", jwt_strategy_1.authenticateJWT, illnessCategory_module_1.illnessCategoryController.createCategory);
illnessCategoryRoute.get("/", jwt_strategy_1.authenticateJWT, illnessCategory_module_1.illnessCategoryController.getAllCategories);
illnessCategoryRoute.put("/update/:id", jwt_strategy_1.authenticateJWT, illnessCategory_module_1.illnessCategoryController.updateCategory);
illnessCategoryRoute.delete("/delete/:id", jwt_strategy_1.authenticateJWT, illnessCategory_module_1.illnessCategoryController.deleteCategory);
exports.default = illnessCategoryRoute;
