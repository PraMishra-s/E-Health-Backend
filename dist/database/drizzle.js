"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const serverless_1 = require("@neondatabase/serverless");
const neon_http_1 = require("drizzle-orm/neon-http");
const app_config_1 = require("../config/app.config");
const sql = (0, serverless_1.neon)(app_config_1.config.DATABASE_URL);
exports.db = (0, neon_http_1.drizzle)({ client: sql });
