# Architecture Diagrams & Visual References

## 1. System Architecture Layer Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     USERS                                    │
│        (Farmers, Buyers, Admins)                             │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼─────────────────────────────────────┐
│                  CLIENT LAYER                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ React SPA (F_1)                                         │ │
│  │ ├─ Components (Reusable UI blocks)                      │ │
│  │ ├─ Pages (Home, Marketplace, Dashboard)                │ │
│  │ ├─ Context (Auth, Cart, Wishlist, Notification)        │ │
│  │ ├─ Services (API calls)                                │ │
│  │ ├─ Hooks (Custom logic)                                │ │
│  │ ├─ Styles (Tailwind CSS)                               │ │
│  │ └─ Routes (Protected & Public)                         │ │
│  └─────────────────────────────────────────────────────────┘ │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST API (JSON)
┌────────────────────────▼─────────────────────────────────────┐
│               APPLICATION LAYER                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Express.js Server (backend)                          │   │
│  │                                                      │   │
│  │ ┌──────────────────────────────────────────────────┐ │   │
│  │ │ MIDDLEWARE CHAIN                               │ │   │
│  │ ├─ CORS                                           │ │   │
│  │ ├─ Body Parser                                    │ │   │
│  │ ├─ JWT Authentication                            │ │   │
│  │ ├─ Role-Based Authorization                      │ │   │
│  │ ├─ Input Validation                              │ │   │
│  │ └─ Error Handling                                │ │   │
│  └──────────────────────────────────────────────────────┘ │   │
│  │                                                      │   │
│  │ ┌──────────────────────────────────────────────────┐ │   │
│  │ │ ROUTES & CONTROLLERS                           │ │   │
│  │ ├─ /api/v1/auth (Authentication)                 │ │   │
│  │ ├─ /api/v1/users (User Management)               │ │   │
│  │ ├─ /api/v1/crops (Crop Operations)               │ │   │
│  │ ├─ /api/v1/orders (Order Management)             │ │   │
│  │ ├─ /api/v1/reviews (Reviews & Ratings)           │ │   │
│  │ ├─ /api/v1/notifications (Alerts)                │ │   │
│  │ └─ /api/v1/admin (Administration)                │ │   │
│  └──────────────────────────────────────────────────────┘ │   │
│  │                                                      │   │
│  │ ┌──────────────────────────────────────────────────┐ │   │
│  │ │ SERVICES (Business Logic)                      │ │   │
│  │ ├─ Auth Service                                  │ │   │
│  │ ├─ Order Service                                │ │   │
│  │ ├─ Email Service                                │ │   │
│  │ ├─ Payment Service                              │ │   │
│  │ └─ File Upload Service                          │ │   │
│  └──────────────────────────────────────────────────────┘ │   │
└────────────────────────┬─────────────────────────────────────┘
                         │ MongoDB Query
┌────────────────────────▼─────────────────────────────────────┐
│                DATABASE LAYER                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ MongoDB Atlas (Cloud)                               │   │
│  │ ├─ Users Collection                                 │   │
│  │ ├─ Crops Collection                                 │   │
│  │ ├─ Orders Collection                                │   │
│  │ ├─ Reviews Collection                               │   │
│  │ ├─ Notifications Collection                         │   │
│  │ ├─ Categories Collection                            │   │
│  │ ├─ Wishlists Collection                             │   │
│  │ └─ Analytics Collection                             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────────┘
        ┌───────────────┼────────────────┬──────────────┐
        │               │                │              │
        ▼               ▼                ▼              ▼
    ┌────────┐   ┌──────────────┐ ┌──────────┐   ┌─────────┐
    │Email   │   │File Storage  │ │Payment   │   │Analytics│
    │Service │   │(Cloudinary)  │ │(Razorpay)│  │ Service │
    └────────┘   └──────────────┘ └──────────┘   └─────────┘
```

---

## 2. User Role Permission Matrix

```
              │ Farmer │ Buyer │ Admin │
──────────────┼────────┼───────┼───────┤
View Profile  │   ✅   │  ✅   │  ✅   │
Edit Profile  │   ✅   │  ✅   │  ✅   │
Add Crops     │   ✅   │  ❌   │  ✅   │
Edit Crops    │  ⚠️(O) │  ❌   │  ✅   │
Delete Crops  │  ⚠️(O) │  ❌   │  ✅   │
Browse Crops  │   ❌   │  ✅   │  ✅   │
Place Orders  │   ❌   │  ✅   │  ❌   │
Accept Orders │   ✅   │  ❌   │  ❌   │
View Orders   │  ⚠️(R) │ ⚠️(B) │  ✅   │
View Analytics│  ✅(O) │  ❌   │  ✅   │
Manage Users  │   ❌   │  ❌   │  ✅   │
Issue Refunds │   ❌   │  ❌   │  ✅   │

