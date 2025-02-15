import { getEnv } from "../common/utils/get-env"
const appConfig = () =>({
    NODE_ENV : getEnv('NODE_ENV', 'development'),
    APP_ORIGIN: getEnv("APP_ORIGIN", 'localhost'),
    PORT: getEnv("PORT", '5000'),
    DATABASE_URL: getEnv("DATABASE_URL",'DATABASE_URL'),
    BASE_PATH: getEnv("BASE_PATH", '/api/v1'),
    JWT:{
        SECRET: getEnv("JWT_SECRET", 'JWT_SECRET'),
        EXPIRES_IN: getEnv("JWT_EXPIRES_IN", "15m"),
        REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET","JWT_REFRESH_SECRET"),
        REFRESH_EXPIRES_IN: getEnv("JWT_REFRESH_EXPIRES_IN","JWT_REFRESH_EXPIRES_IN") 
    },
    NODE_MAILER:{
        SMTP_HOST : getEnv("SMTP_HOST", 'SMTP_HOST'),
        SMTP_PORT: getEnv("SMTP_PORT", 'SMTP_PORT'),
        SMTP_SECURE: getEnv('SMTP_SECURE', 'SMTP_SECURE'),
        SMTP_USER: getEnv('SMTP_USER', 'SMTP_USER'),
        SMTP_PASS: getEnv('SMTP_PASS', 'SMTP_PASS')
    },
    MAILER_SENDER: getEnv("MAILER_SENDER", "MAILER_SENDER"),
    RESEND_API_KEY: getEnv("RESEND_API_KEY", "RESEND_API_KEY"),

})
export const config = appConfig()