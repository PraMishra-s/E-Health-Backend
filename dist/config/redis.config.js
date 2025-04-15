"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConfig = void 0;
const get_env_1 = require("../common/utils/get-env");
exports.redisConfig = {
    url: (0, get_env_1.getEnv)("REDIS_URL", "REDIS_URL"),
    token: (0, get_env_1.getEnv)("REDIS_TOKEN", "REDIS_TOKEN"),
};
