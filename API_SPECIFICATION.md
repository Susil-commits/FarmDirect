# RESTful API Specification - Rural Farmer Marketplace

## API Base URL
```
Development: http://localhost:5000/api/v1
Production: https://api.farmersmarketplace.com/api/v1
```

## Response Format

### Success Response
```json
{
  "success": true,
  "status": 200,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "status": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 1. Authentication APIs

### 1.1 User Registration

**Endpoint:** `POST /auth/register`

**Public Access:** Yes

**Request Body:**
```json
{
  "firstName": "Rajesh",
  "lastName": "Kumar",
  "email": "rajesh@example.com",
  "phone": "9876543210",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "role": "farmer",
  "acceptTerms": true
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "userId": "64a1b2c3d4e5f6g7h8i9j0",
    "email": "rajesh@example.com",
    "role": "farmer",
    "verificationRequired": true
  }
}
```

**Status Codes:**
- 201: Created
- 400: Validation error
- 409: Email/Phone already exists

---

### 1.2 Email Verification

**Endpoint:** `POST /auth/verify-email`

**Request Body:**
```json
{
  "email": "rajesh@example.com",
  "otp": "123456"
}
```

**Response:** 200 OK

---

### 1.3 User Login

**Endpoint:** `POST /auth/login`

**Public Access:** Yes

**Request Body:**
```json
{
  "email": "rajesh@example.com",
  "password": "SecurePass123!"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "64a1b2c3d4e5f6g7h8i9j0",
    "email": "rajesh@example.com",
    "firstName": "Rajesh",
    "role": "farmer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

---

### 1.4 Refresh Token

**Endpoint:** `POST /auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** 200 OK

---

### 1.5 Logout

**Endpoint:** `POST /auth/logout`

**Protected:** Yes (JWT required)

**Response:** 200 OK

---

### 1.6 Forgot Password

**Endpoint:** `POST /auth/forgot-password`

**Request Body:**
```json
{
  "email": "rajesh@example.com"
}
```

**Response:** 200 OK

---

### 1.7 Reset Password

**Endpoint:** `POST /auth/reset-password`

**Request Body:**
```json
{
  "email": "rajesh@example.com",
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Response:** 200 OK

---

## 2. User Profile APIs

### 2.1 Get Current User Profile

**Endpoint:** `GET /users/profile`

**Protected:** Yes

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0",
    "firstName": "Rajesh",
    "lastName": "Kumar",
    "email": "rajesh@example.com",
    "phone": "9876543210",
    "role": "farmer",
    "profilePicture": "https://cloudinary.com/...",
    "bio": "Organic vegetable farmer",
    "address": { /* address details */ },
    "farmName": "Kumar's Organic Farm",
    "farmSize": 5,
    "cropsGrown": ["Tomatoes", "Onions", "Peppers"],
    "rating": 4.5,
    "totalReviews": 23,
    "totalOrders": 45
  }
}
```

---

### 2.2 Update User Profile

**Endpoint:** `PUT /users/profile`

**Protected:** Yes

**Request Body:**
```json
{
  "firstName": "Rajesh",
  "lastName": "Kumar",
  "phone": "9876543210",
  "bio": "Certified organic farmer",
  "profilePicture": "image_file" // FormData file upload
}
```

**Response:** 200 OK

---

### 2.3 Add/Update Address

**Endpoint:** `POST /users/addresses`

**Protected:** Yes

**Request Body:**
```json
{
  "streetAddress": "123 Farm Lane",
  "area": "Village XYZ",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "isDefault": true,
  "deliveryInstructions": "Ring bell twice"
}
```

**Response:** 201 Created

---

### 2.4 Get All Addresses

**Endpoint:** `GET /users/addresses`

**Protected:** Yes

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "_id": "address_id",
      "streetAddress": "123 Farm Lane",
      "city": "Bangalore",
      "isDefault": true
    }
  ]
}
```

---

### 2.5 Delete Address

**Endpoint:** `DELETE /users/addresses/:addressId`

**Protected:** Yes

**Response:** 200 OK

---

### 2.6 Farmer KYC Submission

**Endpoint:** `POST /users/kyc-submit`

**Protected:** Yes (Farmer only)

**Request Body:** FormData
```
aadharNumber: "XXXX1234XXXX"
aadharFile: <file>
panNumber: "ABCDE1234F"
panFile: <file>
bankAccountNumber: "XXXXXXX12345"
ifscCode: "SBIN0001234"
bankName: "State Bank of India"
accountHolderName: "Rajesh Kumar"
```

