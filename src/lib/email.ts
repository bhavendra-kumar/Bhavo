import nodemailer from "nodemailer";

interface SendOtpParams {
  to: string;
  name?: string;
  otp: string;
}

export async function sendOtpEmail({ to, name, otp }: SendOtpParams): Promise<{ sent: boolean; messageId?: string; error?: string }> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const secure = process.env.SMTP_SECURE === "true" || (port === 465 || !port);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || (user ? `"Bhavo Mobility" <${user}>` : '"Bhavo Mobility" <no-reply@bhavo.in>');

  console.log(`\n==============================================`);
  console.log(`📧 [Bhavo Email Service]`);
  console.log(`To: ${to}`);
  console.log(`OTP: ${otp}`);
  console.log(`SMTP Configured: ${Boolean(user && pass)}`);
  console.log(`==============================================\n`);

  if (!user || !pass) {
    console.warn("[Bhavo Email Service] SMTP_USER/SMTP_PASS or GMAIL_USER/GMAIL_APP_PASSWORD not configured in .env. OTP will only be logged to console / UI fallback.");
    return {
      sent: false,
      error: "SMTP credentials not configured in .env",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const displayName = name || "Bhavo Rider";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 520px; margin: 30px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #042f2e 0%, #0f766e 100%); padding: 32px 28px; text-align: center; }
          .logo { font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: 2px; }
          .sub { color: #99f6e4; font-size: 13px; font-weight: 600; margin-top: 4px; letter-spacing: 0.5px; }
          .body { padding: 36px 32px; color: #334155; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
          .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
          .otp-box { background: #f0fdfa; border: 2px dashed #0d9488; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0f766e; font-family: monospace; }
          .expiry { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 500; }
          .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">BHAVO</div>
            <div class="sub">SMART URBAN MOBILITY</div>
          </div>
          <div class="body">
            <div class="title">Verification Code</div>
            <div class="text">Hello ${displayName},<br/>We received a request to reset your Bhavo account password. Use the verification code below to proceed.</div>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="expiry">Valid for 10 minutes. Do not share this code with anyone.</div>
            </div>
            <div class="text" style="font-size: 13px; color: #64748b;">If you did not request a password reset, you can safely ignore this email or contact support if you have concerns.</div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Bhavo Mobility Inc. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from,
      to,
      subject: `[Bhavo] Your verification code is ${otp}`,
      text: `Your Bhavo verification code is: ${otp}. It will expire in 10 minutes.`,
      html: htmlContent,
    });

    console.log(`[Bhavo Email Service] Email sent successfully: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Bhavo Email Service] Failed to send email via SMTP:", err);
    return { sent: false, error: err?.message || "Failed to send email" };
  }
}
