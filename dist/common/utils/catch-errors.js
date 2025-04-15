"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpException = exports.InternalServerException = exports.UnauthorizedException = exports.BadRequestException = exports.NotFoundException = void 0;
const http_config_1 = require("../../config/http.config");
const AppError_1 = require("./AppError");
class NotFoundException extends AppError_1.AppError {
    constructor(message = "Resource not found", errorCode) {
        super(message, http_config_1.HTTPSTATUS.NOT_FOUND, errorCode || "RESOURCE_NOT_FOUND" /* ErrorCode.RESOURCE_NOT_FOUND */);
    }
}
exports.NotFoundException = NotFoundException;
class BadRequestException extends AppError_1.AppError {
    constructor(message = "Bad Request", errorCode) {
        super(message, http_config_1.HTTPSTATUS.BAD_REQUEST, errorCode);
    }
}
exports.BadRequestException = BadRequestException;
class UnauthorizedException extends AppError_1.AppError {
    constructor(message = "Unauthorized Access", errorCode) {
        super(message, http_config_1.HTTPSTATUS.UNAUTHORIZED, errorCode || "ACCESS_UNAUTHORIZED" /* ErrorCode.ACCESS_UNAUTHORIZED */);
    }
}
exports.UnauthorizedException = UnauthorizedException;
class InternalServerException extends AppError_1.AppError {
    constructor(message = "Internal Server Error", errorCode) {
        super(message, http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR, errorCode || "INTERNAL_SERVER_ERROR" /* ErrorCode.INTERNAL_SERVER_ERROR */);
    }
}
exports.InternalServerException = InternalServerException;
class HttpException extends AppError_1.AppError {
    constructor(message = "Http Exception Error", statusCode, errorCode) {
        super(message, statusCode, errorCode);
    }
}
exports.HttpException = HttpException;
