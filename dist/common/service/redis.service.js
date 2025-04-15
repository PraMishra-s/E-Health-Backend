"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/redis.service.ts
const redis_1 = require("@upstash/redis");
const redis_config_1 = require("../../config/redis.config");
const redis = new redis_1.Redis({
    url: redis_config_1.redisConfig.url,
    token: redis_config_1.redisConfig.token,
});
exports.default = redis;
