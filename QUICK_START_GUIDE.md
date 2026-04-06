# 🚀 FaRm Development - Getting Started Guide

## Quick Start (5 minutes)

### Step 1: Start Backend Server
```bash
cd backend
npm install      # Only needed first time
npm run dev
```
✅ Backend will be running on http://localhost:5000

### Step 2: Start Frontend Server  
```bash
cd F_1
npm install      # Only needed first time
npm run dev
```
✅ Frontend will be running on http://localhost:5173

### Step 3: Test Login
Open http://localhost:5173 and test with demo credentials:
- **Email:** buyer@example.com
- **Password:** password123

---

## ✅ What's Already Done

### Backend (95% Complete)
- ✅ All 8 route modules with 50+ API endpoints
- ✅ 6 database models (User, Crop, Order, Review, Wishlist, Notification)
- ✅ 9 complete controllers with full business logic
- ✅ JWT authentication with role-based access control
- ✅ Error handling, validation, middleware
- ✅ .env configuration ready
- ✅ All npm packages installed

### Frontend (50% Complete)
- ✅ React + Vite + Tailwind CSS setup
- ✅ Complete service layer for API calls
- ✅ Auth context and other providers
- ✅ Custom hooks (useFetch, useForm, useAuth, etc.)
- ✅ Validation utilities and formatters
- ✅ Constants and configurations
- ✅ Common UI components (Button, Input, Card, Modal)
- ✅ Home page with featured products
- ✅ Marketplace page with filters and search

### Status by Page:
- ✅ Home - Ready
- ✅ Marketplace - Ready  
- ⚠️ Login - Basic structure (needs API integration)
- ⚠️ Register - Needs implementation
- ⚠️ Product Details - Needs implementation
- ⚠️ Shopping Cart - Needs implementation
- ❌ Dashboards (Buyer, Farmer, Admin) - Not started
- ❌ User Profile - Needs implementation
- ❌ Order Tracking - Needs implementation

---

## 📝 What's Next to Build

### Priority 1: Authentication Pages (2-3 hours)
**Files to complete:**
- `src/pages/auth/Register.jsx` - Mirror Login with registration form
- Integrate auth service from `src/services/appService.js`

**Example Register.jsx structure:**
```jsx
import { authService } from '../../services/appService.js';
import { useAuth } from '../../hooks/useAuth.js';

const Register = () => {
  const { register } = useAuth();
  const { showSuccess, showError } = useToast();
  
  // Implement registration form similar to Login.jsx
};
```

### Priority 2: Product Detail Page (2 hours)
**File:** `src/pages/CropDetail.jsx`
```jsx
- Display full crop details with images
- Show farmer profile
- Display reviews and ratings
- Add to cart functionality
- Wishlist toggle
- Similar products suggestion
```

### Priority 3: Shopping Cart Page (3 hours)
**File:** `src/pages/ShoppingCart.jsx`
```jsx
- Display cart items from CartContext
- Allow quantity update
- Remove items
- Apply coupon code
- Checkout button
- Price calculation with tax
```

### Priority 4: Checkout & Payment (4 hours)
**Files needed:**
- `src/pages/Checkout.jsx` - Payment page
- `src/services/paymentService.js` - Razorpay integration
- Order creation via API

### Priority 5: User Dashboard Pages (6 hours)
**Files to create:**
- `src/pages/dashboards/BuyerDashboard.jsx`
  - My Orders
  - My Addresses
  - Wishlist
  - Profile Settings
  
- `src/pages/dashboards/FarmerDashboard.jsx`
  - My Crops
  - My Orders
  - Add New Crop
  - Sales Analytics
  - KYC Status
  
- `src/pages/dashboards/AdminDashboard.jsx`
  - Dashboard Stats
  - User Management
  - Crop Approvals
  - KYC Approvals
  - Order Management

---

## 🔧 Development Checklist

