# Modules & Workflows - Rural Farmer Marketplace

## 1. Authentication Module

### 1.1 Registration Flow

```
User Selects Role (Farmer/Buyer)
    ↓
Fills Registration Form
├─ Email
├─ Phone Number
├─ Password (8+ chars, mixed case, numbers)
└─ Password Confirmation
    ↓
Verification Email/OTP Sent
    ↓
User Verifies Email
    ↓
Account Created
    ↓
Redirect to Profile Setup
```

### 1.2 Additional Registration for Farmers
```
Basic Registration Complete
    ↓
Farm Details Form
├─ Farm Name
├─ Location (Latitude, Longitude)
├─ Farm Size
├─ Crops Grown
├─ Bank Account Details
└─ KYC Documents
    ↓
Admin KYC Verification
├─ Verify Documents
├─ Approve/Reject
└─ Notify Farmer
    ↓
Farm Activated
```

### 1.3 Login Flow

```
Enter Email/Phone
    ↓
Enter Password
    ↓
Verify Credentials
    ↓
Generate JWT Tokens
├─ Access Token (15 min)
├─ Refresh Token (7 days)
└─ Store in HTTP-only Cookie
    ↓
Redirect to Dashboard/Home
```

### 1.4 Password Reset Flow

```
Click "Forgot Password"
    ↓
Enter Email
    ↓
Send Reset Link (valid 24 hours)
    ↓
User Clicks Link
    ↓
Enter New Password
    ↓
Verify & Update in DB
    ↓
Redirect to Login
```

---

## 2. Farmer Module

### 2.1 Crop Management Workflow

```
┌─────────────────────────────────────────────────────┐
│         FARMER CROP MANAGEMENT WORKFLOW             │
└─────────────────────────────────────────────────────┘

┌─ ADD CROP FLOW ────────────────────────────────────┐
│                                                    │
│ 1. Click "Add New Crop"                            │
│ 2. Fill Form:                                      │
│    ├─ Crop Name                                    │
│    ├─ Category (from dropdown)                     │
│    ├─ Description                                  │
│    ├─ Quantity (kg/units)                          │
│    ├─ Price per Unit                               │
│    ├─ Harvest Date                                 │
│    ├─ Upload Images (up to 5)                      │
│    ├─ Tags (organic, pesticide-free, etc.)         │
│    └─ Select Delivery Type                         │
│ 3. Submit Form                                     │
│ 4. Update Database                                 │
│ 5. Generate Listing                                │
│ 6. Display on Marketplace                          │
│                                                    │
└────────────────────────────────────────────────────┘

┌─ EDIT CROP FLOW ───────────────────────────────────┐
│                                                    │
│ 1. View "My Crops"                                 │
│ 2. Click "Edit" on Crop Card                       │
│ 3. Update Fields                                   │
│ 4. Save Changes                                    │
│ 5. Update in Database                              │
│                                                    │
└────────────────────────────────────────────────────┘

┌─ DELETE CROP FLOW ─────────────────────────────────┐
│                                                    │
│ 1. View "My Crops"                                 │
│ 2. Click "Delete"                                  │
│ 3. Confirm Delete                                  │
│ 4. Check for Active Orders                         │
│    ├─ If Active Orders: Show Warning               │
│    └─ Allow Proceed Only After Orders End          │
│ 5. Remove from Marketplace                         │
│ 6. Delete from Database                            │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 2.2 Order Reception & Management

```
NEW ORDER RECEIVED
    ↓
Farmer Notification (in-app, email, SMS)
├─ Order ID
├─ Buyer Details
├─ Crop & Quantity
├─ Total Price
└─ Delivery Details
    ↓
Farmer Dashboard Shows "New Orders"
    ↓
Farmer Reviews Order Details
    ↓
Decision Point: Accept or Reject
    ├─ ACCEPT FLOW ──────────────────────────┐
    │  ↓                                      │
    │  Mark as "Accepted"                     │
    │  ↓                                      │
    │  Notify Buyer                           │
    │  ↓                                      │
    │  Decrease Crop Quantity                 │
    │  ↓                                      │
    │  Mark as "Ready for Pickup/Delivery"    │
    │  ↓                                      │
    │  Update Status to: Pending Fulfillment  │
    │                                         │
    └─────────────────────────────────────────┘
    │
    └─ REJECT FLOW ──────────────────────────┐
       ↓                                      │
       Enter Rejection Reason                 │
       ↓                                      │
       Mark as "Rejected"                     │
       ↓                                      │
       Notify Buyer                           │
       ├─ Return Payment                      │
       └─ Order Cancelled                     │
                                              │
       └──────────────────────────────────────┘
    ↓