Legend:
✅ = Full Access
⚠️ = Own Only / Own data
(O) = Own crops/data
(R) = Received orders
(B) = Bought items
❌ = No Access
```

---

## 3. User Flow Diagram

```
┌─────────┐
│  START  │
└────┬────┘
     │
     ▼
┌─────────────┐
│   LANDING   │
│    PAGE     │
└─┬───────────┘
  │
  ├─────────────────┬──────────────────┐
  │                 │                  │
  ▼                 ▼                  ▼
┌─────┐      ┌──────────┐      ┌────────────┐
│Visit│      │ REGISTER │      │LOGIN FIRST?│
│Mktpl│      │(Farmer/  │      │            │
│     │      │ Buyer)   │      │  NO → REG  │
└────┬┘      │          │      │  YES → LOG │
     │       └────┬─────┘      └─────┬──────┘
     │            │                  │
     └────┬───────┼──────────────────┘
          │       │
          ▼       ▼
     ┌─────────────────┐
     │ SET PASSWORD    │
     │ VERIFY EMAIL    │
     │ KYC (Farmer)    │
     └────┬────────────┘
          │
          ▼
     ┌─────────────────┐
     │  CREATE PROFILE │
     └────┬────────────┘
          │
          ▼
     ┌──────────────────────┐
     │  ROLE-BASED LANDING  │
     ├──────────────────────┤
     │ FARMER: Farm Setup   │
     │ BUYER: Browse Crops  │
     │ ADMIN: Dashboard     │
     └──────────────────────┘
```

---

## 4. Order State Machine

```
                    ┌─────────────┐
                    │ ORDER PAID  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   PENDING   │ ◄─── Farmer sees this
                    │ (Farmer ?)  │
                    └───┬──┬──────┘
                        │  │
                  Accept│  │Reject
                        │  │
          ┌─────────────┘  └──────────────────┐
          │                                   │
          ▼                                   ▼
    ┌──────────┐                       ┌──────────────┐
    │ ACCEPTED │                       │  REJECTED    │
    │(Preparing)                       │(Refund Init) │
    └────┬─────┘                       └──────┬───────┘
         │                                    │
         │Process by farmer                  │
         │                            Refund processed
         ▼                                    │
    ┌──────────┐                            ▼
    │ SHIPPED  │                       ┌──────────────┐
    │(In Trans)                        │ CANCELLED    │
    └────┬─────┘                       │(Final State) │
         │                             └──────────────┘
         │Delivery confirmed
         ▼
    ┌──────────┐
    │DELIVERED │
    │ (Buyer?) │
    └───┬──────┘
        │
        ├─ No issues
        │  │
        │  ▼
        │ ┌────────────┐
        │ │ COMPLETED  │
        │ │  (Done!)   │
        │ └────────────┘
        │
        └─ Issue Reported
           │
           ▼
        ┌──────────┐
        │ DISPUTED │ ◄─── Admin investigates
        └────┬─────┘
             │
        ┌────┴────┐
        │          │
        ▼          ▼
    ┌────────┐ ┌─────────┐
    │REFUND  │ │ACCEPTED │
    │APPROVED│ │  AS IS  │
    └────────┘ └─────────┘
```

---

## 5. Authentication Flow

```
┌──────────────────┐
│    USER VISITS   │
│  LOGIN PAGE      │
└────────┬─────────┘
         │
         ▼
    ┌─────────────┐
    │ ENTER EMAIL │
    │   & PASS    │
    └──────┬──────┘
           │
           │ Submit
           ▼
    ┌─────────────────┐
    │   SERVER SIDE   │
    ├─────────────────┤
    │ 1. Find User    │
    │ 2. Hash & Match │
    │    Password     │
    └─────┬───────────┘
          │
      ┌───┴────┐
      │         │
   Match    Not Match
      │         │
      ▼         ▼
  ┌────┐   ┌──────────┐
  │YES  │   │ ERROR    │
  └──┬──┘   │ Retry    │
     │      └──────────┘
     │
     ▼
