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
exports.UserController = void 0;
const catch_errors_1 = require("../../common/utils/catch-errors");
const auth_validator_1 = require("../../common/validators/auth.validator");
const inventory_validator_1 = require("../../common/validators/inventory.validator");
const user_validator_1 = require("../../common/validators/user.validator");
const http_config_1 = require("../../config/http.config");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
class UserController {
    constructor(userService) {
        this.updateUserProfile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const sessionId = req === null || req === void 0 ? void 0 : req.sessionId;
            if (!userId) {
                return res.status(http_config_1.HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
            }
            const validatedData = user_validator_1.updateUserSchema.parse(req.body); // Validate input
            const updatedUser = yield this.userService.updateUser(userId, validatedData, sessionId);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "User profile updated successfully",
                user: updatedUser,
            });
        }));
        this.changePassword = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                throw new catch_errors_1.UnauthorizedException("Unauthorized access.");
            }
            const { currentPassword, newPassword } = user_validator_1.changePasswordSchema.parse(req.body);
            yield this.userService.changePassword(userId, currentPassword, newPassword);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "Password changed successfully.",
            });
        }));
        this.getEmail = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const email = auth_validator_1.emailSchema.parse(req.body.email);
            const userType = yield this.userService.getEmail(email);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "User type retrieved successfully",
                userType,
            });
        }));
        this.updatePofilePic = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const sessionId = req === null || req === void 0 ? void 0 : req.sessionId;
            if (!userId) {
                return res.status(http_config_1.HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
            }
            const validatedData = user_validator_1.updateProfilePicSchema.parse(req.body);
            const updatedUser = yield this.userService.updateProfilePic(userId, validatedData, sessionId);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "User profile picture updated successfully",
                user: updatedUser,
            });
        }));
        this.getUsers = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || userType != 'HA') {
                return res.status(http_config_1.HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
            }
            const response = yield this.userService.getUsers();
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "Users Retrieved Succesfully",
                users: response
            });
        }));
        this.getProgrammes = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                throw new catch_errors_1.UnauthorizedException("Unauthorized access.");
            }
            const response = yield this.userService.getProgrammes();
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "Programmes Retrieved Succesfully",
                departments: response
            });
        }));
        this.changeUserType = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || userType != 'HA' && userType != 'DEAN') {
                return res.status(http_config_1.HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
            }
            const id = inventory_validator_1.uuidSchema.parse(req.params.id);
            const { type } = user_validator_1.changeUserTypeSchema.parse(req.body);
            const response = yield this.userService.changeUserType(id, type);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "User Type Changed Succesfully",
                users: response
            });
        }));
        this.getStaff = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || userType != 'HA' && userType != 'DEAN') {
                return res.status(http_config_1.HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
            }
            const response = yield this.userService.getStaff();
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "Staff Retrieved Succesfully",
                staff: response
            });
        }));
        this.userService = userService;
    }
}
exports.UserController = UserController;