**Response:** 202 Accepted

---

## 3. Crop/Product APIs

### 3.1 Get All Crops (Marketplace)

**Endpoint:** `GET /crops`

**Protected:** No

**Query Parameters:**
```
?page=1
&limit=20
&search=tomatoes
&category=vegetables
&minPrice=100
&maxPrice=500
&city=Bangalore
&distance=50
&tags=organic
&sortBy=createdAt
&sortOrder=desc
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "_id": "crop_id",
      "name": "Fresh Tomatoes",
      "category": "vegetables",
      "pricePerUnit": 40,
      "quantity": 100,
      "quantityUnit": "kg",
      "images": ["url1", "url2"],
      "farmerId": "farmer_id",
      "farmerName": "Rajesh Kumar",
      "farmerRating": 4.5,
      "location": {
        "city": "Bangalore",
        "distance": 5.2
      },
      "tags": ["organic", "fresh"],
      "averageRating": 4.3,
      "totalReviews": 12
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### 3.2 Get Crop Details

**Endpoint:** `GET /crops/:cropId`

**Protected:** No

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "_id": "crop_id",
    "name": "Fresh Tomatoes",
    "category": "vegetables",
    "description": "Organic, pesticide-free tomatoes...",
    "pricePerUnit": 40,
    "finalPrice": 36,
    "discount": { "type": "percentage", "value": 10 },
    "quantity": 100,
    "quantity": "kg",
    "harvestDate": "2024-03-20",
    "expiryDate": "2024-03-25",
    "images": ["url1", "url2", "url3"],
    "tags": ["organic", "pesticide-free"],
    "farmerId": "farmer_id",
    "farmerName": "Rajesh Kumar",
    "farmerRating": 4.5,
    "location": { /* location */ },
    "deliveryModes": [
      { "type": "pickup", "location": "Farm Gate" },
      { "type": "delivery", "additionalCost": 50, "distance": 10 }
    ],
    "reviews": [ /* reviews array */ ]
  }
}
```

---

### 3.3 Create Crop (Farmer)

**Endpoint:** `POST /crops`

**Protected:** Yes (Farmer only)

**Request Body:** FormData
```
name: "Fresh Tomatoes"
category: "vegetables"
description: "Organic, pesticide-free tomatoes from our farm"
pricePerUnit: 40
quantity: 100
quantityUnit: "kg"
tags: ["organic", "fresh"]
harvestDate: "2024-03-20"
expiryDate: "2024-03-25"
isOrganic: true
images: <file1>, <file2>, <file3>
deliveryModes: JSON stringified array
```

**Response:** 201 Created

---

### 3.4 Update Crop (Farmer)

**Endpoint:** `PUT /crops/:cropId`

**Protected:** Yes (Farmer only, must be owner)

**Request Body:** FormData (same as create)

**Response:** 200 OK

---

### 3.5 Delete Crop (Farmer)

**Endpoint:** `DELETE /crops/:cropId`

**Protected:** Yes (Farmer only, must be owner)

**Response:** 200 OK

---

### 3.6 Get My Crops (Farmer)

**Endpoint:** `GET /crops/farmer/my-crops`

**Protected:** Yes (Farmer only)

**Query Parameters:**
```
?page=1
&limit=20
&status=active
&sortBy=createdAt
```

**Response:** 200 OK

---

### 3.7 Update Crop Stock/Availability

**Endpoint:** `PATCH /crops/:cropId/stock`

**Protected:** Yes (Farmer only)

**Request Body:**
```json
{
  "quantity": 80,
  "status": "available"
}
```

**Response:** 200 OK

---

## 4. Order APIs

### 4.1 Create Order

**Endpoint:** `POST /orders`

**Protected:** Yes (Buyer only)

**Request Body:**
```json
{
  "items": [
    {
      "cropId": "crop_id",
      "quantity": 2,
      "notes": "Please deliver in morning"
    }
  ],
  "deliveryAddressId": "address_id",
  "deliveryMode": "delivery",
  "paymentMethod": "card"
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "orderId": "order_id",
    "orderNumber": "ORD-2024-001234",
    "totalAmount": 1250,
    "status": "pending",
    "createdAt": "2024-03-21T10:30:00Z"
  }
}
```

---

### 4.2 Get Order Details

**Endpoint:** `GET /orders/:orderId`