FULFILLMENT
├─ Prepare for Pickup/Delivery
├─ Mark as "Ready"
└─ Update Status
    ↓
DELIVERY COORDINATION
├─ Arrange Logistics
├─ Share Delivery Details
└─ Track Delivery
    ↓
COMPLETION
├─ Mark as "Delivered"
├─ Update Earnings
└─ Wait for Buyer Review
```

### 2.3 Farmer Dashboard Layout

```
┌────────────────────────────────────────────────────┐
│  SIDEBAR NAVIGATION   │   MAIN CONTENT             │
├───────────────────────┼────────────────────────────┤
│ Dashboard (Home)      │  Overview Cards:           │
│ My Crops              │  ├─ Total Earnings        │
│ Add New Crop          │  ├─ Total Orders          │
│ My Orders             │  ├─ Pending Orders        │
│ Order Requests        │  ├─ Completed Orders      │
│ Earnings              │  └─ Farm Rating           │
│ Farm Profile          │                            │
│ Settings              │  Recent Orders Table:      │
│ Logout                │  ├─ Order ID              │
│                       │  ├─ Buyer Name            │
│                       │  ├─ Crop & Qty            │
│                       │  ├─ Status                │
│                       │  └─ Total Price           │
│                       │                            │
│                       │  Action Buttons:          │
│                       │  ├─ View Details          │
│                       │  ├─ Accept/Reject         │
│                       │  └─ Track Delivery        │
└────────────────────────────────────────────────────┘
```

---

## 3. Buyer Module

### 3.1 Shopping Workflow

```
┌─────────────────────────────────────────────────────┐
│            BUYER SHOPPING WORKFLOW                  │
└─────────────────────────────────────────────────────┘

HOME PAGE
    ↓
BROWSE CROPS
├─ View Featured Crops
├─ View Categories
├─ View Seasonal Products
└─ Scroll and Explore
    ↓
MARKETPLACE PAGE
├─ Grid View of All Crops
├─ Pagination
└─ Sort Options
    ↓
SEARCH & FILTER
├─ Search by Crop Name
├─ Filter by:
│  ├─ Category
│  ├─ Price Range
│  ├─ Location (distance)
│  ├─ Rating
│  ├─ Organic/Pesticide-free
│  └─ Delivery Type
└─ Apply Filters
    ↓
VIEW CROP DETAILS
├─ Images Carousel
├─ Crop Description
├─ Price
├─ Quantity Available
├─ Why it's special? (added by farmer)
├─ Farmer Details & Rating
├─ Reviews & Ratings
└─ Delivery Options
    ↓
ADD TO CART OR WISHLIST
├─ Select Quantity
├─ Add to Cart
│  ↓
│  Redirect to Cart
├─ OR Add to Wishlist
│  ↓
│  Show Notification
└─ OR Buy Now
   ↓
   Proceed to Checkout
```

### 3.2 Checkout & Order Placement

```
SHOPPING CART
    ↓
REVIEW ITEMS
├─ Crop Names & Qty
├─ Price per Unit
└─ Total Price
    ↓
MODIFY CART
├─ Update Quantities
├─ Remove Items
└─ Continue Shopping
    ↓
PROCEED TO CHECKOUT
    ↓
SELECT/ADD DELIVERY ADDRESS
├─ Saved Addresses (dropdown)
├─ Add New Address:
│  ├─ Full Name
│  ├─ Phone
│  ├─ House/Building
│  ├─ Area/Colony
│  ├─ City
│  ├─ State
│  └─ Pincode
└─ Select Delivery Type:
   ├─ Home Delivery (add cost)
   └─ Pickup from Farm (free)
    ↓
VIEW ORDER SUMMARY
├─ Crops & Price
├─ Delivery Charges
├─ Discount (if any)
└─ Final Total
    ↓
ENTER PAYMENT METHOD
├─ Debit Card
├─ Credit Card
├─ Net Banking
├─ UPI
└─ Wallet
    ↓
