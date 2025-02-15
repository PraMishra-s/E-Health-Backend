
export const verifyEmailTemplate = (url: string, brandColor: string = "#2563EB") => ({
    subject: "Confirm Your Email",
    text: `Please verify your email by clicking the following link: ${url}`,
    html: `
        <div style="max-width:600px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;background:#ffffff;border-radius:8px;box-shadow:0px 4px 8px rgba(0,0,0,0.1);">
            <div style="background:${brandColor};color:#ffffff;padding:20px;font-size:24px;text-align:center;border-top-left-radius:8px;border-top-right-radius:8px;font-weight:bold;">
                Your App Name
            </div>
            <div style="padding:20px;text-align:center;">
                <h1 style="color:#333;">Confirm Your Email</h1>
                <p>Thank you for signing up! Click the button below to verify your email.</p>
                <a href="${url}" style="display:inline-block;padding:15px 25px;font-size:16px;font-weight:bold;background:${brandColor};color:#fff;text-decoration:none;border-radius:5px;margin-top:20px;">
                    Confirm Email
                </a>
                <p>If you did not sign up, ignore this email.</p>
            </div>
            <div style="font-size:14px;color:#999;text-align:center;padding:20px;">
                If you have any issues, contact support.
            </div>
        </div>
    `
});

  
  export const passwordResetTemplate = (
    url: string,
    brandColor: string = "#2563EB"
  ) => ({
    subject: "Reset Your Password",
    text: `To reset your password, please click the following link: ${url}`,
    html: `
      <html><head><style>
        body, html { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); }
        .header { background-color: ${brandColor}; font-size: 24px;  font-weight:bold; color: #ffffff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
        .header img { max-width: 40px; margin-bottom: 10px; }
        .content { padding: 20px; text-align: center; }
        .content h1 { font-size: 24px; color: #333333; }
        .content p { font-size: 16px; color: #666666; margin: 10px 0 20px; }
        .button { display: inline-block; padding: 15px 25px; font-size: 16px; font-weight: bold; background-color: ${brandColor};  color: #fff !important; border-radius: 5px; text-decoration: none; margin-top: 20px; }
        .footer { font-size: 14px; color: #999999; text-align: center; padding: 20px; }
      </style></head><body>
        <div class="container">
          <div class="header">Squeezy</div>
          <div class="content">
            <h1>Reset Your Password</h1>
            <p>We received a request to reset your password. Click the button below to proceed with resetting your password.</p>
            <a href="${url}" class="button">Reset Password</a>
            <p>If you did not request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>If you have any questions, feel free to reply to this email or contact our support team.</p>
          </div>
        </div>
      </body></html>
    `,
  });