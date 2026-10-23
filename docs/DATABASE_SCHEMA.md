# 🍃 FarmDirect Database Schema Design: MongoDB Collections

[![MongoDB](https://img.shields.io/badge/MongoDB-7.x_Replica_Set-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/ODM-Mongoose_8.x-880000?style=for-the-badge&logo=mongoose&logoColor=white)](https://mongoosejs.com/)
[![Transactions](https://img.shields.io/badge/Transactions-ACID_Multi--Document-blue?style=for-the-badge)](https://www.mongodb.com/docs/manual/core/transactions/)
[![Index](https://img.shields.io/badge/Indexes-2dsphere_+_Compound-orange?style=for-the-badge)](https://www.mongodb.com/docs/manual/indexes/)

> Exhaustive database schema architecture for FarmDirect. Contains 22 strongly-typed Mongoose schemas implementing WiredTiger row-level locking, atomic inventory decrement constraints, geospatial indexing, and the Transactional Outbox pattern.

---

## 📑 Collection Directory (22 Schemas)

| # | Collection / Model | Description | Primary Indexes |
| :-: | :--- | :--- | :--- |
| **01** | [`User`](#1-user-collection) | User identities (Farmers, Buyers, Admins, KYC) | `{ email: 1 }` (unique), `{ phone: 1 }`, `{ role: 1 }` |
| **02** | [`CropListing`](#2-croplisting-collection) | Crop catalog, inventory stock, geospatial coordinates | `{ seller: 1 }`, `{ location: "2dsphere" }`, `{ status: 1 }` |
| **03** | [`Order`](#3-order-collection) | Purchase orders, escrow status, delivery OTP | `{ buyer: 1 }`, `{ seller: 1 }`, `{ status: 1 }` |
| **04** | [`Negotiation`](#4-negotiation-collection) | Bilateral counter-offer rounds & fair price bands | `{ crop: 1 }`, `{ buyer: 1 }`, `{ seller: 1 }`, `{ status: 1 }` |
| **05** | [`OutboxEvent`](#5-outboxevent-collection) | Transactional outbox records for event publishing | `{ processed: 1, createdAt: 1 }`, `{ aggregateId: 1 }` |
| **06** | [`PriceSnapshot`](#6-pricesnapshot-collection) | Historical APMC mandi benchmark pricing & corridors | `{ cropName: 1, region: 1, date: -1 }` |
| **07** | [`IdempotencyKey`](#7-idempotencykey-collection) | 24-hour request deduplication and response cache | `{ key: 1 }` (unique), `{ expiresAt: 1 }` (TTL) |
| **08** | [`AiConversation`](#8-aiconversation-collection) | AgriBot chat threads and multi-turn turns | `{ userId: 1, updatedAt: -1 }` |
| **09** | [`AiUsage`](#9-aiusage-collection) | Daily AI token metrics and rate-limiting limits | `{ userId: 1, date: 1 }` |
| **10** | [`Cart`](#10-cart-collection) | Active shopping carts per user | `{ user: 1 }` (unique) |
| **11** | [`Coupon`](#11-coupon-collection) | Promotional discounts, minimum caps, and expirations | `{ code: 1 }` (unique), `{ expiresAt: 1 }` |
| **12** | [`ContactQuery`](#12-contactquery-collection) | Support tickets, categories, and resolution logs | `{ status: 1 }`, `{ createdAt: -1 }` |
| **13** | [`Review`](#13-review-collection) | Verified buyer reviews and farmer ratings | `{ crop: 1 }`, `{ reviewer: 1 }` |
| **14** | [`Message`](#14-message-collection) | P2P direct messages between buyers and farmers | `{ conversation: 1 }`, `{ createdAt: 1 }` |
| **15** | [`Notification`](#15-notification-collection) | Real-time in-app alerts and delivery triggers | `{ recipient: 1, isRead: 1, createdAt: -1 }` |
| **16** | [`AuditLog`](#16-auditlog-collection) | Security audit trail, KYC changes, admin actions | `{ actorId: 1 }`, `{ action: 1 }`, `{ timestamp: -1 }` |
| **17** | [`EventLog`](#17-eventlog-collection) | System domain telemetry and operational events | `{ eventType: 1 }`, `{ timestamp: -1 }` |
| **18** | [`RevokedToken`](#18-revokedtoken-collection) | Blacklisted JWT refresh token family IDs | `{ tokenHash: 1 }` (unique), `{ expiresAt: 1 }` (TTL) |
| **19** | [`SalesDaily`](#19-salesdaily-collection) | Aggregated daily GMV and regional crop sales | `{ date: 1, region: 1 }` |
| **20** | [`UserOrderStats`](#20-userorderstats-collection) | Historical order volume and COD cancellation profile | `{ userId: 1 }` (unique) |
| **21** | [`Wishlist`](#21-wishlist-collection) | Saved favorite crop listings | `{ user: 1 }` (unique) |
| **22** | [`Embedding`](#22-embedding-collection) | Vector embeddings for semantic search & RAG | `{ entityId: 1, entityType: 1 }` |

---

## 1. User Collection

Stores all user identities with role-based attributes and KYC records:

```typescript
{
  _id: ObjectId,
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['farmer', 'buyer', 'admin'], default: 'buyer' },
  avatar: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  kyc: {
    status: { type: String, enum: ['unsubmitted', 'pending', 'approved', 'rejected'], default: 'unsubmitted' },
    aadhaarNumberMasked: { type: String }, // e.g. "XXXXXXXX4291"
    panNumberMasked: { type: String },     // e.g. "XXXXX1234F"
    documentUrls: [{ type: String }],
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewerId: { type: ObjectId, ref: 'User' },
    rejectionReason: { type: String }
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    address: { type: String },
    district: { type: String },
    state: { type: String },
    pincode: { type: String }
  },
  farmerProfile: {
    farmName: { type: String },
    farmSizeAcres: { type: Number },
    primaryCrops: [{ type: String }],
    bankAccount: {
      accountNumberMasked: { type: String },
      ifscCode: { type: String },
      bankName: { type: String }
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

---

## 2. CropListing Collection

Stores agricultural crop listings with geospatial indexing and inventory counters:

```typescript
{
  _id: ObjectId,
  seller: { type: ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  category: { 
    type: String, 
    enum: ['vegetables', 'fruits', 'grains', 'pulses', 'spices', 'oilseeds'], 
    required: true, 
    index: true 
  },
  variety: { type: String, trim: true },
  description: { type: String, required: true },
  pricePerKg: { type: Number, required: true, min: 0 },
  quantityAvailable: { type: Number, required: true, min: 0 }, // Decremented atomically
  minimumOrderQuantity: { type: Number, default: 1 },
  unit: { type: String, default: 'kg' },
  images: [{ type: String, required: true }],
  harvestDate: { type: Date, required: true },
  isOrganic: { type: Boolean, default: false },
  qualityGrade: { type: String, enum: ['A', 'B', 'C'], default: 'A' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
    address: { type: String }
  },
  status: { type: String, enum: ['active', 'sold_out', 'paused', 'archived'], default: 'active', index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```
* **Geospatial Index:** `location: "2dsphere"`

---

## 3. Order Collection

Maintains purchase orders and escrow state transitions:

```typescript
{
  _id: ObjectId,
  orderNumber: { type: String, required: true, unique: true },
  buyer: { type: ObjectId, ref: 'User', required: true, index: true },
  seller: { type: ObjectId, ref: 'User', required: true, index: true },
  items: [{
    crop: { type: ObjectId, ref: 'CropListing', required: true },
    cropName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true },
  paymentStatus: { 
    type: String, 
    enum: ['unpaid', 'paid', 'escrow_held', 'released_to_farmer', 'refunded'], 
    default: 'unpaid' 
  },
  orderStatus: { 
    type: String, 
    enum: ['pending', 'accepted', 'preparing', 'shipped', 'delivered', 'cancelled', 'disputed'], 
    default: 'pending',
    index: true 
  },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  deliveryOtp: { type: String }, // 6-digit delivery verification OTP
  trackingTimeline: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String }
  }],
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  createdAt: { type: Date, default: Date.now, index: true }
}
```

---

## 4. Negotiation Collection

Stores bilateral counter-offer rounds and price corridor boundaries:

```typescript
{
  _id: ObjectId,
  crop: { type: ObjectId, ref: 'CropListing', required: true, index: true },
  buyer: { type: ObjectId, ref: 'User', required: true, index: true },
  seller: { type: ObjectId, ref: 'User', required: true, index: true },
  originalPricePerKg: { type: Number, required: true },
  currentProposedPricePerKg: { type: Number, required: true },
  quantity: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['open', 'countered', 'accepted', 'rejected', 'expired'], 
    default: 'open',
    index: true 
  },
  fairPriceCorridor: {
    p25: { type: Number },
    median: { type: Number },
    p75: { type: Number }
  },
  rounds: [{
    sender: { type: ObjectId, ref: 'User', required: true },
    proposedPrice: { type: Number, required: true },
    message: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
}
```

---

## 5. OutboxEvent Collection

Powers the Transactional Outbox Pattern to guarantee event delivery:

```typescript
{
  _id: ObjectId,
  aggregateId: { type: String, required: true, index: true },
  aggregateType: { type: String, required: true }, // e.g. "Order", "Negotiation"
  eventType: { type: String, required: true },     // e.g. "ORDER_CREATED", "PAYMENT_CONFIRMED"
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  processed: { type: Boolean, default: false, index: true },
  processedAt: { type: Date },
  retryCount: { type: Number, default: 0 },
  lastError: { type: String },
  createdAt: { type: Date, default: Date.now, index: true }
}
```
* **Compound Polling Index:** `{ processed: 1, createdAt: 1 }`

---

## 6. PriceSnapshot Collection

Maintains APMC mandi daily commodity pricing benchmarks:

```typescript
{
  _id: ObjectId,
  cropName: { type: String, required: true, index: true },
  category: { type: String, required: true },
  region: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  minPrice: { type: Number, required: true },
  maxPrice: { type: Number, required: true },
  modalPrice: { type: Number, required: true },
  volumeQuintals: { type: Number, default: 0 }
}
```
* **Compound Index:** `{ cropName: 1, region: 1, date: -1 }`

---

## 7. IdempotencyKey Collection

Ensures exact-once execution and protects against network double-taps:

```typescript
{
  _id: ObjectId,
  key: { type: String, required: true, unique: true },
  userId: { type: ObjectId, ref: 'User', required: true },
  requestPath: { type: String, required: true },
  requestBodyHash: { type: String, required: true },
  responseStatusCode: { type: Number },
  responseBody: { type: mongoose.Schema.Types.Mixed },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB TTL Index
  createdAt: { type: Date, default: Date.now }
}
```

---

## 8. AiConversation & AiUsage Collections

Manages conversational state and token usage for AgriBot:

```typescript
// AiConversation
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'User', required: true, index: true },
  language: { type: String, default: 'en' },
  turns: [{
    role: { type: String, enum: ['user', 'model', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  updatedAt: { type: Date, default: Date.now, index: true }
}

// AiUsage
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // e.g. "2026-10-23"
  tokenCount: { type: Number, default: 0 },
  queryCount: { type: Number, default: 0 }
}
```

---

## 9. Transactional Invariants & ACID Integrity

### Zero-Oversell Decrement Query:
```javascript
// Atomically locks the document row in WiredTiger and guarantees quantity available
db.croplistings.findOneAndUpdate(
  { _id: ObjectId("..."), quantityAvailable: { $gte: requestedQty } },
  { $inc: { quantityAvailable: -requestedQty } },
  { returnDocument: "after" }
);
```

### Multi-Document Atomicity:
All order placements, inventory reductions, and outbox event insertions execute inside:
```javascript
const session = await mongoose.startSession();
session.withTransaction(async () => {
  // 1. Decrement crop stock
  // 2. Insert order record
  // 3. Insert outbox event
});
```