### Stage 1: Complete Pages (Priority)
- [ ] Complete Register page
- [ ] Complete Product Detail page
- [ ] Complete Shopping Cart page
- [ ] Create Checkout page
- [ ] Complete User Profile page

### Stage 2: Dashboards
- [ ] Build Buyer Dashboard
- [ ] Build Farmer Dashboard  
- [ ] Build Admin Dashboard

### Stage 3: Features
- [ ] Image upload with Cloudinary
- [ ] Payment integration with Razorpay
- [ ] Real-time notifications with Socket.io
- [ ] Email notifications
- [ ] Advanced search filters
- [ ] Product recommendations

### Stage 4: Testing & Optimization
- [ ] Unit tests for utilities
- [ ] Component tests
- [ ] API integration tests
- [ ] Performance optimization
- [ ] Accessibility audit

### Stage 5: Deployment
- [ ] Server deployment
- [ ] Database setup
- [ ] Environment configuration
- [ ] CI/CD pipeline
- [ ] Monitoring setup

---

## 💡 Code Examples

### Creating a New Page

```jsx
// src/pages/NewPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetch, useForm } from '../hooks/index.js';
import { someService } from '../services/appService.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../context/NotificationContext.jsx';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button.jsx';

const NewPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { data, loading, refetch } = useFetch(() => someService.getData());

  if (!user) {
    return <div>Please login first</div>;
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Your page content */}
      </div>
    </PageTransition>
  );
};

export default NewPage;
```

### Writing API Calls

```jsx
// Use the existing service pattern
import { cropService, orderService } from '../services/appService.js';

// In component
const { data: crops } = useFetch(
  () => cropService.getAllCrops({ category: 'Vegetables' }),
  []
);

// Create order
const handleCheckout = async (orderData) => {
  try {
    const result = await orderService.createOrder(orderData);
    showSuccess('Order created successfully');
  } catch (error) {
    showError(error.message);
  }
};
```

### Form Handling

```jsx
import { useForm } from '../hooks/index.js';
import { validateForm } from '../utils/validation.js';

const MyForm = () => {
  const { values, errors, touched, handleChange, handleBlur, handleSubmit } = useForm(
    { name: '', email: '' },
    async (values) => {
      // Submit logic
      await apiService.submit(values);
    }
  );

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={values.name}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {touched.name && errors.name && <p>{errors.name}</p>}
    </form>
  );
};
```

---

## 🧪 Testing APIs with Postman

### 1. Register User
```
POST http://localhost:5000/api/auth/register
Headers: Content-Type: application/json

Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "buyer"
}
```

### 2. Login
```
POST http://localhost:5000/api/auth/login
Body:
{
  "email": "john@example.com",
  "password": "password123"
}
Response includes: token, user object
```

### 3. Get Crops (with auth header)
```
GET http://localhost:5000/api/crops
Headers:
Authorization: Bearer <your_token_from_login>
```

### 4. Create Order
```
POST http://localhost:5000/api/orders
Headers:
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "items": [
    {
      "cropId": "crop_id_here",
      "quantity": 2
    }
  ],
  "deliveryAddress": {
    "streetAddress": "123 Main St",
    "city": "New York",
    "state": "NY",
    "pincode": "10001"
  },
  "paymentMethod": "cod",
  "totalAmount": 500
}
```

---

## 📚 File Organization

```
FaRm/
├── backend/
│   ├── config/          ✅ Database config
│   ├── controllers/      ✅ Business logic
│   ├── middleware/       ✅ Auth, validation, errors
│   ├── models/           ✅ Database schemas
│   ├── routes/           ✅ API endpoints
│   ├── utils/            ✅ Helpers
│   ├── server.js         ✅ Express app
│   ├── .env              ✅ Configuration
│   └── package.json      ✅ Dependencies
│
├── F_1/ (Frontend)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/   ✅ UI components
│   │   │   └── shared/   ⚠️ Layout components
│   │   ├── context/      ✅ State management
│   │   ├── hooks/        ✅ Custom hooks
│   │   ├── pages/        ⚠️ Route pages
│   │   ├── services/     ✅ API layer
│   │   ├── utils/        ✅ Helpers
│   │   ├── styles/       ✅ CSS files
│   │   ├── App.jsx       ✅ App component
│   │   └── main.jsx      ✅ Entry point
│   └── package.json      ✅ Dependencies
│
└── Documentation/
    ├── README_IMPLEMENTATION.md     ✅ Setup guide
    ├── IMPLEMENTATION_STATUS.md     ✅ Progress report
    └── Architecture files (11 docs) ✅ Design docs
```

