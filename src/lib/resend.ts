import { Resend } from "resend";
import nodemailer from "nodemailer";

export interface ContactNotificationPayload {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  clientIp?: string;
}

export interface SendContactEmailResult {
  success: boolean;
  messageId?: string;
  provider: "resend" | "smtp";
  error?: string;
}

const DEFAULT_RECIPIENT = "bhavendrakumar007@gmail.com";

function buildHtmlTemplate(payload: ContactNotificationPayload, recipient: string): string {
  const { firstName, lastName, email, phone, subject, message } = payload;
  const fullName = `${firstName} ${lastName || ""}`.trim();
  const safeSubject = subject || "General Inquiry";
  const safePhone = phone && phone.trim() ? phone.trim() : "Not provided";
  const formattedDate = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Submission</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 32px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #075b55 0%, #0d9488 100%);
      padding: 32px 28px;
      color: #ffffff;
      text-align: left;
    }
    .brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 1.5px;
      margin: 0;
      color: #ffffff;
    }
    .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      color: #ccfbf1;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 4px 12px;
      border-radius: 99px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .header-sub {
      font-size: 14px;
      color: #99f6e4;
      margin: 4px 0 0;
      font-weight: 500;
    }
    .content {
      padding: 32px 28px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .info-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
    }
    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .info-label {
      width: 130px;
      font-weight: 700;
      color: #64748b;
      flex-shrink: 0;
    }
    .info-val {
      font-weight: 600;
      color: #0f172a;
      word-break: break-word;
    }
    .info-val a {
      color: #0d9488;
      text-decoration: none;
    }
    .message-section-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #075b55;
      margin-bottom: 10px;
    }
    .message-box {
      background: #f0fdf9;
      border: 1.5px solid #ccfbf1;
      border-radius: 14px;
      padding: 20px;
      font-size: 15px;
      line-height: 1.65;
      color: #134e4a;
      white-space: pre-wrap;
      font-weight: 500;
      margin-bottom: 28px;
    }
    .action-btn-row {
      text-align: center;
      margin: 28px 0 10px;
    }
    .reply-btn {
      display: inline-block;
      background: linear-gradient(135deg, #075b55 0%, #0d9488 100%);
      color: #ffffff !important;
      font-size: 14.5px;
      font-weight: 800;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(7, 91, 85, 0.25);
    }
    .footer {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 20px 28px;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand-row">
          <h1 class="brand-title">BHAVO</h1>
          <span class="badge">Website Lead</span>
        </div>
        <p class="header-sub">New Contact Inquiry Received</p>
      </div>

      <div class="content">
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Topic:</span>
            <span class="info-val" style="color: #075b55; font-weight: 800;">${safeSubject}</span>
          </div>
          <div class="info-row">
            <span class="info-label">From:</span>
            <span class="info-val">${fullName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-val"><a href="mailto:${email}">${email}</a></span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-val">${phone ? `<a href="tel:${safePhone}">${safePhone}</a>` : "Not provided"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Submitted At:</span>
            <span class="info-val">${formattedDate} (IST)</span>
          </div>
        </div>

        <div class="message-section-title">Message Body</div>
        <div class="message-box">${message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>

        <div class="action-btn-row">
          <a class="reply-btn" href="mailto:${email}?subject=Re:%20[BHAVO]%20${encodeURIComponent(safeSubject)}">
            Reply to ${firstName} (${email})
          </a>
        </div>
      </div>

      <div class="footer">
        This inquiry was submitted via the Bhavo landing page contact form.<br/>
        Recipient: ${recipient}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildPlainText(payload: ContactNotificationPayload): string {
  const { firstName, lastName, email, phone, subject, message } = payload;
  const fullName = `${firstName} ${lastName || ""}`.trim();
  return `
[BHAVO Contact Form Submission]

Topic: ${subject || "General Inquiry"}
Name: ${fullName}
Email: ${email}
Phone: ${phone && phone.trim() ? phone.trim() : "Not provided"}
Time: ${new Date().toISOString()}

Message:
${message}

Reply directly to: ${email}
`.trim();
}

/**
 * Sends contact form submissions directly to Bhavendra's email via Resend,
 * with graceful fallback to SMTP if Resend credentials are not configured yet.
 */
export async function sendContactNotification(
  payload: ContactNotificationPayload
): Promise<SendContactEmailResult> {
  const recipient =
    process.env.CONTACT_NOTIFICATION_EMAIL || DEFAULT_RECIPIENT;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "BHAVO Support <onboarding@resend.dev>";
  const resendApiKey = process.env.RESEND_API_KEY;

  const subjectLine = `[BHAVO Contact] ${payload.subject || "New Inquiry"} - ${payload.firstName} ${payload.lastName || ""}`.trim();
  const html = buildHtmlTemplate(payload, recipient);
  const text = buildPlainText(payload);

  // 1. Prioritize Resend when API key is provided
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);

      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [recipient],
        replyTo: payload.email,
        subject: subjectLine,
        html,
        text,
      });

      if (error) {
        console.error("[Resend Error] Failed to send email via Resend:", error);
        throw new Error(error.message || "Failed to send email via Resend");
      }

      console.log(`[Resend Success] Contact email delivered to ${recipient}. ID: ${data?.id}`);
      return {
        success: true,
        messageId: data?.id,
        provider: "resend",
      };
    } catch (err: unknown) {
      const error = err as Error;
      console.error("[Resend Exception] Error sending with Resend:", error);
      // If Resend failed, attempt SMTP fallback below
    }
  } else {
    console.warn(
      "[Resend Notice] RESEND_API_KEY is not configured in .env. Attempting SMTP fallback..."
    );
  }

  // 2. Fallback to existing configured SMTP if available
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    try {
      const host = process.env.SMTP_HOST || "smtp.gmail.com";
      const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
      const secure = process.env.SMTP_SECURE === "true" || port === 465;
      const from = process.env.EMAIL_FROM || `"BHAVO Mobility" <${smtpUser}>`;

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from,
        to: recipient,
        replyTo: payload.email,
        subject: subjectLine,
        html,
        text,
      });

      console.log(`[SMTP Fallback Success] Email sent to ${recipient}: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        provider: "smtp",
      };
    } catch (smtpErr: unknown) {
      const error = smtpErr as Error;
      console.error("[SMTP Fallback Failed] Error sending via SMTP:", error);
      return {
        success: false,
        provider: "smtp",
        error: error.message || "Failed to send email through SMTP fallback",
      };
    }
  }

  return {
    success: false,
    provider: "resend",
    error:
      "RESEND_API_KEY is missing in .env and no fallback SMTP credentials are configured.",
  };
}
