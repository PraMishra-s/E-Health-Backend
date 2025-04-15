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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const ratelimit_1 = require("@upstash/ratelimit");
const redis_service_1 = __importDefault(require("../common/service/redis.service"));
const http_config_1 = require("../config/http.config");
const redisLimiter = new ratelimit_1.Ratelimit({
    redis: redis_service_1.default,
    limiter: ratelimit_1.Ratelimit.fixedWindow(2, "60s"),
    analytics: true,
});
const memoryLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 2,
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
const rateLimiter = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { success } = yield redisLimiter.limit(req.ip);
        if (!success) {
            res.status(http_config_1.HTTPSTATUS.TOO_MANY_REQUESTS).json({ message: "Too many requests, slow down!" });
            return;
        }
    }
    catch (error) {
        console.error("Upstash rate limiter failed, switching to in-memory fallback.");
        memoryLimiter(req, res, next);
        return;
    }
    next();
});
exports.rateLimiter = rateLimiter;