PROCESS PAYMENT
├─ Validate Payment
├─ Confirm with Gateway
└─ Return Response
    ↓
PAYMENT SUCCESS / FAILURE
├─ SUCCESS:
│  ├─ Order Created
│  ├─ Order ID Generated
│  ├─ Send Confirmation Email
│  ├─ Send to Farmer
│  └─ Redirect to Order Confirmation Page
└─ FAILURE:
   ├─ Show Error Message
   └─ Allow Retry
    ↓
REDIRECT TO ORDER TRACKING
```

### 3.3 Order Tracking & Management

```
ORDER CONFIRMATION PAGE
    ↓
ORDER DETAILS
├─ Order ID
├─ Order Date
├─ Expected Delivery Date
├─ Farmer Details
├─ Delivery Address
└─ Total Amount
    ↓
ORDER TRACKING
├─ Timeline View:
│  ├─ Order Placed ✓
│  ├─ Confirmed by Farmer ⏳
│  ├─ Ready for Delivery ⏳
│  ├─ In Transit ⏳
│  ├─ Delivered ⏳
│  └─ Completed ⏳
│
├─ Map View (if delivery)
└─ Real-time Updates (via WebSocket)
    ↓
ORDER ACTIONS
├─ Contact Farmer (Chat)
├─ Track Live Location
├─ Cancel Order (if not accepted)
└─ Report Issue
    ↓
AFTER DELIVERY
├─ Mark as Received
├─ Leave Review & Rating:
│  ├─ Crops Quality (1-5 stars)
│  ├─ Farmer Rating (1-5 stars)
│  ├─ Written Review
│  ├─ Upload Photos
│  └─ Submit
└─ Recommend to Friends
    ↓
COMPLETED ORDER
├─ Stored in Order History
└─ Available for Future Reference
```

### 3.4 Buyer Dashboard Layout

```
┌────────────────────────────────────────────────────┐
│  SIDEBAR NAVIGATION   │   MAIN CONTENT             │
├───────────────────────┼────────────────────────────┤
│ Dashboard (Home)      │  Overview Cards:           │
│ Browse Crops          │  ├─ Total Spent           │
│ My Orders             │  ├─ Active Orders         │
│ Order History         │  ├─ Delivered Orders      │
│ Wishlist              │  └─ Favorite Farmers      │
│ Shopping Cart         │                            │
│ Reviews               │  Recent Orders Table:      │
│ My Profile            │  ├─ Order ID              │
│ Saved Addresses       │  ├─ Farmer Name           │
│ Settings              │  ├─ Crops & Qty           │
│ Logout                │  ├─ Status                │
│                       │  ├─ Delivery Date         │
│                       │  └─ Action Button         │
│                       │  └─ View Details          │
│                       │                            │
│                       │  My Reviews Section:      │
│                       │  ├─ Crops Reviewed        │
│                       │  └─ Pending Reviews       │
└────────────────────────────────────────────────────┘
```

---

## 4. Admin Module

### 4.1 User Management Workflow

```
ADMIN LOGIN
    ↓
ADMIN DASHBOARD
    ↓
USER MANAGEMENT SECTION
├─ View All Users
├─ Filter by Role (Farmer/Buyer)
├─ Filter by Status (Active/Inactive/Pending)
└─ Search User
    ↓
USER VERIFICATION
├─ View KYC Documents (Farmers)
├─ Verify Identity
├─ Compare Information
└─ Approve/Reject
    ↓
USER ACTIONS
├─ APPROVE: Farmer Activated
├─ REJECT: Send Rejection Email
├─ SUSPEND: Disable Account
├─ VIEW PROFILE:
│  ├─ Personal Details
│  ├─ Farm Details (if Farmer)
│  ├─ Order History
│  └─ Reviews & Ratings
└─ EDIT USER:
   ├─ Update Details
   └─ Change Status
    ↓
NOTIFICATIONS
├─ Send to User
└─ Log Action
```

### 4.2 Listing Moderation Workflow

```
ADMIN DASHBOARD
    ↓
LISTING MODERATION SECTION
├─ View Pending Listings
├─ View Reported Listings
└─ Filter by Category
    ↓
REVIEW LISTING
├─ View Crop Details
├─ View Images
├─ Check Description Quality
├─ Verify Pricing
├─ Check Farm Location
└─ Review Farmer History
    ↓
