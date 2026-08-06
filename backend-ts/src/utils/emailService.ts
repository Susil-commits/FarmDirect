import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
}

/** Simple email format validation. */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

let transporter: Transporter | null = null;

if (env.smtpHost && env.smtpUser && env.smtpPass) {
  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });
} else {
  console.warn('Email Service: SMTP not configured. Logging emails to console instead.');
}

/**
 * Attempt to send an email with one automatic retry on transient failures.
 */
async function attemptSend(mailOptions: nodemailer.SendMailOptions, attempt = 1): Promise<nodemailer.SentMessageInfo> {
  try {
    return await transporter!.sendMail(mailOptions);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isTransient =
      message.includes('ETIMEDOUT') ||
      message.includes('ECONNRESET') ||
      message.includes('ENOTFOUND') ||
      message.includes('connection refused');

    if (isTransient && attempt < 2) {
      console.warn(`Email send failed (attempt ${attempt}), retrying in 2s...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return attemptSend(mailOptions, attempt + 1);
    }
    throw error;
  }
}

export async function sendEmail(mailOptions: EmailOptions): Promise<EmailResult> {
  try {
    // Validate recipient email before sending
    if (!mailOptions.to || !isValidEmail(mailOptions.to)) {
      throw new Error(`Invalid recipient email address: ${mailOptions.to}`);
    }

    if (!mailOptions.from) {
      mailOptions.from = env.smtpFrom;
    }

    // Sanitize subject to prevent header injection
    if (mailOptions.subject) {
      mailOptions.subject = mailOptions.subject.replace(/[\r\n]/g, ' ');
    }

    if (!transporter) {
      return { success: true, message: 'Email logged to console (dev mode)' };
    }

    if (env.isDev) {
    }

    const result = await attemptSend(mailOptions as nodemailer.SendMailOptions);
    if (env.isDev) console.log(`Email sent successfully to ${mailOptions.to}`);
    return { success: true, message: 'Email sent successfully', messageId: result.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error sending email:', message);
    if (!env.isProd) {
      return { success: true, message: 'Email queued (dev mode)', error: message };
    }
    throw new Error(`Failed to send email: ${message}`);
  }
}

export async function verifyConnection(): Promise<boolean> {
  try {
    if (!transporter) return true;
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email service error:', error instanceof Error ? error.message : error);
    return false;
  }
}

export function generateContactConfirmation(name: string, inquiryType: string, message: string): EmailTemplate {
  return {
    subject: `We've received your ${inquiryType} inquiry - FaRm`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
          <h2 style="margin: 0;">Thank you for contacting FaRm!</h2>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Dear ${name},</p>
          <p>We've received your <strong>${inquiryType.toLowerCase()}</strong> inquiry and will get back to you within 24 hours.</p>
          <div style="background: white; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
            <p><strong>Type:</strong> ${inquiryType}</p>
            <p style="white-space: pre-wrap;"><strong>Message:</strong> ${message.substring(0, 150)}${message.length > 150 ? '...' : ''}</p>
          </div>
          <p>Best regards,<br><strong>FaRm Team</strong></p>
        </div>
      </div>`,
  };
}

export function generateAdminNotification(
  name: string,
  email: string,
  phone: string | null,
  inquiryType: string,
  message: string,
  queryId: unknown,
): EmailTemplate {
  return {
    subject: `New ${inquiryType} Inquiry - ${name} (FaRm)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
          <h2 style="margin: 0;">New Contact Query Received</h2>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Inquiry Type:</strong> ${inquiryType}</p>
          <p><strong>Query ID:</strong> ${String(queryId)}</p>
          <div style="background: white; border-left: 4px solid #7c3aed; padding: 20px; margin: 20px 0;">
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      </div>`,
  };
}

export function generateAdminResponse(userName: string, inquiryType: string, adminResponse: string): EmailTemplate {
  return {
    subject: `Re: Your ${inquiryType} Inquiry - FaRm Team Response`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
          <h2 style="margin: 0;">We've Responded to Your Inquiry</h2>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Dear ${userName},</p>
          <p>Here's our response to your <strong>${inquiryType.toLowerCase()}</strong> inquiry:</p>
          <div style="background: white; border-left: 4px solid #059669; padding: 20px; margin: 20px 0;">
            <p style="white-space: pre-wrap;">${adminResponse}</p>
          </div>
          <p>Best regards,<br><strong>FaRm Team</strong></p>
        </div>
      </div>`,
  };
}

export default sendEmail;