---

## 🔗 Navigation & Routing

The application should have these main routes:
```
/                      - Home page
/marketplace          - All products
/crops/:id            - Product details
/cart                 - Shopping cart
/checkout             - Payment page
/login                - Login page
/register             - Registration page
/profile              - User profile
/orders               - My orders
/wishlist             - Saved products
/dashboards/buyer     - Buyer dashboard
/dashboards/farmer    - Farmer dashboard
/dashboards/admin     - Admin dashboard
```

---

## 📞 Common Commands

```bash
# Start development
cd backend && npm run dev
cd F_1 && npm run dev

# Install new package
npm install package-name

# View logs
npm run dev # Shows console output

# Stop server
Ctrl + C

# Check if port is used
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -i :5000
```

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot GET /api/crops"
**Solution:** Ensure backend is running on port 5000

### Issue: "CORS error"
**Solution:** Check CORS_ORIGIN in backend .env matches frontend URL

### Issue: "Token undefined"
**Solution:** Login first and token will be stored in localStorage automatically

### Issue: "Module not found"
**Solution:** Run `npm install` in that directory

### Issue: Port already in use
```bash
# Kill process on port Windows
taskkill /PID <PID> /F

# Kill process on port Mac/Linux
kill -9 <PID>
```

---

## 📊 Development Time Estimate

| Feature | Time | Priority |
|---------|------|----------|
| Register Page | 1 hour | HIGH |
| Product Detail | 2 hours | HIGH |
| Shopping Cart | 2 hours | HIGH |
| Checkout | 2 hours | HIGH |
| Buyer Dashboard | 3 hours | MEDIUM |
| Farmer Dashboard | 4 hours | MEDIUM |
| Admin Dashboard | 4 hours | MEDIUM |
| Payment Integration | 2 hours | MEDIUM |
| Image Upload | 2 hours | MEDIUM |
| Real-time Notifications | 3 hours | LOW |
| **Total** | **~25 hours** | |

---

## ✨ Pro Tips

1. **Test API first** - Use Postman to ensure backend works before building components
2. **Use the ready service layer** - All API calls are already configured in `src/services/appService.js`
3. **Leverage Context API** - useAuth, useCart, useNotifications already set up
4. **Copy component patterns** - Look at existing components for structure
5. **Use custom hooks** - useFetch, useForm make code cleaner
6. **Handle loading states** - Always show LoadingSpinner while fetching
7. **Show user feedback** - Use useToast for success/error messages
8. **Validate inputs** - Use validation functions before sending to API

---

## 🎯 Next Immediate Action

1. **Complete Register.jsx** (1-2 hours)
   - Copy Login.jsx structure
   - Change to registration form
   - Add role selection (Farmer/Buyer)
   - Test with backend

2. **Test entire auth flow** (1 hour)
   - Register new account
   - Login with account
   - Verify token in localStorage
   - Check user context updates

3. **Build Product Detail page** (2 hours)
   - Fetch crop data from API
   - Display images, price, reviews
   - Add to cart functionality
   - Show farmer profile

---

## 📖 Useful Resources

- API Documentation: See IMPLEMENTATION_STATUS.md
- Architecture: See architecture files in root
- Component Examples: Check existing pages for patterns
- Service Examples: Check src/services/appService.js
- Tailwind CSS: https://tailwindcss.com/docs

---

**Ready to code? Start with the Register page! 🚀**
