import nodemailer from "nodemailer";
import { config } from "../config/app.config";

// Create a transporter using nodemailer with SMTP credentials
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

// Updated sendEmail function to return { data, error }
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
    try {
        // Send the email using the transporter
        const info = await transporter.sendMail({
            from,
            to: Array.isArray(to) ? to.join(", ") : to,
            subject,
            text,
            html
        });

        // Return success response with email info
        return { data: info, error: null };
    } catch (error: any) {
        // Return error response
        return { data: null, error };
    }
};
