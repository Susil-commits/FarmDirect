# FaRm Application - Quick Reference Guide

## 🚨 Most Critical Issues (Do First!)

### 1. SECURITY BREACH: Hardcoded Admin Login
**File:** `backend/controllers/authController.js:56-63`  
**Status:** ❌ BROKEN  
**Impact:** Anyone can login as admin with `admin@123:password`
```javascript
// DELETE THIS ENTIRE BLOCK
if (email === 'admin@123' && password === 'password') { ... }

// Create proper admin in MongoDB instead
db.users.insertOne({ email: 'admin@company.com', role: 'admin', ... })
```
**Time to Fix:** 15 minutes

---

### 2. API CALLS FAIL: Inconsistent User ID Fields
**Files:** 
- `auth.js` sets `req.user._id` + `req.user.userId`
- `userController.js` reads `req.user.userId`
- `authController.js` reads `req.user._id`

**Status:** ❌ BROKEN  
**Impact:** Some endpoints return 404 "User not found"
```javascript
// FIX: Use consistent field name everywhere
// In auth.js: req.user = { id: user._id, role, email }
// In all controllers: const userId = req.user.id
```
**Time to Fix:** 30 minutes

---

### 3. CROPS NOT SAVING: Field Name Mismatch
**File:** `backend/controllers/cropController.js:5-25`  
**Status:** ❌ BROKEN  
**Impact:** Farmers see validation error when creating crops
```javascript
// WRONG: const { name } = req.body; then cropName: name
// RIGHT: Use cropName field to match schema
// Or accept both: const finalName = req.body.name || req.body.cropName
```
**Time to Fix:** 10 minutes

---

### 4. ORDERS NOT SAVED: No Actual API Call
**File:** `frontend/pages/Checkout.jsx`  
**Status:** ❌ BROKEN  
**Impact:** Checkout shows confirmation but no order created in database
```javascript
// MISSING: const response = await orderService.createOrder(orderData)
// MISSING: No backend sync, just local state updates
```
**Time to Fix:** 45 minutes

---

### 5. WRONG ORDER STRUCTURE: Multiple Items Not Supported
**File:** `backend/controllers/orderController.js:20-38`  
**Status:** ❌ BROKEN  
**Impact:** Cart can have multiple items, but order only saves first item
```javascript
// WRONG: Creates order with single cropId
const order = await Order.create({
  farmerId: crop.farmerId,
  cropId,
  quantity
});

// RIGHT: Accept items array from frontend
const order = await Order.create({
  items: [
    { cropId, farmerId, quantity, unitPrice, totalPrice },
    { cropId, farmerId, quantity, unitPrice, totalPrice }
  ]
});
```
**Time to Fix:** 1.5 hours

---

### 6. ANYONE CAN EDIT CROPS: No Permission Check
**File:** `backend/controllers/cropController.js:40-65`  
**Status:** ❌ BROKEN  
**Impact:** Any farmer can modify other farmer's crops and prices
```javascript
// MISSING: Ownership validation
if (crop.farmerId.toString() !== req.user.id) {
  return res.status(403).json({ message: 'Permission denied' });
}
```
**Time to Fix:** 20 minutes

---

### 7. INCONSISTENT API RESPONSES: Different Formats
**Impact:** Frontend code struggles to parse responses
```javascript
// Example of inconsistency:
// auth returns: { token, refreshToken, user: {...} }
// crops returns: { crops, pagination: {...} }
// notifications returns: { success: true, data: [...] }
// wishlist returns: { wishlist }  <-- No success field!

// FIX: Use standard format everywhere:
{
  success: true/false,
  message: "description",
  data: {...},
  pagination: { page, limit, total, pages }
}
```
**Time to Fix:** 2 hours

---

## 📋 Quick Check List

Use this to determine if your fix is correct:

### ✅ When Fixed:
```
1. Admin login ONLY works with database account
   ✓ Can login with admin@company.com
   ✓ Cannot login with admin@123

2. Farmer can create crop with all fields
   ✓ POST /api/crops returns 201
   ✓ cropName field is populated
   ✓ All validations pass

3. Orders are created in database
   ✓ Checkout creates order in DB
   ✓ Order appears in farmer dashboard
   ✓ Order number is shown to buyer

4. Multi-farmer orders work
   ✓ Cart items from 2+ farmers → single order
   ✓ Order items array contains all crops
   ✓ Each farmer notified of their items

5. Crop operations use ownership check
   ✓ Can update own crop
   ✓ Cannot update others' crops (403)
   ✓ Cannot delete others' crops (403)

6. API responses consistent
   ✓ All endpoints have 'success' field
   ✓ All have 'data' or 'message'
   ✓ Status codes match HTTP standards
```

---

## 🔧 File Reference

### Backend Priority Files
1. ⚠️ `backend/controllers/authController.js` - Remove hardcoded admin
2. ⚠️ `backend/middleware/auth.js` - Fix user ID field
3. ⚠️ `backend/controllers/cropController.js` - Fix field names, add permissions
4. ⚠️ `backend/controllers/orderController.js` - Fix multi-item orders
5. ⚠️ `backend/controllers/userController.js` - Fix user ID field usage
6. ⚠️ `backend/controllers/notificationController.js` - Fix user ID field usage
7. ℹ️ `backend/controllers/reviewController.js` - Fix user ID field usage

### Frontend Priority Files
1. ⚠️ `F_1/src/pages/Checkout.jsx` - Implement order creation API call
2. ⚠️ `F_1/src/services/appService.js` - Fix endpoint mismatches
3. ℹ️ `F_1/src/context/CartContext.jsx` - Ensure proper data structure