**Protected:** Yes (Buyer/Farmer/Admin only)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "orderId": "order_id",
    "orderNumber": "ORD-2024-001234",
    "status": "accepted",
    "items": [ /* items */ ],
    "buyerDetails": { /* buyer info */ },
    "farmerDetails": { /* farmer info */ },
    "deliveryAddress": { /* address */ },
    "timeline": [
      {
        "status": "pending",
        "timestamp": "2024-03-21T10:30:00Z"
      },
      {
        "status": "accepted",
        "timestamp": "2024-03-21T11:00:00Z"
      }
    ],
    "totalAmount": 1250,
    "paymentStatus": "completed",
    "trackingNumber": "DL123456789"
  }
}
```

---

### 4.3 Get My Orders (Buyer)

**Endpoint:** `GET /orders/buyer/my-orders`

**Protected:** Yes (Buyer only)

**Query Parameters:**
```
?page=1
&limit=20
&status=pending
&sortBy=createdAt
```

**Response:** 200 OK

---

### 4.4 Get Orders for Farmer

**Endpoint:** `GET /orders/farmer/received-orders`

**Protected:** Yes (Farmer only)

**Query Parameters:**
```
?page=1
&limit=20
&status=pending
&sortBy=createdAt
```

**Response:** 200 OK

---

### 4.5 Accept Order (Farmer)

**Endpoint:** `PATCH /orders/:orderId/accept`

**Protected:** Yes (Farmer only)

**Request Body:**
```json
{
  "estimatedReadyDate": "2024-03-22T10:00:00Z",
  "notes": "Will be ready by 10 AM"
}
```

**Response:** 200 OK

---

### 4.6 Reject Order (Farmer)

**Endpoint:** `PATCH /orders/:orderId/reject`

**Protected:** Yes (Farmer only)

**Request Body:**
```json
{
  "reason": "Out of stock"
}
```

**Response:** 200 OK

---

### 4.7 Update Order Status

**Endpoint:** `PATCH /orders/:orderId/status`

**Protected:** Yes (Farmer/Admin)

**Request Body:**
```json
{
  "status": "shipped",
  "trackingNumber": "DL123456789",
  "shippingProvider": "Delhivery"
}
```

**Response:** 200 OK

---

### 4.8 Cancel Order (Buyer)

**Endpoint:** `PATCH /orders/:orderId/cancel`

**Protected:** Yes (Buyer/Admin only)

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

**Response:** 200 OK

---

### 4.9 Confirm Delivery (Buyer)

**Endpoint:** `PATCH /orders/:orderId/confirm-delivery`

**Protected:** Yes (Buyer only)

**Response:** 200 OK

---

## 5. Review & Rating APIs

### 5.1 Create Review

**Endpoint:** `POST /reviews`

**Protected:** Yes (Buyer only, must be verified purchase)

**Request Body:** FormData
```
orderId: "order_id"
cropRating: JSON object with ratings
farmerRating: JSON object with ratings
title: "Great vegetables"
comment: "Fresh, good quality, delivered on time"
photos: <file1>, <file2>
```

**Response:** 201 Created

---

### 5.2 Get Reviews for Crop

**Endpoint:** `GET /reviews/crop/:cropId`

**Protected:** No

**Query Parameters:**
```
?page=1
&limit=10
&sortBy=helpful
```

**Response:** 200 OK

---

### 5.3 Get Reviews for Farmer

**Endpoint:** `GET /reviews/farmer/:farmerId`

**Protected:** No

**Response:** 200 OK

---

### 5.4 Update Review (Farmer Response)

**Endpoint:** `PUT /reviews/:reviewId/response`

**Protected:** Yes (Farmer only)

**Request Body:**
```json
{
  "response": "Thank you for your feedback. We'll improve packaging."
}
```

**Response:** 200 OK

---

## 6. Wishlist APIs

### 6.1 Get Wishlist

**Endpoint:** `GET /wishlist`

**Protected:** Yes

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "cropId": "crop_id",
        "cropName": "Organic Tomatoes",
        "farmerId": "farmer_id",
        "farmers": "Rajesh Kumar"
      }
    ],
    "totalItems": 5
  }
}
```

---

### 6.2 Add to Wishlist

**Endpoint:** `POST /wishlist/:cropId`

**Protected:** Yes

**Response:** 201 Created

---

### 6.3 Remove from Wishlist

**Endpoint:** `DELETE /wishlist/:cropId`

**Protected:** Yes

**Response:** 200 OK

---

## 7. Notification APIs

### 7.1 Get Notifications

**Endpoint:** `GET /notifications`

**Protected:** Yes

