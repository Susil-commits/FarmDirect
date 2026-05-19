const nodemailer = require('nodemailer');
const path = require('path');

/**
 * Email Service - Handles all email notifications
 * Supports order status updates, KYC approval/rejection, contact form responses
 */

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Email templates
const emailTemplates = {
  orderPlaced: (order, buyer) => ({
    subject: `Order Confirmation #${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .order-details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #16a34a; }
            .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .item:last-child { border-bottom: none; }
            .total { font-size: 1.25rem; font-weight: bold; color: #16a34a; margin-top: 15px; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin-top: 15px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Order Placed Successfully</h1>
            </div>
            <div class="content">
              <p>Hi ${buyer.firstName},</p>
              <p>Your order has been successfully placed! Here are the details:</p>
              
              <div class="order-details">
                <strong>Order #${order.orderNumber}</strong>
                <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
                
                <div style="margin-top: 15px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                  ${order.items.map(item => `
                    <div class="item">
                      <span>${item.cropName} × ${item.quantity} kg</span>
                      <span>₹${(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  `).join('')}
                  
                  <div style="margin-top: 15px; font-size: 0.9rem; color: #6b7280;">
                    <div class="item">
                      <span>Subtotal:</span>
                      <span>₹${order.subtotal?.toLocaleString() || 0}</span>
                    </div>
                    <div class="item">
                      <span>Delivery Fee:</span>
                      <span>₹${order.deliveryFee || 0}</span>
                    </div>
                    <div class="item">
                      <span>Tax (5%):</span>
                      <span>₹${order.tax?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                  
                  <div class="total">
                    Total: ₹${order.totalAmount?.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #16a34a;">
                <strong>Payment Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 0.9rem;">
                  ${order.paymentMethod === 'cod' 
                    ? 'You can pay when you receive your order.' 
                    : 'Payment link has been sent separately.'}
                </p>
              </div>
              
              <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <strong>Delivery Address:</strong>
                <p style="margin: 10px 0; font-size: 0.9rem;">
                  ${order.deliveryAddress.fullName}<br/>
                  ${order.deliveryAddress.addressLine1}<br/>
                  ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zipCode}<br/>
                  📱 ${order.deliveryAddress.phone}
                </p>
              </div>
              
              <a href="${process.env.FRONTEND_URL}/order/${order._id}" class="button">Track Your Order</a>
              
              <div class="footer">
                <p>Order will be verified by our team. You'll receive an update within 24 hours.</p>
                <p>Thank you for shopping with FaRm!</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  orderVerified: (order, buyer) => ({
    subject: `Order Verified #${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .content { background: #f0f9ff; padding: 20px; border-radius: 6px; margin-top: 20px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Order Verified</h1>
            </div>
            <div class="content">
              <p>Hi ${buyer.firstName},</p>
              <p>Great news! Your order #${order.orderNumber} has been verified and approved.</p>
              <p>The farmer will prepare your items and pack them soon.</p>
              <a href="${process.env.FRONTEND_URL}/order/${order._id}" class="button">View Order Details</a>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  orderShipped: (order, buyer) => ({
    subject: `Your Order is Out for Delivery #${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f97316; color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .content { background: #fff7ed; padding: 20px; border-radius: 6px; margin-top: 20px; }
            .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚚 Order Out for Delivery</h1>
            </div>
            <div class="content">
              <p>Hi ${buyer.firstName},</p>
              <p>Your order #${order.orderNumber} is on its way!</p>
              <p>Expected delivery: ${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
              <a href="${process.env.FRONTEND_URL}/order/${order._id}" class="button">Track Live</a>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  orderDelivered: (order, buyer) => ({
    subject: `Order Delivered #${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #16a34a; color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .content { background: #f0fdf4; padding: 20px; border-radius: 6px; margin-top: 20px; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 10px 5px 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Order Delivered</h1>
            </div>
            <div class="content">
              <p>Hi ${buyer.firstName},</p>
              <p>Your order #${order.orderNumber} has been delivered!</p>
              <p>We hope you're happy with your fresh produce from FaRm.</p>
              <a href="${process.env.FRONTEND_URL}/order/${order._id}" class="button">Write a Review</a>
              <a href="${process.env.FRONTEND_URL}/marketplace" class="button">Shop Again</a>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  kycApproved: (user) => ({
    subject: 'KYC Verification Approved',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #16a34a; color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .content { background: #f0fdf4; padding: 20px; border-radius: 6px; margin-top: 20px; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ KYC Verified</h1>
            </div>
            <div class="content">
              <p>Congratulations ${user.firstName}!</p>
              <p>Your KYC verification has been approved. You can now:</p>
              <ul>
                <li>${user.role === 'farmer' ? '📦 List crops on the platform' : '🛍️ Start shopping from our marketplace'}</li>
                <li>💳 Make purchases/sales</li>
                <li>💬 Contact farmers/buyers</li>
              </ul>
              <a href="${process.env.FRONTEND_URL}/${user.role === 'farmer' ? 'create-crop' : 'marketplace'}" class="button">
                Get Started
              </a>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  contactFormResponse: (contact, adminEmail) => ({
    subject: `Thank you for contacting FaRm - We received your message`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .content { background: #eff6ff; padding: 20px; border-radius: 6px; margin-top: 20px; }
            .message-box { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📨 Message Received</h1>
            </div>
            <div class="content">
              <p>Hi ${contact.name},</p>
              <p>Thank you for reaching out to FaRm! We've received your message and will get back to you within 24 hours.</p>
              
              <div class="message-box">
                <strong>Your Message:</strong>
                <p style="margin-top: 10px; color: #6b7280;">${contact.message}</p>
              </div>
              
              <p style="color: #6b7280; font-size: 0.9rem;">
                Reference ID: ${contact._id}
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  })
};

/**
 * Send email notification
 */
async function sendEmail(to, type, data) {
  try {
    // Get template
    let template;
    
    switch(type) {
      case 'ORDER_PLACED':
        template = emailTemplates.orderPlaced(data.order, data.buyer);
        break;
      case 'ORDER_VERIFIED':
        template = emailTemplates.orderVerified(data.order, data.buyer);
        break;
      case 'ORDER_SHIPPED':
        template = emailTemplates.orderShipped(data.order, data.buyer);
        break;
      case 'ORDER_DELIVERED':
        template = emailTemplates.orderDelivered(data.order, data.buyer);
        break;
      case 'KYC_APPROVED':
        template = emailTemplates.kycApproved(data.user);
        break;
      case 'CONTACT_RESPONSE':
        template = emailTemplates.contactFormResponse(data.contact, data.adminEmail);
        break;
      default:
        throw new Error('Unknown email type');
    }

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to,
      subject: template.subject,
      html: template.html
    });

    console.log(`✉️  Email sent (${type}):`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending email (${type}):`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send multiple emails (batch)
 */
async function sendBatchEmails(recipients, type, data) {
  try {
    const results = await Promise.all(
      recipients.map(email => sendEmail(email, type, data))
    );
    return results;
  } catch (error) {
    console.error('Error sending batch emails:', error);
    return [];
  }
}

/**
 * Verify email transporter connection
 */
async function verifyConnection() {
  try {
    await transporter.verify();
    console.log('✅ Email service ready');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error.message);
    return false;
  }
}

module.exports = {
  sendEmail,
  sendBatchEmails,
  verifyConnection
};
