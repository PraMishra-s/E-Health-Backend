
 export const verifyEmailTemplate = (
  url: string,
  brandColor: string = "#2563EB"
) => ({
  subject: "Confirm Your Email",
  text: `Please verify your email by clicking the following link: ${url}`,
  html: `
   <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Confirm Your Email</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
      <tr>
        <td align="center">
          <table width="600" border="0" cellpadding="0" cellspacing="0" style="background-color: #fff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <tr>
              <td align="center" style="background-color: ${brandColor}; padding: 20px; border-radius: 10px 10px 0 0; color: #fff; font-size: 22px; font-weight: bold;">
                E-HealthCST
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 30px; text-align: center;">
                <h1 style="color: #333; font-size: 24px;">Reset Your Password</h1>
                <p style="color: #555; font-size: 16px;">
                  We received a request to reset your password. Click the button below to proceed.
                </p>

                <!-- Reset Button -->
                <table width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center">
                      <a href="${url}" target="_blank" style="
                        display: inline-block;
                        padding: 12px 20px;
                        font-size: 16px;
                        font-weight: bold;
                        background-color: ${brandColor};
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 5px;
                        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                        transition: 0.3s;
                      ">Confirm Your Email</a>
                    </td>
                  </tr>
                </table>

                <p style="color: #666; font-size: 14px;">
                  If you did not request this, you can ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 15px; font-size: 13px; color: #888; border-top: 1px solid #ddd;">
                College of Science and Technology, Rinchending, Phuentsholing<br>
                Post-Box No: 450, Postal Code: 21101
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `,
});
export const mfaOtpTemplate = (
  otp: string,
  brandColor: string = "#2563EB"
) => ({
  subject: "OTP for logging in.",
  text: `Please verify by using the following otp: ${otp}`,
  html: `
   <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>OTP for logging in.</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
      <tr>
        <td align="center">
          <table width="600" border="0" cellpadding="0" cellspacing="0" style="background-color: #fff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <tr>
              <td align="center" style="background-color: ${brandColor}; padding: 20px; border-radius: 10px 10px 0 0; color: #fff; font-size: 22px; font-weight: bold;">
                E-HealthCST
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 30px; text-align: center;">
                <h1 style="color: #333; font-size: 24px;">OTP for logging in.</h1>
                <p style="color: #555; font-size: 16px;">
                  Please enter the following OTP in the applicaiton to log in.
                </p>

                <!-- Reset Button -->
                <table width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center">
                      <p  style="
                        display: inline-block;
                        padding: 12px 20px;
                        font-size: 16px;
                        font-weight: bold;
                        background-color: ${brandColor};
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 5px;
                        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                        transition: 0.3s;
                      ">${otp}</a>
                    </td>
                  </tr>
                </table>

                <p style="color: #666; font-size: 14px;">
                  If you did not request this, you can ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 15px; font-size: 13px; color: #888; border-top: 1px solid #ddd;">
                College of Science and Technology, Rinchending, Phuentsholing<br>
                Post-Box No: 450, Postal Code: 21101
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `,
});

  
export const passwordResetTemplate = (
  url: string,
  brandColor: string = "#2563EB"
) => ({
  subject: "Reset Your Password",
  text: `To reset your password, please click the following link: ${url}`,
  html: `
   <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Reset Your Password</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
      <tr>
        <td align="center">
          <table width="600" border="0" cellpadding="0" cellspacing="0" style="background-color: #fff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <tr>
              <td align="center" style="background-color: ${brandColor}; padding: 20px; border-radius: 10px 10px 0 0; color: #fff; font-size: 22px; font-weight: bold;">
                E-HealthCST
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 30px; text-align: center;">
                <h1 style="color: #333; font-size: 24px;">Reset Your Password</h1>
                <p style="color: #555; font-size: 16px;">
                  We received a request to reset your password. Click the button below to proceed.
                </p>

                <!-- Reset Button -->
                <table width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center">
                      <a href="${url}" target="_blank" style="
                        display: inline-block;
                        padding: 12px 20px;
                        font-size: 16px;
                        font-weight: bold;
                        background-color: ${brandColor};
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 5px;
                        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                        transition: 0.3s;
                      ">Reset Password</a>
                    </td>
                  </tr>
                </table>

                <p style="color: #666; font-size: 14px;">
                  If you did not request this, you can ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 15px; font-size: 13px; color: #888; border-top: 1px solid #ddd;">
                College of Science and Technology, Rinchending, Phuentsholing<br>
                Post-Box No: 450, Postal Code: 21101
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `,
});
