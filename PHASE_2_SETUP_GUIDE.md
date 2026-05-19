# Phase 2 Setup & Activation Guide

## 📋 WHAT'S BEEN COMPLETED

Phase 2 frontend and backend components are 100% built. You now have:

✅ **Frontend** (Ready to use):
- SearchResults.jsx with filters & sorting
- All Phase 1 components wired in App.jsx
- CSS with animations & responsive design

✅ **Backend** (Created but not activated):
- emailService.js with 6 email templates
- Contact model and routes
- All controllers ready

---

## 🚀 ACTIVATION STEPS (Do These Next)

### **STEP 1: Install Nodemailer** (2 minutes)

```bash
cd backend
npm install nodemailer
```

---

### **STEP 2: Update .env File** (5 minutes)

Add these variables to `backend/.env`:

```env
# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
ADMIN_EMAIL=admin@farm.com
FRONTEND_URL=http://localhost:5173
```

**How to get Gmail App Password:**
1. Go to myaccount.google.com
2. Click "Security" in the left menu
3. Enable "2-Step Verification" (if not already enabled)
4. Click "App passwords" (appears after 2FA is on)
5. Select "Mail" and "Windows Computer"
6. Copy the 16-character password
7. Paste in EMAIL_PASSWORD above

---

### **STEP 3: Add Contact Routes to Server** (2 minutes)

In `backend/server.js`, add these lines after other route imports:

```javascript
// Add with other route imports at the top
const contactRoutes = require('./routes/contactRoutes');

// Add with other app.use() statements (around line 50-60)
app.use('/api/contact', contactRoutes);
```

---

### **STEP 4: Test Email Service** (2 minutes)

Add this to the end of `backend/server.js` (before or after PORT listener):

```javascript
// Test email service on startup
const { verifyConnection } = require('./services/emailService');

verifyConnection().then(success => {
  if (success) {
    console.log('✅ Email service is ready!');
  } else {
    console.log('⚠️  Email service failed - check .env configuration');
  }
});
```

Restart your backend server. You should see: `✅ Email service is ready!`

---

### **STEP 5: Wire Email Notifications to Orders** (20 minutes)

**File**: `backend/controllers/orderController.js`

Find the function where order status is updated. Add these email triggers:

```javascript
// Add at top of file
const { sendEmail } = require('../services/emailService');

// In your order status update handler, add this logic:

// When order is created (ORDER_PLACED email)
const newOrder = new Order({
  // ... order data
});
await newOrder.save();

// Send order confirmation email
await sendEmail(buyer.email, 'ORDER_PLACED', {
  order: newOrder,
  buyer: buyer
});


// When order is verified by admin (ORDER_VERIFIED email)
if (newStatus === 'verified') {
  await sendEmail(order.buyerId.email, 'ORDER_VERIFIED', {
    order: updatedOrder,
    buyer: order.buyerId
  });
}

// When order ships (ORDER_SHIPPED email)
if (newStatus === 'out_for_delivery') {
  await sendEmail(order.buyerId.email, 'ORDER_SHIPPED', {
    order: updatedOrder,
    buyer: order.buyerId
  });
}

// When order delivered (ORDER_DELIVERED email)
if (newStatus === 'delivered') {
  await sendEmail(order.buyerId.email, 'ORDER_DELIVERED', {
    order: updatedOrder,
    buyer: order.buyerId
  });
}
```

---

### **STEP 6: Wire Email to KYC Approval** (5 minutes)

**File**: `backend/controllers/userController.js` (KYC approval endpoint)

Find where KYC status is updated to 'verified'. Add:

```javascript
// Add at top
const { sendEmail } = require('../services/emailService');

// In KYC approval handler
if (newKycStatus === 'verified') {
  await sendEmail(user.email, 'KYC_APPROVED', {
    user: user
  });
}
```

---

### **STEP 7: Update Contact Form Frontend** (10 minutes)

