# Database Schema Design - MongoDB Collections

## 1. User Collection

### Purpose
Stores all user information (Farmers, Buyers, Admins)

### Schema

```javascript
{
  _id: ObjectId,                    // MongoDB unique ID
  
  // Basic Information
  firstName: String,                 // e.g., "Rajesh"
  lastName: String,                  // e.g., "Kumar"
  email: String (unique),            // e.g., user@example.com
  phone: String (unique),            // e.g., "9876543210"
  password: String (hashed),         // bcrypt hashed password
  
  // Role & Status
  role: Enum,                        // "farmer" | "buyer" | "admin"
  accountStatus: Enum,               // "active" | "inactive" | "suspended" | "pending"
  emailVerified: Boolean,            // Default: false
  phoneVerified: Boolean,            // Default: false
  
  // Profile
  profilePicture: String (URL),      // Cloudinary URL
  bio: String,                       // Short description
  dateOfBirth: Date,
  gender: Enum,                      // "male" | "female" | "other"
  
  // Location & Address
  address: {
    streetAddress: String,
    area: String,
    city: String,
    state: String,
    pincode: String,
    latitude: Number,
    longitude: Number,
    country: String
  },
  
  // Farmer-Specific Fields
  farmName: String,                  // Required for farmers
  farmSize: Number,                  // In acres/hectares
  cropsGrown: [String],              // Array of crop names
  farmImages: [String],              // Array of Cloudinary URLs
  
  // KYC (Know Your Customer) - Farmers
  kycStatus: Enum,                   // "pending" | "submitted" | "verified" | "rejected"
  kycDocuments: {
    aadharNumber: String,            // Hashed
    aadharFile: String (URL),        // Document URL
    panNumber: String,               // Hashed
    panFile: String (URL),           // Document URL
    bankAccountNumber: String,       // Hashed
    ifscCode: String,
    bankName: String,
    accountHolderName: String,
    verificationDate: Date,
    verifiedBy: ObjectId             // Reference to admin user
  },
  
  // Contact Preferences
  notificationPreferences: {
    emailNotifications: Boolean,
    smsNotifications: Boolean,
    pushNotifications: Boolean,
    orderUpdates: Boolean,
    marketingEmails: Boolean
  },
  
  // Ratings & Reviews
  rating: Number,                    // Average rating (1-5)
  totalReviews: Number,
  totalOrders: Number,
  
  // Timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto),
  lastLoginAt: Date,
  
  // Metadata
  deviceTokens: [String],            // For push notifications
  referralCode: String,              // For referral tracking
  
  // Social & Reputation
  followers: [ObjectId],             // Array of user IDs
  isPremiumMember: Boolean,
  premiumExpiryDate: Date
}
```