MODERATION DECISION
├─ APPROVE:
│  ├─ Make Visible on Marketplace
│  ├─ Notify Farmer
│  └─ Move to Active
│
├─ REJECT:
│  ├─ Hide Listing
│  ├─ Notify Farmer with Reason
│  └─ Request Resubmission
│
└─ REPORT ISSUE:
   ├─ Flag for Further Review
   └─ Assign to Manager
    ↓
LOG ACTION
├─ Store in Moderation Log
└─ Timestamp & Admin ID
```

### 4.3 Order Monitoring Workflow

```
ADMIN DASHBOARD
    ↓
ORDER MONITORING SECTION
├─ View All Orders
├─ Filter by Status:
│  ├─ Pending
│  ├─ Accepted
│  ├─ Shipped
│  ├─ Delivered
│  ├─ Cancelled
│  └─ Disputed
└─ Search Orders
    ↓
ORDER DETAILS VIEW
├─ Order ID
├─ Buyer & Farmer Details
├─ Crop Details
├─ Payment Status
├─ Delivery Status
└─ Timeline
    ↓
ISSUE RESOLUTION
├─ IF DISPUTE:
│  ├─ View Complaint
│  ├─ Review Evidence
│  ├─ Contact Parties
│  ├─ Make Decision
│  └─ Process Refund if needed
│
├─ IF DELAYED:
│  ├─ Send Reminder to Farmer
│  ├─ Monitor Progress
│  └─ Escalate if Needed
│
└─ IF CANCELLED:
   ├─ Verify Reason
   ├─ Process Refund
   └─ Log in System
```

### 4.4 Analytics & Reporting

```
ADMIN DASHBOARD
    ↓
ANALYTICS SECTION
├─ OVERVIEW STATS:
│  ├─ Total Users (Farmers/Buyers)
│  ├─ Total Transactions
│  ├─ Total Revenue
│  ├─ Average Order Value
│  └─ Platform Growth %
│
├─ FARMER ANALYTICS:
│  ├─ Top Performing Farmers
│  ├─ Earnings Distribution
│  ├─ Listing Performance
│  └─ Farmer Growth Rate
│
├─ BUYER ANALYTICS:
│  ├─ Purchase Patterns
│  ├─ Most Bought Categories
│  ├─ Buyer Retention Rate
│  └─ Average Spend per Buyer
│
├─ CROP ANALYTICS:
│  ├─ Most Demanded Crops
│  ├─ Price Trends
│  ├─ Seasonal Demand
│  └─ Stock Levels
│
└─ CHARTS & GRAPHS:
   ├─ Sales Over Time
   ├─ Category Distribution
   ├─ Location Heatmap
   └─ Payment Methods
    ↓
REPORT GENERATION
├─ Generate PDF Reports
├─ Export to CSV/Excel
└─ Send to Stakeholders
```

### 4.5 Admin Dashboard Layout

```
┌────────────────────────────────────────────────────────┐
│  SIDEBAR NAVIGATION   │   MAIN CONTENT                 │
├───────────────────────┼────────────────────────────────┤
│ Dashboard (Home)      │  Overview KPIs:                │
│ User Management       │  ├─ Total Users               │
│ Listing Moderation    │  ├─ Active Orders             │
│ Order Management      │  ├─ Today's Revenue           │
│ Dispute Resolution    │  └─ Pending Verifications     │
│ Analytics             │                                │
│ Reports               │  Charts Section:              │
│ Settings              │  ├─ Sales Trend               │
│ Community Guidelines  │  ├─ User Growth               │
│ Notifications         │  ├─ Category Breakdown        │
│ Support               │  └─ Payment Methods           │
│ Logout                │                                │
│                       │  Recent Activity Table:       │
│                       │  ├─ New Users                 │
│                       │  ├─ New Orders                │
│                       │  ├─ Disputes                  │
│                       │  └─ Reported Content          │
└────────────────────────────────────────────────────────┘
```

---

## 5. Complete State Transition Diagrams

### Order Status Lifecycle

```
CREATED
   ↓
PENDING (Awaiting Farmer Response)
   ├─ Farmer Accepts
   │  ↓
   │  ACCEPTED (Preparing for Delivery)
   │  ↓
   │  SHIPPED (In Transit)
   │  ↓
   │  DELIVERED
   │  ↓
   │  COMPLETED (Ready for Review)
   │
   └─ Farmer Rejects
      ↓
      REJECTED (Order Cancelled, Refund Initiated)
      ↓
      CANCELLED (Final State)

