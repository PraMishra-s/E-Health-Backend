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
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const app_config_1 = require("../config/app.config");
// Create a transporter using nodemailer with SMTP credentials
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    host: app_config_1.config.NODE_MAILER.SMTP_HOST,
    port: app_config_1.config.NODE_MAILER.SMTP_PORT,
    secure: app_config_1.config.NODE_MAILER.SMTP_SECURE === "true",
    auth: {
        user: app_config_1.config.NODE_MAILER.SMTP_USER,
        pass: app_config_1.config.NODE_MAILER.SMTP_PASS
    }
});
// Updated sendEmail function to return { data, error }
const sendEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ to, subject, text, html, from = app_config_1.config.MAILER_SENDER }) {
    try {
        // Send the email using the transporter
        const info = yield transporter.sendMail({
            from,
            to: Array.isArray(to) ? to.join(", ") : to,
            subject,
            text,
            html
        });
        // Return success response with email info
        return { data: info, error: null };
    }
    catch (error) {
        // Return error response
        return { data: null, error };
    }
});
exports.sendEmail = sendEmail;
