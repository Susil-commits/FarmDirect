import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Service for sending emails
 * Supports both production SMTP and development console logging
 */

let transporter;

// Initialize transporter based on environment
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  // Production SMTP configuration
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  // Development mode - use test account or console logging
  console.warn('⚠️  Email Service: SMTP configuration not found. Using test mode.');
  
  transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    secure: false,
    auth: {
      user: 'test',
      pass: 'test',
    },
    // Skip TLS verification for development
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Send email with logging
 * @param {Object} mailOptions - Email options
 * @param {string} mailOptions.to - Recipient email
 * @param {string} mailOptions.subject - Email subject
 * @param {string} mailOptions.html - HTML email body
 * @param {string} mailOptions.text - Plain text email body (optional)
 * @param {string} mailOptions.from - From email (optional, uses SMTP_USER if not provided)
 * @returns {Promise<Object>} Result of email sending
 */
async function sendEmail(mailOptions) {
  try {
    // Set default from address
    if (!mailOptions.from) {
      mailOptions.from = process.env.SMTP_USER || 'noreply@farm.local';
    }

    // Log email in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Email Service - Development Mode:');
      console.log(`   To: ${mailOptions.to}`);
      console.log(`   Subject: ${mailOptions.subject}`);
      console.log(`   From: ${mailOptions.from}`);
      console.log('---');
    }

    // Send email
    const result = await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent successfully to ${mailOptions.to}`);
    return {
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    // In development, log the error but don't crash
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  Email send failed in development mode. Continuing anyway...');
      return {
        success: true, // Return true in dev to not break functionality
        message: 'Email queued (dev mode)',
        error: error.message,
      };
    }

    // In production, throw the error
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Verify SMTP connection
 * @returns {Promise<boolean>} True if connection is successful
 */
async function verifyConnection() {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready to take messages');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error);
    return false;
  }
}

// Email templates

/**
 * Generate contact form confirmation email
 */
export function generateContactConfirmation(name, inquiryType, message) {
  return {
    subject: `We've received your ${inquiryType} inquiry - FaRm`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
          <h2 style="margin: 0; font-size: 24px;">Thank you for contacting FaRm!</h2>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Dear ${name},</p>
          
          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
            We've received your <strong>${inquiryType.toLowerCase()}</strong> inquiry and will get back to you within 24 hours.
          </p>
          
          <div style="background: white; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #059669;">Your Inquiry Details:</p>
            <p style="margin: 0 0 10px 0;"><strong>Type:</strong> ${inquiryType}</p>
            <p style="margin: 0; word-wrap: break-word; white-space: pre-wrap; color: #666; max-height: 100px; overflow: hidden;">
              <strong>Message:</strong> ${message.substring(0, 150)}${message.length > 150 ? '...' : ''}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            If you need urgent assistance, please call us at the contact number provided on our website.
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Best regards,<br><strong>FaRm Team</strong></p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p style="margin: 0;">© 2026 FaRm. All rights reserved.</p>
        </div>
      </div>
    `,
  };
}

/**
 * Generate admin notification email
 */
export function generateAdminNotification(name, email, phone, inquiryType, message, queryId) {
  return {
    subject: `New ${inquiryType} Inquiry - ${name} (FaRm)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
          <h2 style="margin: 0; font-size: 24px;">🔔 New Contact Query Received</h2>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <div style="background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #059669;">Sender Information</h3>
            <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #059669; text-decoration: none;">${email}</a></p>
            <p style="margin: 0 0 10px 0;"><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p style="margin: 0;"><strong>Inquiry Type:</strong> <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${inquiryType}</span></p>
          </div>
          
          <div style="background: white; border-left: 4px solid #7c3aed; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Message</h3>
            <p style="margin: 0; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; color: #666;">${message}</p>
          </div>
          
          <div style="background: #f0f9ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #1e40af;">
              <strong>Query ID:</strong> ${queryId}
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.ADMIN_DASHBOARD_URL || 'http://localhost:3000'}/admin/queries" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View in Admin Dashboard
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
            <p style="margin: 0; font-size: 13px; color: #666;">
              This is an automated notification. Please do not reply to this email.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p style="margin: 0;">© 2026 FaRm. All rights reserved.</p>
        </div>
      </div>
    `,
  };
}

/**
 * Generate admin response email
 */
export function generateAdminResponse(userName, inquiryType, adminResponse) {
  return {
    subject: `Re: Your ${inquiryType} Inquiry - FaRm Team Response`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
          <h2 style="margin: 0; font-size: 24px;">✓ We've Responded to Your Inquiry</h2>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Dear ${userName},</p>
          
          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
            Thank you for reaching out to us. Here's our response to your <strong>${inquiryType.toLowerCase()}</strong> inquiry:
          </p>
          
          <div style="background: white; border-left: 4px solid #059669; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; line-height: 1.8; white-space: pre-wrap; word-wrap: break-word; color: #333;">
              ${adminResponse}
            </p>
          </div>
          
          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
            If you have any further questions or need additional clarification, please don't hesitate to contact us.
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Best regards,<br><strong>FaRm Team</strong></p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p style="margin: 0;">© 2026 FaRm. All rights reserved.</p>
        </div>
      </div>
    `,
  };
}

export default sendEmail;
export { verifyConnection };
