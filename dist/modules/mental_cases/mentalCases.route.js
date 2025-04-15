"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../common/strageties/jwt.strategy");
const mentalCase_module_1 = require("./mentalCase.module");
const Mentalroute = (0, express_1.Router)();
Mentalroute.get('/', jwt_strategy_1.authenticateJWT, mentalCase_module_1.mentalController.getAllCases);
Mentalroute.put('/update/:id', jwt_strategy_1.authenticateJWT, mentalCase_module_1.mentalController.updateCase);
exports.default = Mentalroute;
