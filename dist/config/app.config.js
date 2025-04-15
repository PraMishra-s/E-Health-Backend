"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const get_env_1 = require("../common/utils/get-env");
const appConfig = () => ({
    NODE_ENV: (0, get_env_1.getEnv)('NODE_ENV', 'development'),
    APP_ORIGIN: (0, get_env_1.getEnv)("APP_ORIGIN", 'localhost'),
    PORT: (0, get_env_1.getEnv)("PORT", '5000'),
    DATABASE_URL: (0, get_env_1.getEnv)("DATABASE_URL", 'DATABASE_URL'),
    BASE_PATH: (0, get_env_1.getEnv)("BASE_PATH", '/api/v1'),
    JWT: {
        SECRET: (0, get_env_1.getEnv)("JWT_SECRET", 'JWT_SECRET'),
        EXPIRES_IN: (0, get_env_1.getEnv)("JWT_EXPIRES_IN", "15m"),
        REFRESH_SECRET: (0, get_env_1.getEnv)("JWT_REFRESH_SECRET", "JWT_REFRESH_SECRET"),
        REFRESH_EXPIRES_IN: (0, get_env_1.getEnv)("JWT_REFRESH_EXPIRES_IN", "JWT_REFRESH_EXPIRES_IN")
    },
    NODE_MAILER: {
        SMTP_HOST: (0, get_env_1.getEnv)("SMTP_HOST", 'SMTP_HOST'),
        SMTP_PORT: (0, get_env_1.getEnv)("SMTP_PORT", 'SMTP_PORT'),
        SMTP_SECURE: (0, get_env_1.getEnv)('SMTP_SECURE', 'SMTP_SECURE'),
        SMTP_USER: (0, get_env_1.getEnv)('SMTP_USER', 'SMTP_USER'),
        SMTP_PASS: (0, get_env_1.getEnv)('SMTP_PASS', 'SMTP_PASS')
    },
    MAILER_SENDER: (0, get_env_1.getEnv)("MAILER_SENDER", "MAILER_SENDER"),
    RESEND_API_KEY: (0, get_env_1.getEnv)("RESEND_API_KEY", "RESEND_API_KEY"),
});
exports.config = appConfig();