**File**: `F_1/src/pages/Contact.jsx`

Find the form submission handler and update it:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    setLoading(true);
    
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message
      })
    });

    const data = await response.json();

    if (response.ok) {
      addToast('✅ Message sent successfully! We'll reply within 24 hours.', 'success');
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } else {
      addToast('❌ ' + (data.message || 'Failed to send message'), 'error');
    }
  } catch (error) {
    addToast('❌ Error sending message', 'error');
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

---

## ✅ TESTING CHECKLIST

After completing all steps above, test the following:

### **Email Testing**
- [ ] Admin receives test email (check spam folder)
- [ ] Email subject lines are correct
- [ ] HTML formatting renders properly
- [ ] Action buttons (Track Order, etc.) work

### **Contact Form Testing**
- [ ] Submit contact form from frontend
- [ ] Confirmation email received at your email
- [ ] Admin receives notification at ADMIN_EMAIL
- [ ] Contact appears in admin dashboard

### **Order Workflow Testing**
1. [ ] Create order as buyer → Check email for ORDER_PLACED
2. [ ] Verify order as farmer → Check email for ORDER_VERIFIED
3. [ ] Mark as shipped → Check email for ORDER_SHIPPED
4. [ ] Mark as delivered → Check email for ORDER_DELIVERED

### **Search Testing**
- [ ] Search works on marketplace
- [ ] Filters work (category, price, rating)
- [ ] Sort options work
- [ ] Grid/List toggle works
- [ ] Add to cart from search results works

---

## 📊 Current Implementation Status

| Feature | Frontend | Backend | Email | Status |
|---------|----------|---------|-------|--------|
| Search Results | ✅ | ✅ | N/A | ✅ Ready |
| Order Tracking | ✅ | ✅ | ⏳ Wiring | 90% |
| Dashboards | ✅ | ✅ | N/A | ✅ Ready |
| Checkout | ✅ | ✅ | ⏳ Wiring | 90% |
| Email Notifications | N/A | ✅ | ⏳ Wiring | 80% |
| Contact Form | ✅ | ✅ | ✅ | 90% |

---

## 🎯 Time Estimates

- Email configuration: **5 mins**
- Server integration: **5 mins**
- Order workflow wiring: **15 mins**
- Contact form wiring: **10 mins**
- Testing all features: **30 mins**
- **Total: ~1 hour**

---

## ⚠️ COMMON ISSUES & FIXES

### **Email not sending?**
1. Check .env variables are correct
2. Verify Gmail App Password (not regular password)
3. Check ADMIN_EMAIL format
4. Look for error logs in terminal

### **Contact form not submitting?**
1. Check that contactRoutes are imported in server.js
2. Verify Contact model is imported in contactRoutes.js
3. Check network tab in DevTools for API errors

### **Emails going to spam?**
- Gmail filters might flag first-time emails
- Add email to contacts to improve deliverability
- Check email templates for spam keywords

---

## 🚀 PHASE 3 PREVIEW

Next phase (WebSocket & Real-time):
- Real-time order updates without polling
- Live notifications
- Chat functionality
- Admin alert dashboard

**Estimated time: 4-5 hours**

---

## 📞 API ENDPOINTS SUMMARY

### **Public Endpoints**
- `POST /api/contact` - Submit contact form
- `GET /api/crops/search?q=...` - Search products

### **Admin Endpoints** (Protected)
- `GET /api/contact` - View all contact submissions
- `GET /api/contact/:id` - View single submission
- `PUT /api/contact/:id` - Update status and reply
- `DELETE /api/contact/:id` - Delete submission
- `GET /api/contact/stats` - Contact statistics

---

## 🎉 NEXT STEPS

1. **First**: Complete Steps 1-7 above (~1 hour)
2. **Then**: Run through testing checklist
3. **Finally**: Move to Phase 3 (WebSocket) or polish features

**Questions?** Check the `.env` setup first - 90% of issues are configuration related!