### Configuration Files
1. ⚠️ `backend/.env` - Remove hardcoded admin credentials
2. ℹ️ `F_1/.env` - Update API base URL if needed

---

## 🧪 Testing Checklist

After each fix, run these curl commands:

### Test Admin Account Removed
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@123","password":"password"}'
# EXPECT: 401 "Invalid email or password"

curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"SecurePass@123"}'
# EXPECT: 200 with token (if admin exists in DB)
```

### Test User IP Field Fix
```bash
# Get your token first
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
# EXPECT: 200 with user profile

curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer $TOKEN"
# EXPECT: 200 with notification list
```

### Test Crop Creation
```bash
curl -X POST http://localhost:5000/api/crops \
  -H "Authorization: Bearer $FARMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cropName": "Tomatoes",
    "category": "Vegetables",
    "price": 50,
    "quantity": 100,
    "description": "Fresh organic tomatoes from our farm",
    "certifications": ["Organic", "Pesticide-Free"]
  }'
# EXPECT: 201 with crop ID
```

### Test Crop Permissions
```bash
# Try updating with different farmer
curl -X PUT http://localhost:5000/api/crops/CROP_ID \
  -H "Authorization: Bearer $DIFFERENT_FARMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price": 200}'
# EXPECT: 403 Forbidden

# Try updating with owner
curl -X PUT http://localhost:5000/api/crops/CROP_ID \
  -H "Authorization: Bearer $OWNER_FARMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price": 200}'
# EXPECT: 200 OK
```

### Test Multi-Item Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"cropId": "id1", "quantity": 2},
      {"cropId": "id2", "quantity": 1}
    ],
    "deliveryAddress": {
      "streetAddress": "123 Main St",
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110001"
    },
    "paymentMethod": "cod"
  }'
# EXPECT: 201 with order number
```

---

## 📊 Dependency Tree

```
Frontend Bug → Backend Bug
━━━━━━━━━━━━━━━━━━━━━━━━━━

Orders not saving
  └─ Checkout doesn't call API
     └─ orderService not implemented
     └─ Order controller accepts wrong format
        └─ Schema expects items[], controller sends single items

Crops not appearing
  └─ cropService gets crops ok
  └─ But farmer can't CREATE crops
     └─ Field name mismatch (name vs cropName)
     └─ Then no ownership validation

User profile errors
  └─ Controller uses wrong field (userId vs _id)
  └─ Auth middleware sets both fields
  └─ But randomness causes failures

Admin access
  └─ Hardcoded bypass in code
  └─ No permission validation elsewhere
  └─ Any user can delete other users
```

---

## ⏱️ Time Estimates

| Issue | Complexity | Time | Files |
|-------|-----------|------|-------|
| Admin account | Easy | 15 min | 1 |
| User ID fields | Medium | 30 min | 5 |
| Field name mismatch | Easy | 10 min | 1 |
| Ownership validation | Medium | 20 min | 2 |
| Multi-item orders | Hard | 1.5 hrs | 3 |
| Frontend order creation | Medium | 45 min | 2 |
| API response standardization | Hard | 2 hrs | 9 |
| **TOTAL PHASE 1** | **Medium** | **6-7 hrs** | **23** |

---

## 🎯 Goals for Each Phase

### Phase 1 (THIS WEEK)
- [ ] Remove hardcoded admin
- [ ] Fix user ID inconsistencies
- [ ] Fix crop field names
- [ ] Add ownership validation
- [ ] Implement multi-item orders
- [ ] Implement frontend checkout
- [ ] Standardize API responses

### Phase 2 (NEXT WEEK)
- [ ] Token refresh implementation
- [ ] Error boundaries
- [ ] Form validation
- [ ] Missing endpoints
- [ ] Database indexes

### Phase 3 (FOLLOWING WEEK)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Monitoring/logging
- [ ] Documentation

---

## 🐛 Debug Tips

### "User not found" errors?
→ Check which controller is being called  
→ It might be using `req.user.userId` instead of `req.user.id`

### Crop creation fails with no error?
→ Check browser console for validation error  
→ Likely missing `cropName` field (it uses `name`)  
→ Try with field name from schema

### Orders not appearing?
→ Check if frontend makes API call at all  
→ Search for `orderService.createOrder` in Checkout.jsx  
→ If not there, that's the issue!

### "Cannot read property 'farmerId' undefined"?
→ Crop fetch returned empty/null  
→ Check if crop exists in database  
→ Check if cropId parameter is correct

---

## 📚 Documentation to Update Later

- [ ] API documentation (add request/response examples)
- [ ] Database schema documentation  
- [ ] Setup guide for developers
- [ ] Deployment checklist
- [ ] Environment variables guide
- [ ] Error codes reference

---

## 🚀 Deployment Checklist

Before going live:

- [ ] Remove all console.logs() 
- [ ] Verify hardcoded values removed
- [ ] Update .env with production values
- [ ] Enable HTTPS/TLS
- [ ] Configure proper CORS origins
- [ ] Set environment to 'production'
- [ ] Enable rate limiting
- [ ] Setup database backups
- [ ] Configure error tracking (Sentry)
- [ ] Setup monitoring/alerts
- [ ] Test payment gateway integration
- [ ] Verify email notifications work
- [ ] Load test database queries
- [ ] Security audit (OWASP)

---

**Last Updated:** April 7, 2026  
**Maintainer:** Engineering Team  
**Status:** ACTIVE ISSUES - PHASE 1 IN PROGRESS