**Query Parameters:**
```
?page=1
&limit=20
&unreadOnly=true
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "_id": "notification_id",
      "type": "order_update",
      "title": "Order Accepted",
      "message": "Your order ORD-2024-001234 has been accepted",
      "isRead": false,
      "createdAt": "2024-03-21T11:00:00Z"
    }
  ]
}
```

---

### 7.2 Mark Notification as Read

**Endpoint:** `PATCH /notifications/:notificationId/read`

**Protected:** Yes

**Response:** 200 OK

---

### 7.3 Mark All as Read

**Endpoint:** `PATCH /notifications/mark-all-read`

**Protected:** Yes

**Response:** 200 OK

---

## 8. Admin APIs

### 8.1 Get All Users (Admin)

**Endpoint:** `GET /admin/users`

**Protected:** Yes (Admin only)

**Query Parameters:**
```
?page=1
&limit=20
&role=farmer
&status=active
&search=rajesh
```

**Response:** 200 OK

---

### 8.2 Verify Farmer KYC (Admin)

**Endpoint:** `PATCH /admin/users/:userId/verify-kyc`

**Protected:** Yes (Admin only)

**Request Body:**
```json
{
  "status": "verified"
}
```

**Response:** 200 OK

---

### 8.3 Suspend User (Admin)

**Endpoint:** `PATCH /admin/users/:userId/suspend`

**Protected:** Yes (Admin only)

**Request Body:**
```json
{
  "reason": "Inappropriate listings"
}
```

**Response:** 200 OK

---

### 8.4 Approve Crop Listing (Admin)

**Endpoint:** `PATCH /admin/crops/:cropId/approve`

**Protected:** Yes (Admin only)

**Response:** 200 OK

---

### 8.5 Reject Crop Listing (Admin)

**Endpoint:** `PATCH /admin/crops/:cropId/reject`

**Protected:** Yes (Admin only)

**Request Body:**
```json
{
  "reason": "Inappropriate content"
}
```

**Response:** 200 OK

---

### 8.6 Get Analytics Dashboard (Admin)

**Endpoint:** `GET /admin/analytics`

**Protected:** Yes (Admin only)

**Query Parameters:**
```
?startDate=2024-01-01
&endDate=2024-03-21
&metrics=revenue,orders,users
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "totalRevenue": 125000,
    "totalOrders": 450,
    "totalUsers": 1200,
    "activeOrders": 45,
    "topCrops": [ /* array */ ],
    "topFarmers": [ /* array */ ]
  }
}
```

---

### 8.7 Moderate Review (Admin)

**Endpoint:** `PATCH /admin/reviews/:reviewId/moderate`

**Protected:** Yes (Admin only)

**Request Body:**
```json
{
  "action": "approve",
  "notes": "Valid review"
}
```

**Response:** 200 OK

---

## 9. Payment APIs

### 9.1 Initiate Payment

**Endpoint:** `POST /payments/initiate`

**Protected:** Yes

**Request Body:**
```json
{
  "orderId": "order_id",
  "amount": 1250,
  "paymentMethod": "card"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_123456",
    "orderId": "order_id",
    "amount": 1250,
    "redirectUrl": "https://checkout.razorpay.com/..."
  }
}
```

---

### 9.2 Payment Callback (Payment Gateway)

**Endpoint:** `POST /payments/callback`

**Public Access:** Yes (Webhook)

**Request Body:** (From Payment Gateway)
```json
{
  "paymentId": "pay_123456",
  "orderId": "order_id",
  "status": "success",
  "transactionId": "txn_123456"
}
```

**Response:** 200 OK

---

## 10. Search & Filter APIs

### 10.1 Advanced Search

**Endpoint:** `GET /search`

**Protected:** No

**Query Parameters:**
```
?q=tomatoes
&filters[category]=vegetables
&filters[minPrice]=100
&filters[maxPrice]=500
&filters[city]=Bangalore
&filters[tags]=organic
&sortBy=relevance
```

**Response:** 200 OK

---

## API Security & Headers

### Required Headers (Authenticated Requests)
```
Authorization: Bearer <accessToken>
Content-Type: application/json
X-API-Version: v1
```

### CORS Configuration
```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Credentials: true
```

---

## Rate Limiting

```
Default: 100 requests per 15 minutes per IP
Auth Endpoints: 5 requests per minute per IP
```

---

## Error Status Codes Reference

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 202 | Accepted |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

This comprehensive API specification provides a complete blueprint for implementing all platform functionalities.