### Indexes
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ phone: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ accountStatus: 1 })
db.users.createIndex({ farmName: 1 })
db.users.createIndex({ "address.city": 1 })
db.users.createIndex({ kycStatus: 1 })
```

---

## 2. Crop Collection

### Purpose
Stores all crop/product listings by farmers

### Schema

```javascript
{
  _id: ObjectId,
  
  // Ownership
  farmerId: ObjectId (ref: User),    // Reference to farmer
  
  // Crop Information
  name: String (required),           // e.g., "Organic Tomatoes"
  category: String (enum),           // e.g., "vegetables" | "fruits" | "grains"
  description: String,               // Detailed description
  tags: [String],                    // e.g., ["organic", "pesticide-free", "fresh"]
  
  // Quantity & Pricing
  quantity: Number,                  // Initial stock
  quantityUnit: Enum,                // "kg" | "ton" | "bunch" | "box"
  pricePerUnit: Number,              // Base price
  currency: String (default: "INR"),
  discount: {
    type: Enum,                      // "percentage" | "fixed"
    value: Number
  },
  finalPrice: Number,                // Price after discount
  
  // Specifications
  harvestDate: Date,                 // When crop was harvested
  expiryDate: Date,                  // Best before date
  quality: {
    grade: String,                   // "A" | "B" | "C"
    certifications: [String],        // ["organic", "fssai"]
    isOrganic: Boolean
  },
  
  // Images & Media
  images: [String],                  // Array of Cloudinary URLs (max 5)
  thumbnailImage: String,            // Primary image URL
  
  // Availability
  availability: {
    status: Enum,                    // "available" | "sold_out" | "coming_soon"
    minOrderQuantity: Number (default: 1),
    maxOrderQuantity: Number,        // Limit per order
    deliveryTimeframe: String        // e.g., "2-3 days"
  },
  
  // Delivery Options
  deliveryModes: [
    {
      type: Enum,                    // "pickup" | "delivery"
      location: String,              // For pickup
      additionalCost: Number,        // For delivery
      distance: Number               // In km
    }
  ],
  
  // Location
  location: {
    farmName: String,
    latitude: Number,
    longitude: Number,
    city: String,
    state: String,
    pincode: String,
    distance: Number                 // From buyer's location (calculated)
  },
  
  // Ratings & Reviews
  averageRating: Number,             // 1-5 stars
  totalReviews: Number,
  totalSold: Number,                 // Quantity sold
  
  // Visibility & Status
  isActive: Boolean (default: true),
  isApproved: Boolean (default: false), // Admin approval required
  approvedBy: ObjectId (ref: User),  // Admin who approved
  approvalDate: Date,
  
  // Moderation
  flaggedForReview: Boolean,
  flagReason: String,
  moderationStatus: Enum,            // "approved" | "pending" | "rejected"
  
  // Marketing
  isFeatured: Boolean,
  featuredUntil: Date,
  
  // Analytics
  views: Number (default: 0),
  clicks: Number (default: 0),
  completePurchaseRate: Number,     // Percentage
  
  // Batch/Lot Management
  batchNumber: String,
  lotNumber: String,
  
  // Timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto),
  deletedAt: Date                    // Soft delete
}
```

### Indexes
```javascript
db.crops.createIndex({ farmerId: 1 })
db.crops.createIndex({ category: 1 })
db.crops.createIndex({ name: 1, "text" })
db.crops.createIndex({ "location.city": 1 })
db.crops.createIndex({ isActive: 1, isApproved: 1 })
db.crops.createIndex({ pricePerUnit: 1 })
db.crops.createIndex({ "location.latitude": 1, "location.longitude": 1 })
db.crops.createIndex({ createdAt: -1 })
```

---

## 3. Order Collection

### Purpose
Stores all purchase orders

### Schema

```javascript
{
  _id: ObjectId,
  
  // Order Identification
  orderNumber: String (unique),      // e.g., "ORD-2024-001234"
  
  // Involved Parties
  buyerId: ObjectId (ref: User),
  farmerId: ObjectId (ref: User),
  
  // Order Items
  items: [
    {
      cropId: ObjectId (ref: Crop),
      cropName: String,
      quantity: Number,
      quantityUnit: String,
      pricePerUnit: Number,
      itemTotal: Number,
      notes: String                  // Special requests
    }
  ],
  
  // Pricing
  subtotal: Number,
  taxAmount: Number,
  deliveryCharge: Number (default: 0),
  discountAmount: Number,
  totalAmount: Number,
  currency: String (default: "INR"),
  paymentMethod: Enum,               // "card" | "upi" | "wallet" | "netbanking"
  
  // Delivery Details
  deliveryAddress: {
    name: String,
    phone: String,
    streetAddress: String,
    area: String,
    city: String,
    state: String,
    pincode: String,
    latitude: Number,
    longitude: Number,
    deliveryInstructions: String
  },
  
  deliveryMode: Enum,                // "pickup" | "delivery"
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  
  // Order Status
  status: Enum,                      // "pending" | "accepted" | "shipped" | "delivered" | "completed" | "cancelled" | "rejected"
  
  // Timeline
  timeline: [
    {
      status: String,
      timestamp: Date,
      description: String,
      updatedBy: ObjectId            // Admin/Farmer/System
    }
  ],
  
  // Payment Information
  payment: {
    status: Enum,                    // "pending" | "completed" | "failed" | "refunded"
    transactionId: String,
    transactionDate: Date,
    paymentGateway: String,          // "razorpay" | "stripe"
    refundAmount: Number,
    refundReason: String,
    refundDate: Date
  },
  
  // Fulfillment
  estimatedReadyDate: Date,
  actualReadyDate: Date,
  pickupCode: String,                // For pickup verification
  
  // Tracking
  trackingNumber: String,            // Logistics provider
  shippingProvider: String,          // e.g., "Delhivery"
  lastLocation: String,
  liveTrackingUrl: String,
  
  // Communication
  notes: {
    buyerNotes: String,              // Special instructions
    farmerNotes: String,             // Fulfillment notes
    adminNotes: String               // Internal notes
  },
  
  // Issues & Resolution
  hasIssue: Boolean,
  issue: {
    type: String,                    // "quality" | "damage" | "incomplete" | "delayed"
    reportedDate: Date,
    description: String,
    evidence: [String],              // URLs of photos/videos
    resolution: String,              // "refund" | "replacement" | "partial_refund"
    resolvedDate: Date,
    resolvedBy: ObjectId             // Admin ID
  },
  
  // Review Status
  canReview: Boolean,
  reviewGiven: Boolean,
  reviewId: ObjectId (ref: Review),
  
  // Cancellation
  cancellationReason: String,
  cancelledBy: Enum,                 // "buyer" | "farmer" | "admin" | "system"
  cancelledDate: Date,
  
  // Timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### Indexes
```javascript
db.orders.createIndex({ orderNumber: 1 }, { unique: true })
db.orders.createIndex({ buyerId: 1 })
db.orders.createIndex({ farmerId: 1 })
db.orders.createIndex({ status: 1 })
db.orders.createIndex({ createdAt: -1 })
db.orders.createIndex({ expectedDeliveryDate: 1 })
db.orders.createIndex({ "payment.status": 1 })
```

---

## 4. Review & Rating Collection

### Purpose
Stores crop and farmer reviews/ratings

### Schema

```javascript
{
  _id: ObjectId,
  
  // Review Identification
  orderId: ObjectId (ref: Order),    // Original order
  cropId: ObjectId (ref: Crop),
  farmerId: ObjectId (ref: User),    // Farmer being reviewed
  buyerId: ObjectId (ref: User),     // Who gave the review
  
  // Rating & Feedback
  cropRating: {
    overall: Number,                 // 1-5 stars
    quality: Number,                 // 1-5
    freshness: Number,               // 1-5
    packaging: Number,               // 1-5
    tasteQuantity: Number            // 1-5
  },
  
  farmerRating: {
    overall: Number,                 // 1-5 stars
    communication: Number,           // 1-5
    timeliness: Number,              // 1-5
    honesty: Number                  // 1-5
  },
  
  // Review Content
  title: String,                     // Short title
  comment: String,                   // Detailed review (max 1000 chars)
  photos: [String],                  // Cloudinary URLs of product photos
  
  // Review Metadata
  isVerifiedPurchase: Boolean,       // True if verified order
  helpfulCount: Number,              // Helpful votes
  unhelpfulCount: Number,            // Unhelpful votes
  reportedAsSpam: Boolean,
  isApproved: Boolean (default: false),
  
  // Response (by Farmer or Admin)
  hasResponse: Boolean,
  response: {
    text: String,
    respondedBy: ObjectId,           // Farmer ID
    respondedAt: Date
  },
  
  // Moderation
  isFlagged: Boolean,
  flagReason: String,
  moderatorNotes: String,
  
  // Timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### Indexes
```javascript
db.reviews.createIndex({ farmerId: 1 })
db.reviews.createIndex({ cropId: 1 })
db.reviews.createIndex({ buyerId: 1 })
db.reviews.createIndex({ orderId: 1 }, { unique: true })
db.reviews.createIndex({ "cropRating.overall": 1 })
db.reviews.createIndex({ createdAt: -1 })
```

---

## 5. Notification Collection

### Purpose
Stores all user notifications (order updates, alerts, etc.)

### Schema

```javascript
{
  _id: ObjectId,
  
  // Recipient
  userId: ObjectId (ref: User),
  
  // Notification Details
  type: Enum,                        // "order_update" | "new_listing" | "review" | "system"
  title: String,
  message: String,
  
  // Context
  relatedEntityType: String,         // "order" | "crop" | "user"
  relatedEntityId: ObjectId,
  
  // Status
  isRead: Boolean (default: false),
  readAt: Date,
  
  // Category
  category: Enum,                    // "order" | "message" | "alert" | "promotion"
  
  // Action
  actionUrl: String,                 // Link when user clicks notification
  
  // Delivery Channels
  channels: [
    {
      type: Enum,                    // "email" | "sms" | "push" | "in-app"
      sent: Boolean,
      sentAt: Date,
      delivered: Boolean,
      failureReason: String
    }
  ],
  
  // Priority
  priority: Enum (default: "normal"), // "high" | "normal" | "low"
  expiresAt: Date,
  
  // Timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### Indexes
```javascript
db.notifications.createIndex({ userId: 1 })
db.notifications.createIndex({ createdAt: -1 })
db.notifications.createIndex({ isRead: 1 })
db.notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index
```

---

## 6. Wishlist Collection

### Purpose
Tracks user's wishlist/saved crops

### Schema

```javascript
{
  _id: ObjectId,
  
  // Owner
  userId: ObjectId (ref: User) (unique),
  
  // Wishlist Items
  items: [
    {
      cropId: ObjectId (ref: Crop),
      cropName: String,
      farmerId: ObjectId (ref: User),
      addedAt: Date,
      notes: String                  // Personal notes
    }
  ],
  
  // Metadata
  totalItems: Number,
  lastModifiedAt: Date,
  
  // Timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### Indexes
```javascript
db.wishlists.createIndex({ userId: 1 }, { unique: true })
```

---

## 7. Category Collection

### Purpose
Stores crop categories for classification

### Schema

```javascript
{
  _id: ObjectId,
  
  name: String (unique),             // e.g., "Vegetables"
  slug: String (unique),             // e.g., "vegetables"
  description: String,
  icon: String (URL),
  image: String (URL),
  
  // Hierarchy
  parentCategoryId: ObjectId,        // For subcategories
  
  // Display
  displayOrder: Number,
  isActive: Boolean,
  
  // Statistics
  totalListings: Number,
  totalSales: Number,
  
  // Timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### Indexes
```javascript
db.categories.createIndex({ name: 1 }, { unique: true })
db.categories.createIndex({ slug: 1 }, { unique: true })
```

---

## 8. Cart Collection (Optional - can use LocalStorage)

### Purpose
Stores user shopping cart

### Schema

```javascript
{
  _id: ObjectId,
  
  userId: ObjectId (ref: User) (unique),
  
  items: [
    {
      cropId: ObjectId (ref: Crop),
      quantity: Number,
      addedAt: Date,
      notes: String
    }
  ],
  
  // Calculated on Frontend or Backend
  subtotal: Number,
  totalQuantity: Number,
  lastModifiedAt: Date,
  
  // Timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto),
  expiresAt: Date                    // Auto-clear after 30 days
}
```

### Indexes
```javascript
db.carts.createIndex({ userId: 1 }, { unique: true })
db.carts.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index
```

---

## 9. Transaction/Payment Collection (Optional)

### Purpose
Logs all payment transactions

### Schema

```javascript
{
  _id: ObjectId,
  
  orderId: ObjectId (ref: Order),
  userId: ObjectId (ref: User),
  
  transactionId: String (unique),
  
  amount: Number,
  currency: String,
  paymentMethod: String,
  paymentGateway: String,
  
  status: Enum,                      // "pending" | "success" | "failed" | "refunded"
  
  // Response from Payment Gateway
  gatewayResponse: Object,
  
  // Refund
  refundTransactionId: String,
  refundAmount: Number,
  
  // Timestamps
  initiatedAt: Date,
  completedAt: Date,
  refundedAt: Date,
  createdAt: Date (auto)
}
```

---

## 10. Analytics Collection (Optional)

### Purpose
Stores aggregated analytics data for reporting

### Schema

```javascript
{
  _id: ObjectId,
  
  date: Date,
  
  // Order Analytics
  totalOrders: Number,
  totalRevenue: Number,
  averageOrderValue: Number,
  
  // User Analytics
  newUsers: Number,
  activeUsers: Number,
  farmersCount: Number,
  buyersCount: Number,
  
  // Category Performance
  categoryPerformance: [
    {
      categoryId: ObjectId,
      categoryName: String,
      salesCount: Number,
      revenue: Number
    }
  ],
  
  // Geographic Analytics
  topCities: [
    {
      city: String,
      ordersCount: Number,
      revenue: Number
    }
  ],
  
  // Timestamps
  createdAt: Date (auto)
}
```

---

## 11. Database Relationships Map

```
User (1) ──── (Many) Crop
         ──── (Many) Order (as Buyer & Farmer)
         ──── (Many) Review (as Buyer & Farmer)
         ──── (1) Wishlist
         ──── (1) Cart
         ──── (Many) Notification

Crop (1) ──── (Many) Order
     ──── (Many) Review
     ──── Many category (Many)

Order (1) ──── (Many) Notification
      ──── (1) Review
      ──── (1) Payment

Review ──── (Referenced by) Order
```

---

## 12. Data Validation Rules

| Field | Type | Rules |
|---|---|---|
| email | String | Unique, valid email format, lowercase |
| password | String | Min 8 chars, contains uppercase, lowercase, number, special char |
| phone | String | Unique, 10 digits, must be valid format for country |
| quantity | Number | Must be > 0, integer |
| price | Number | Must be > 0, decimal up to 2 places |
| rating | Number | Integer between 1 and 5 |
| zipcode | String | Format validation per country |
| latitude | Number | Between -90 and 90 |
| longitude | Number | Between -180 and 180 |

---

## 13. Database Maintenance

### TTL (Time-To-Live) Indexes
- Cart items expire after 30 days
- Notifications expire after 1 year
- Reset tokens expire after 24 hours

### Backup Strategy
- Daily automated backups to Atlas
- 30-day retention period
- Point-in-time recovery enabled

### Indexing Strategy
- Index all foreign keys (farmerId, userId, etc.)
- Index frequently searched fields (email, phone, cropName)
- Index sort fields (createdAt, price)
- Index filter fields (status, category, city)

This schema design provides a normalized, scalable foundation for the marketplace platform.
