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
exports.SessionController = void 0;
const zod_1 = require("zod");
const catch_errors_1 = require("../../common/utils/catch-errors");
const http_config_1 = require("../../config/http.config");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
const cookies_1 = require("../../common/utils/cookies");
class SessionController {
    constructor(sessionService) {
        this.getAllSession = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const currentSessionId = req.sessionId;
            if (!currentSessionId) {
                throw new catch_errors_1.UnauthorizedException("Session ID not found. Please log in.", "ACCESS_UNAUTHORIZED" /* ErrorCode.ACCESS_UNAUTHORIZED */);
            }
            const sessions = yield this.sessionService.getAllSessionsBySessionId(userId, currentSessionId);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "Retrieved all sessions successfully",
                sessions,
            });
        }));
        this.getSession = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const sessionId = req.sessionId;
            if (!sessionId) {
                throw new catch_errors_1.NotFoundException("Session ID not Found. Please Log in", "ACCESS_UNAUTHORIZED" /* ErrorCode.ACCESS_UNAUTHORIZED */);
            }
            const { user } = yield this.sessionService.getSessionById(sessionId);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "Session retrieved Successfully",
                user
            });
        }));
        this.deleteSession = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sessionId = zod_1.z.string().parse(req.params.id);
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const currentSessionId = req.sessionId;
            if (!userId) {
                throw new catch_errors_1.UnauthorizedException("Session not found.", "ACCESS_UNAUTHORIZED" /* ErrorCode.ACCESS_UNAUTHORIZED */);
            }
            yield this.sessionService.deleteSession(sessionId, userId);
            if (sessionId === currentSessionId) {
                return (0, cookies_1.clearAuthenticationCookies)(res).status(http_config_1.HTTPSTATUS.OK).json({
                    message: `Session removed successfully and User logout.`,
                });
            }
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "Session removed successfully",
            });
        }));
        this.deleteAllSessions = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            ;
            if (!userId) {
                throw new catch_errors_1.UnauthorizedException("Session not found. Please log in.", "ACCESS_UNAUTHORIZED" /* ErrorCode.ACCESS_UNAUTHORIZED */);
            }
            const response = yield this.sessionService.deleteAllSessions(userId);
            return (0, cookies_1.clearAuthenticationCookies)(res).status(http_config_1.HTTPSTATUS.OK).json({
                message: `All Session removed successfully and user logged out.`,
            });
        }));
        this.sessionService = sessionService;
    }
}
exports.SessionController = SessionController;
