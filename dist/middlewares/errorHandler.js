"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const http_config_1 = require("../config/http.config");
const AppError_1 = require("../common/utils/AppError");
const zod_1 = require("zod");
const cookies_1 = require("../common/utils/cookies");
const formatZodError = (res, error) => {
    var _a;
    const errors = (_a = error === null || error === void 0 ? void 0 : error.issues) === null || _a === void 0 ? void 0 : _a.map((err) => ({
        field: err.path.join("."),
        message: err.message
    }));
    return res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
        message: "Validation failed",
        errors: errors
    });
};
const errorHandler = (error, req, res, next) => {
    console.error(`Error occured at path: ${req.path}`, error);
    if (req.path === cookies_1.REFRESH_PATH) {
        (0, cookies_1.clearAuthenticationCookies)(res);
    }
    if (error instanceof SyntaxError) {
        return res.status(http_config_1.HTTPSTATUS.BAD_GATEWAY).json({
            message: "Invalid Json format, please check your request body"
        });
    }
    if (error instanceof zod_1.z.ZodError) {
        return formatZodError(res, error);
    }
    if (error instanceof AppError_1.AppError) {
        return res.status(error.statusCode).json({
            message: error.message,
            errorCode: error.errorCode
        });
    }
    return res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
        error: (error === null || error === void 0 ? void 0 : error.message) || "Unknown error occured"
    });
};
exports.errorHandler = errorHandler;
