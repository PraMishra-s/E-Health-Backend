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
exports.MFAController = void 0;
const catch_errors_1 = require("../../common/utils/catch-errors");
const cookies_1 = require("../../common/utils/cookies");
const mfa_validator_1 = require("../../common/validators/mfa.validator");
const http_config_1 = require("../../config/http.config");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
class MFAController {
    constructor(mfaService) {
        this.invokeMFASetup = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const sessionId = req === null || req === void 0 ? void 0 : req.sessionId;
            if (!userId) {
                throw new catch_errors_1.UnauthorizedException("Session not found. Please log in.");
            }
            const user = yield this.mfaService.invokeMFASetup(userId, sessionId);
            return res.status(http_config_1.HTTPSTATUS.CREATED).json({
                message: "MFA has been enabled successfully.",
                user
            });
        }));
        this.verifyMFAForLogin = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email, code, userAgent } = mfa_validator_1.verifyMFAForLoginSchema.parse(Object.assign(Object.assign({}, req.body), { userAgent: req.headers['user-agent'] }));
            const { user, accessToken, refreshToken } = yield this.mfaService.verifyMFAForLogin(code, email, userAgent);
            return (0, cookies_1.setAuthenticationCookies)({ res, accessToken, refreshToken })
                .status(http_config_1.HTTPSTATUS.OK)
                .json({
                message: "Verified & logged in successfully",
                user
            });
        }));
        this.revokeMFA = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const sessionId = req === null || req === void 0 ? void 0 : req.sessionId;
            if (!userId) {
                throw new catch_errors_1.UnauthorizedException("Session ID not found. Please log in.");
            }
            yield this.mfaService.revokeMFA(userId, sessionId);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "MFA successfully disabled.",
            });
        }));
        this.mfaService = mfaService;
    }
}
exports.MFAController = MFAController;
