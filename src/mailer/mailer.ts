import nodemailer from "nodemailer";
import { config } from "../config/app.config";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: config.NODE_MAILER.SMTP_HOST,
    port: config.NODE_MAILER.SMTP_PORT,
    secure: config.NODE_MAILER.SMTP_SECURE === "true", 
    auth: {
        user: config.NODE_MAILER.SMTP_USER,
        pass: config.NODE_MAILER.SMTP_PASS
    }
} as nodemailer.TransportOptions);

export const sendEmail = async ({
    to,
    subject,
    text,
    html,
    from = config.MAILER_SENDER
}: {
    to: string | string[];
    subject: string;
    text: string;
    html: string;
    from?: string;
}) => {
    await transporter.sendMail({
        from,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        text,
        html
    });
};