CREATED
   ├─ Buyer Cancels (Before Acceptance)
   │  ↓
   │  CANCELLED
   │
   └─ Payment Fails
      ↓
      PAYMENT_FAILED (Awaiting Retry)
      ↓
      CANCELLED (After Timeout)

DELIVERED
   └─ Issue/Damage Reported
      ↓
      DISPUTED
      ↓
      REFUNDED / REPLACED
      ↓
      RESOLVED
```

### Farmer KYC Status Lifecycle

```
NEW ACCOUNT
   ↓
KYC_PENDING (Awaiting Document Upload)
   ↓
DOCUMENTS_SUBMITTED (Under Admin Review)
   ├─ Admin Approves
   │  ↓
   │  KYC_VERIFIED
   │  ↓
   │  ACTIVE (Can list crops)
   │
   └─ Admin Rejects
      ↓
      KYC_REJECTED (With Reason)
      ↓
      DOCUMENTS_SUBMITTED (Can Resubmit)
```

---

## 6. Key Workflow Decisions

| Decision Point | Options | Outcome |
|---|---|---|
| **User Registration** | Farmer / Buyer | Different profile setup & permissions |
| **Crop Listing** | Publish Now / Schedule | Publish immediately or set date |
| **Order Acceptance** | Accept / Reject | Proceed to fulfillment or cancel |
| **Delivery Mode** | Home Delivery / Pickup | Affect timeline & farmer responsibilities |
| **Payment** | Wallet / Card / UPI | Process through payment gateway |
| **Dispute Resolution** | Refund / Replace / Cancel | Determine final outcome |
| **Admin Decision** | Approve / Reject / Suspend | Affect user account status |

---

## 7. Module Interaction Map

```
┌──────────────┐
│   AUTH       │────────┬──────────────────────┐
│  (Register/  │        │                      │
│   Login)     │        ↓                      ↓
└──────────────┘   ┌─────────────┐       ┌──────────────┐
                   │   PROFILE   │       │ PERMISSIONS  │
                   │ (User Data) │       │  (RBAC)      │
                   └──────┬──────┘       └──────────────┘
                          │
              ┌───────────┼───────────┐
              ↓           ↓           ↓
          ┌────────┐ ┌────────┐ ┌────────┐
          │ FARMER │ │ BUYER  │ │ ADMIN  │
          │MODULE  │ │MODULE  │ │MODULE  │
          └────┬───┘ └────┬───┘ └────┬───┘
               │          │          │
          ┌────▼──────────▼──────────▼─────┐
          │      CROP & MARKETPLACE        │
          │     (Browse, Search, Filter)   │
          └────┬──────────┬────────────────┘
               │          │
          ┌────▼──────────▼────┐
          │   ORDER MANAGEMENT │
          │ (Create, Track,    │
          │  Update Status)    │
          └────┬───────────────┘
               │
          ┌────▼─────────────────────┐
          │   NOTIFICATION & DELIVERY │
          │ (Status Updates, Tracking)│
          └────┬─────────────────────┘
               │
               ├─── PAYMENT
               ├─── REVIEW & RATING
               ├─── WISHLIST & CART
               └─── ANALYTICS
```

---

## 8. Workflow Enhancement Strategies

### For Farmers:
1. **Bulk Upload:** CSV import for multiple crops
2. **Crop Templates:** Save and reuse crop details
3. **Automated Pricing:** Set price rules based on quantity
4. **Seasonal Automation:** Auto-publish seasonal crops
5. **Analytics Dashboard:** Detailed crop performance metrics

### For Buyers:
1. **Saved Searches:** Save and repeat favorite filters
2. **Smart Recommendations:** Based on purchase history
3. **Subscription Orders:** Recurring purchases
4. **Group Buying:** Combine orders for discounts
5. **Delivery Scheduling:** Schedule deliveries

### For Admin:
1. **Batch Operations:** Process multiple users/listings
2. **Custom Reports:** Generate specific reports
3. **Automation Rules:** Auto-approve trusted farmers
4. **Alerts System:** Real-time notifications of issues
5. **Audit Trail:** Complete action history logging

This comprehensive workflow design ensures smooth operations across all user roles and system modules.
