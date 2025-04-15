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
exports.HaController = void 0;
const catch_errors_1 = require("../../common/utils/catch-errors");
const ha_validator_1 = require("../../common/validators/ha.validator");
const inventory_validator_1 = require("../../common/validators/inventory.validator");
const http_config_1 = require("../../config/http.config");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
class HaController {
    constructor(haService) {
        this.forgotPassword = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email, secret_word } = ha_validator_1.fogotPasswordSchema.parse(req.body);
            const response = this.haService.forgotPassword(email, secret_word);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "Password reset Email send"
            });
        }));
        this.changeSecretWord = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Unauthorized access.", "ACCESS_FORBIDDEN" /* ErrorCode.ACCESS_FORBIDDEN */);
            }
            const { currentSecret, newSecret } = ha_validator_1.changeSecretWordSchema.parse(req.body);
            yield this.haService.changeSecretWord(userId, currentSecret, newSecret);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "Secret changed successfully.",
            });
        }));
        this.toggleAvailability = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Unauthorized access", "ACCESS_FORBIDDEN" /* ErrorCode.ACCESS_FORBIDDEN */);
            }
            const newStatus = yield this.haService.toggleAvailability(userId);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: `Availability updated successfully.`,
                is_available: newStatus,
            });
        }));
        this.setLeave = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Unauthorized access.", "ACCESS_FORBIDDEN" /* ErrorCode.ACCESS_FORBIDDEN */);
            }
            // Validate input
            const { start_date, end_date, reason } = ha_validator_1.setLeaveSchema.parse(req.body);
            yield this.haService.setLeave(userId, start_date, end_date, reason);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "Leave details set successfully.",
            });
        }));
        this.cancelLeave = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Unauthorized access.", "ACCESS_FORBIDDEN" /* ErrorCode.ACCESS_FORBIDDEN */);
            }
            yield this.haService.cancelLeave(userId);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "Leave cancelled successfully; HA is now available."
            });
        }));
        this.getLeave = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Unauthorized access.", "ACCESS_FORBIDDEN" /* ErrorCode.ACCESS_FORBIDDEN */);
            }
            const leaveDetails = yield this.haService.getLeave(userId);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "Leave details fetched successfully.",
                leaveDetails,
            });
        }));
        this.getHaDetails = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || userType !== "HA" && userType !== "DEAN") {
                throw new catch_errors_1.UnauthorizedException("Unauthorized access.", "ACCESS_FORBIDDEN" /* ErrorCode.ACCESS_FORBIDDEN */);
            }
            const haDetails = yield this.haService.getHaDetails();
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "HA details fetched successfully.",
                haDetails,
            });
        }));
        this.changeStatus = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            const id = inventory_validator_1.uuidSchema.parse(req.params.id);
            if (!userId || userType !== "HA" && userType !== "DEAN") {
                throw new catch_errors_1.UnauthorizedException("Unauthorized access.", "ACCESS_FORBIDDEN" /* ErrorCode.ACCESS_FORBIDDEN */);
            }
            const { status } = ha_validator_1.changeStatusSchema.parse(req.body);
            yield this.haService.changeStatus(id, status);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "HA status updated successfully.",
            });
        }));
        this.haService = haService;
    }
}
exports.HaController = HaController;