┌─────────────────────┐
│ GENERATE TOKENS:    │
│ • Access (15 min)   │
│ • Refresh (7 days)  │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────┐
│ SEND TO CLIENT:      │
│ - Tokens in Header   │
│ - User Data in Body  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ STORE IN CLIENT:     │
│ - Token in localStorage
│ - User data in state  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ REDIRECT TO           │
│ ROLE DASHBOARD        │
└──────────────────────┘
```

---

## 6. API Request/Response Flow

```
┌────────────────────────┐
│ CLIENT (React)         │
│ User Action            │
└──────────┬─────────────┘
           │
           │ API Request
           │ POST /api/v1/orders
           │ {
           │   items: [...],
           │   address: {...},
           │   payment: "card"
           │ }
           │
           ▼
┌────────────────────────┐
│ ROUTER (Express)       │
│ Match Route            │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────────────┐
│ MIDDLEWARE CHAIN               │
├────────────────────────────────┤
│ 1. Parse JSON Body ✅          │
│ 2. Check Auth Token ✅         │
│ 3. Verify Role (buyer) ✅      │
│ 4. Validate Input ✅           │
│    ├─ Email format             │
│    ├─ Quantity > 0             │
│    └─ Address valid            │
└──────────┬─────────────────────┘
           │
           ▼
┌────────────────────────┐
│ CONTROLLER             │
│ Business Logic         │
│ • Verify stock         │
│ • Calculate total      │
│ • Check inventory      │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ DATABASE OPERATION     │
│ .save() to MongoDB     │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ SERVICE CALLS          │
│ • Send email alert     │
│ • Trigger notification │
│ • Update inventory     │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ RESPONSE               │
│ 201 Created            │
│ {                      │
│   orderId: "...",      │
│   status: "pending"    │
│ }                      │
└──────────┬─────────────┘
           │
           │ API Response
           ▼
┌────────────────────────┐
│ CLIENT (React)         │
│ Update State           │
│ Show Success Toast     │
│ Redirect to Tracking   │
└────────────────────────┘
```

---

## 7. Data Relationship Diagram

```
┌─────────────┐
│    USER     │◄──────┐
├─────────────┤       │
│ _id         │       │
│ email       │       │
│ role        │       │
│ firstName   │       │
│ lastName    │       │
└──────┬──────┘       │
       │              │
       │ farmerId     │
       │              │
       ▼              │
   ┌──────────┐       │
   │  CROP    │       │
   ├──────────┤       │
   │ _id      │       │
   │ farmerId │───────┘
   │ name     │
   │ price    │
   │ qty      │
   └─┬────────┘
     │
     │ cropId
     │
     ▼
 ┌─────────┐
 │ ORDER   │
 ├─────────┤
 │ _id     │
 │ cropId  │
 │ qty     │
 │ amount  │
 │ status  │
 └────┬────┘
      │ orderId
      │
      ▼
 ┌──────────┐
 │ REVIEW   │
 ├──────────┤
 │ _id      │
 │ orderId  │
 │ rating   │
 │ comment  │
 └──────────┘
```

---

## 8. Frontend Component Tree

```
<App>
  <AuthContext.Provider>
    <CartContext.Provider>
      <NotificationContext.Provider>
        <Router>
          <Navbar />
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/marketplace" element={<Marketplace />} />
              ├─ <FilterPanel />
              ├─ <SearchBar />
              └─ <CropGrid>
                  └─ <CropCard /> x N
            
            <Route path="/auth/*" element={<AuthPages />} />
              ├─ <Login />
              ├─ <Register />
              └─ <ForgotPassword />
            
            <ProtectedRoute path="/farmer/*">
              <FarmerDashboard />
              ├─ <RecentOrders />
              ├─ <EarningsChart />
              └─ <ManageCrops />
            </ProtectedRoute>
            
            <ProtectedRoute path="/buyer/*">
              <BuyerDashboard />
              ├─ <RecentOrders />
              ├─ <MyWishlist />
              └─ <ShoppingCart />
            </ProtectedRoute>
            
            <ProtectedRoute path="/admin/*">
              <AdminDashboard />
              ├─ <UserManagement />
              ├─ <ListingModeration />
              └─ <Analytics />
            </ProtectedRoute>
          </Routes>
          
          <Footer />
        </Router>
      </NotificationContext.Provider>
    </CartContext.Provider>
  </AuthContext.Provider>
</App>
```

---

## 9. Database Indexing Strategy

```
USERS Collection
├─ email (unique) → Fast login
├─ phone (unique) → Fast lookup
├─ role → Filter by role
└─ createdAt (-1) → Recent users

CROPS Collection
├─ farmerId (1) → Get farmer's crops
├─ category (1) → Browse by category
├─ name, description (text) → Search
├─ location.city (1) → Filter by location
├─ isApproved, isActive → Get public listings
└─ createdAt (-1) → Sort by newest

