"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentalController = void 0;
const catch_errors_1 = require("../../common/utils/catch-errors");
const inventory_validator_1 = require("../../common/validators/inventory.validator");
const mentalCases_validator_1 = require("../../common/validators/mentalCases.validator");
const http_config_1 = require("../../config/http.config");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
class MentalController {
    constructor(mentalService) {
        this.getAllCases = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || userType !== "HA" && userType !== "DEAN") {
                throw new catch_errors_1.UnauthorizedException("Unauthorized access.", "ACCESS_FORBIDDEN" /* ErrorCode.ACCESS_FORBIDDEN */);
            }
            const cases = yield this.mentalService.getAllCases();
            res.status(http_config_1.HTTPSTATUS.OK).json({ message: 'Cases retrieved successfully', cases });
        }));
        this.updateCase = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || userType !== "HA" && userType !== 'DEAN') {
                throw new catch_errors_1.UnauthorizedException("Unauthorized access.", "ACCESS_FORBIDDEN" /* ErrorCode.ACCESS_FORBIDDEN */);
            }
            const id = inventory_validator_1.uuidSchema.parse(req.params.id);
            const data = mentalCases_validator_1.updateMentalHealthCaseSchema.parse(req.body);
            const updatedCase = yield this.mentalService.updateCase(id, data);
            res.status(http_config_1.HTTPSTATUS.OK).json({ message: 'Mental health case updated successfully', updatedCase });
        }));
        this.mentalService = mentalService;
    }
}
exports.MentalController = MentalController;