ORDERS Collection
├─ buyerId (1) → Get buyer's orders
├─ farmerId (1) → Get farmer's orders
├─ status (1) → Filter by status
├─ createdAt (-1) → Sort by recent
└─ payment.status (1) → Payment filter

REVIEWS Collection
├─ farmerId (1) → Get farmer's reviews
├─ cropId (1) → Get crop's reviews
├─ cropRating.overall (1) → Sort by rating
└─ createdAt (-1) → Sort by newest
```

---

## 10. WebSocket Real-Time Events

```
┌─────────────────────────────────────┐
│ CLIENT (Socket.io)                  │
│ Connect to server                   │
└──────────────┬──────────────────────┘
               │ io.connect()
               │
               ▼
┌─────────────────────────────────────┐
│ SERVER (Socket.io Handler)          │
│ Handle connection                   │
└──────────────┬──────────────────────┘
               │
               │ socket.on('order:status-change')
               │ socket.on('notification:new')
               │ socket.on('message:received')
               │
               ▼
┌─────────────────────────────────────┐
│ EVENT PROCESSING                    │
│ • Verify user permissions           │
│ • Update database                   │
│ • Broadcast to relevant users       │
└──────────────┬──────────────────────┘
               │
               │ socket.emit()
               │ socket.to().emit()
               │ io.emit()
               │
               ▼
┌─────────────────────────────────────┐
│ CLIENT RECEIVES EVENT               │
│ Update UI in real-time              │
│ Show notification toast             │
│ Play sound alert                    │
└─────────────────────────────────────┘

Event Examples:
├─ order:accepted
├─ order:rejected
├─ order:shipped
├─ order:delivered
├─ notification:new
├─ crop:stock-low
├─ review:posted
└─ seller:online
```

---

## 11. Request Authorization Flow

```
┌─────────────────────────────────┐
│ CLIENT SENDS REQUEST            │
│ Headers: {                      │
│   Authorization: "Bearer TOKEN" │
│ }                               │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ AUTH MIDDLEWARE                 │
│ Extract token from header       │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ VERIFY JWT                      │
│ Decode and validate signature   │
└──────────────┬──────────────────┘
               │
           ┌───┴───┐
           │       │
        Valid   Invalid
           │       │
           ▼       ▼
         ┌─┐   ┌──────┐
         │✅│   │401   │
         └─┘   │Unauth│
           │   └──────┘
           │
           ▼
┌─────────────────────────────────┐
│ EXTRACT USER INFO               │
│ req.user = {                    │
│   userId: "...",                │
│   email: "...",                 │
│   role: "buyer"                 │
│ }                               │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ ROLE AUTHORIZATION              │
│ Check if role allowed for route │
└──────────────┬──────────────────┘
               │
           ┌───┴───────┐
           │           │
        Allowed    Not Allowed
           │           │
           ▼           ▼
         ┌─┐      ┌──────┐
         │✅│      │403   │
         └─┘      │Forbid│
           │      └──────┘
           │
           ▼
┌─────────────────────────────────┐
│ PROCEED TO CONTROLLER           │
│ Execute business logic          │
└─────────────────────────────────┘
```

---

## 12. Payment Processing Flow

```
┌──────────────────────┐
│ ORDER READY          │
│ TO PAY               │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ INITIATE PAYMENT     │
│ /payments/initiate   │
│ Returns: paymentId   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ LOAD PAYMENT         │
│ GATEWAY              │
│ (Razorpay Modal)     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ USER ENTERS DETAILS  │
│ • Card Number        │
│ • CVV                │
│ • Expiry             │
│ • Name               │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────┐
│ GATEWAY PROCESSES                │
│ • Validate card                  │
│ • Charge amount                  │
│ • Return status                  │
└──────────┬───────────────────────┘
           │
       ┌───┴──────┐
       │          │
    Success    Failed
       │          │
       ▼          ▼
   ┌───┐      ┌─────┐
   │✅ │      │ ❌  │
   └─┬─┘      └──┬──┘
     │           │
     │      Retry Payment?
     │      │Yes    │No
     │      ▼       ▼
     │   Retry    Cancel
     │      │       │
     ▼      ▼       ▼
  Webhook to Server
  /payments/callback
  
  Payment Status:
  success / failed / pending
  
  Then:
  ├─ Update Order Status
  ├─ Update Payment Record
  ├─ Notify Farmer
  ├─ Send Confirmation Email
  └─ Redirect to Tracking
```

---

These visual diagrams complement the detailed documentation and help understand the system architecture at a glance. Reference these diagrams alongside the specific documentation files for complete understanding.
