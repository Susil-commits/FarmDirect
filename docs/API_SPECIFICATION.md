# 🔌 FarmDirect RESTful API Specification

[![API Version](https://img.shields.io/badge/API_Version-v2.0_TypeScript-blue?style=for-the-badge)](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docs/API_SPECIFICATION.md)
[![Base URL](https://img.shields.io/badge/Endpoint-%2Fapi-success?style=for-the-badge)](https://farmdirect-backend.onrender.com/api)
[![Security](https://img.shields.io/badge/Security-Timing--Safe_%7C_Zod_Validated-brightgreen?style=for-the-badge)](https://github.com/Susil-commits/FarmDirect)

> Complete contract and integration specification for the FarmDirect Backend API. All endpoints are strongly typed, validated using Zod, protected with CSRF/Rate-limiting middleware, and return standardized JSON envelopes.

---

## 📑 Table of Contents
1. [General Protocols & Base URLs](#1-general-protocols--base-urls)
2. [Standard Response Envelopes](#2-standard-response-envelopes)
3. [Authentication & Session Headers](#3-authentication--session-headers)
4. [API Endpoints Overview](#4-api-endpoints-overview)
   - [Health & Diagnostics](#41-health--diagnostics)
   - [Authentication & Identity](#42-authentication--identity)
   - [Crops & Marketplace Catalog](#43-crops--marketplace-catalog)
   - [Atomic Orders & Checkout](#44-atomic-orders--checkout)
   - [Bilateral Negotiations](#45-bilateral-negotiations)
   - [Multimodal AI & Agronomy](#46-multimodal-ai--agronomy)
   - [Payments & Webhooks](#47-payments--webhooks)
   - [Shopping Cart](#48-shopping-cart)
   - [Farmer Dashboard](#49-farmer-dashboard)
   - [Admin & KYC Moderation](#410-admin--kyc-moderation)
   - [Reviews, Messaging & Notifications](#411-reviews-messaging--notifications)
   - [Transactional Outbox Events](#412-transactional-outbox-events)
5. [Standard Error Codes Matrix](#5-standard-error-codes-matrix)

---

## 1. General Protocols & Base URLs

* **Development Base URL:** `http://localhost:5000/api`
* **Production Base URL:** `https://farmdirect-backend.onrender.com/api`
* **Transport:** HTTPS / TLS 1.3 (Production), HTTP (Local Dev)
* **WebSocket Ingress:** `wss://farmdirect-backend.onrender.com`

---

## 2. Standard Response Envelopes

### 2.1 Success Envelope
```json
{
  "success": true,
  "status": 200,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "requestId": "req_a9f82d01",
    "timestamp": "2026-10-23T10:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalRecords": 85,
      "totalPages": 5
    }
  }
}
```

### 2.2 Error Envelope
```json
{
  "success": false,
  "status": 400,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "quantity",
        "message": "Quantity must be greater than zero"
      }
    ]
  },
  "meta": {
    "requestId": "req_b72c918a",
    "timestamp": "2026-10-23T10:00:00.000Z"
  }
}
```

---

## 3. Authentication & Session Headers

| Header | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `Authorization` | Protected routes | Bearer JWT access token (15-min TTL) | `Bearer eyJhbGciOi...` |
| `Idempotency-Key` | Mutation routes | UUIDv4 to eliminate duplicate charges | `c7b508f9-1582-4bf1-a8cf-326ef3fba61a` |
| `X-Request-Id` | Optional | Client correlation ID for audit tracing | `req_client_9941` |
| `Content-Type` | JSON routes | Payload MIME type | `application/json` |

---

## 4. API Endpoints Overview

### 4.1 Health & Diagnostics

#### `GET /api/health`
Returns quick liveness indicator.
* **Access:** Public
* **Response (200):**
  ```json
  {
    "status": "ok",
    "message": "Server is healthy",
    "timestamp": "2026-10-23T10:00:00.000Z"
  }
  ```

#### `GET /api/health/detailed`
Deep diagnostic check including MongoDB replica ping latency and Redis memory status.
* **Access:** Admin only
* **Response (200):**
  ```json
  {
    "status": "ok",
    "uptime": 84210,
    "services": {
      "database": { "status": "connected", "latencyMs": 3 },
      "redis": { "status": "connected", "latencyMs": 1 }
    }
  }
  ```

---

### 4.2 Authentication & Identity

#### `POST /api/auth/register`
Creates a new Farmer or Buyer account.
* **Access:** Public
* **Request Body:**
  ```json
  {
    "firstName": "Suresh",
    "lastName": "Patel",
    "email": "suresh@example.com",
    "phone": "9876543210",
    "password": "StrongPassword123!",
    "role": "farmer"
  }
  ```
* **Response (201):** Returns user profile with authentication token.

#### `POST /api/auth/login`
Authenticates credentials and establishes session.
* **Access:** Public
* **Request Body:**
  ```json
  {
    "email": "farmer1@farmdirect.local",
    "password": "password123"
  }
  ```
* **Response (200):** Returns user object, sets HTTP-only refresh cookie, returns 15-minute access token.

#### `POST /api/auth/refresh-token`
Rotates refresh token and returns a fresh access token. Uses Redis JTI blacklist to detect replay attacks.

#### `POST /api/auth/logout`
Invalidates active refresh token in Redis and clears HTTP-only cookie.

---

### 4.3 Crops & Marketplace Catalog

#### `GET /api/crops`
List approved crops with advanced multi-faceted filtering and geospatial search.
* **Access:** Public
* **Query Parameters:**
  * `category` (string, e.g. `vegetables`, `fruits`, `grains`, `pulses`)
  * `minPrice` / `maxPrice` (number)
  * `isOrganic` (boolean)
  * `latitude`, `longitude`, `maxDistanceKm` (geospatial `2dsphere` discovery)
  * `search` (text search against crop name and variety)
  * `page`, `limit` (pagination)

#### `POST /api/crops`
Lists a new crop harvest on the marketplace.
* **Access:** Farmer only
* **Request Body:**
  ```json
  {
    "name": "Organic Tomatoes",
    "category": "vegetables",
    "variety": "Desi",
    "pricePerKg": 32.50,
    "quantityAvailable": 250,
    "harvestDate": "2026-10-22",
    "isOrganic": true,
    "images": ["https://res.cloudinary.com/.../tomato.jpg"],
    "location": {
      "type": "Point",
      "coordinates": [85.8245, 20.2961],
      "address": "Pipili, Puri, Odisha"
    }
  }
  ```

---

### 4.4 Atomic Orders & Checkout

#### `POST /api/orders`
Executes single-phase atomic reservation inside a MongoDB ACID transaction.
* **Access:** Buyer only
* **Headers:** `Idempotency-Key: <UUID>`
* **Request Body:**
  ```json
  {
    "cropId": "653b1...81a",
    "quantity": 15,
    "paymentMethod": "razorpay",
    "deliveryAddress": {
      "street": "Plot 42, Saheed Nagar",
      "city": "Bhubaneswar",
      "state": "Odisha",
      "pincode": "751007"
    }
  }
  ```
* **Response (201):** Order details and Razorpay `order_id` for client modal checkout.
* **Error (400):** Returns `INSUFFICIENT_STOCK` if available stock is depleted.

#### `GET /api/orders/:id`
Retrieves comprehensive order details, delivery OTP, and audit timeline.

#### `PUT /api/orders/:id/status`
Updates order state machine (Pending → Accepted → Shipped → Delivered). Farmer/Admin only.

---

### 4.5 Bilateral Negotiations

#### `POST /api/negotiations`
Initiates a structured bilateral counter-offer round for a crop listing.
* **Access:** Buyer only
* **Request Body:**
  ```json
  {
    "cropId": "653b1...81a",
    "proposedPricePerKg": 28.00,
    "quantity": 50,
    "message": "Looking to buy 50kg for our community kitchen."
  }
  ```

#### `POST /api/negotiations/:id/counter`
Submits a counter-offer in response.
* **Access:** Farmer or Buyer involved in negotiation
* **Request Body:**
  ```json
  {
    "counterPricePerKg": 30.00,
    "notes": "Best I can do for freshly picked crop today."
  }
  ```

#### `POST /api/negotiations/:id/accept`
Accepts the active offer, locking the agreed price and unlocking checkout.

---

### 4.6 Multimodal AI & Agronomy

#### `POST /api/ai/chat`
Conversational advisory with AgriBot (Google Gemini 3.5 Flash Lite + verified local agronomy RAG).
* **Access:** Public or Authenticated
* **Request Body:**
  ```json
  {
    "message": "ଟମାଟୋ ଗଛରେ ପତ୍ର ହଳଦିଆ ପଡ଼ିଯାଉଛି, କ'ଣ ପ୍ରତିକାର କରିବି?",
    "lang": "od",
    "conversationId": "ai_conv_9941"
  }
  ```
* **Response (200):**
  ```json
  {
    "reply": "ଏହା ସମ୍ଭବତଃ ଯବକ୍ଷାରଜାନର ଅଭାବ କିମ୍ବା ମୂଳ କୋରଡ଼ା ରୋଗ ହୋଇପାରେ...",
    "suggestedActions": ["ଯାଞ୍ଚ କରନ୍ତୁ ପତ୍ର ତଳଭାଗ", "ନିମ୍ନଲିଖିତ ଜୈବିକ ଖତ ପ୍ରୟୋଗ କରନ୍ତୁ"],
    "groundedSource": "Odisha Agri Extension Handbook 2026"
  }
  ```

#### `POST /api/ai/listing-draft`
Smart Vision produce auto-detection. Ingests crop photo and drafts listing details.
* **Request Body:** `{ "imageUrl": "https://..." }` or `{ "imageBase64": "..." }`
* **Response (200):**
  ```json
  {
    "cropName": "Tomato",
    "variety": "Desi Organic",
    "qualityGrade": "A",
    "suggestedPrice": 32.0,
    "priceCorridor": { "p25": 28.0, "median": 32.0, "p75": 36.0 },
    "detectedFreshness": "92%",
    "looksLikeProduce": true
  }
  ```

#### `GET /api/ai/price-forecast`
Returns 14-day rolling price predictions with 80% confidence bands from the Python ML service.
* **Query:** `cropName=Tomato&region=Odisha&days=14`

---

### 4.7 Payments & Webhooks

#### `POST /api/payments/create-order`
Initializes a server-to-server Razorpay order with cryptographic order tracking.

#### `POST /api/payments/verify`
Validates client signature after modal payment completion.

#### `POST /api/payments/webhook`
Asynchronous webhook listener for background payment transitions.
* **Access:** Razorpay Gateway (Signature verified via `crypto.timingSafeEqual`)
* **Header:** `X-Razorpay-Signature: <hmac-sha256>`

---

### 4.8 Shopping Cart

* `GET /api/cart`: Fetches current buyer's cart with live stock checks.
* `POST /api/cart/items`: Adds item to cart with quantity validation.
* `PUT /api/cart/items/:id`: Updates item quantity.
* `DELETE /api/cart/items/:id`: Removes item from cart.
* `DELETE /api/cart`: Clears cart contents.

---

### 4.9 Farmer Dashboard

* `GET /api/farmer/stats`: Aggregates active listings, pending orders, and total earnings.
* `GET /api/farmer/orders`: Lists incoming purchase orders with fulfillment filters.
* `GET /api/farmer/negotiations`: Active bilateral negotiation requests.

---

### 4.10 Admin & KYC Moderation

* `GET /api/admin/kyc/pending`: Queue of farmer document submissions awaiting review.
* `PUT /api/admin/kyc/:userId/approve`: Approves farmer credentials and unlocks selling privileges.
* `PUT /api/admin/kyc/:userId/reject`: Rejects submission with specific reason string.
* `GET /api/admin/anomalies`: Flagged COD orders and price dumping/gouging events.
* `GET /api/admin/analytics`: Platform-wide GMV, daily volume, and user acquisition metrics.

---

### 4.11 Reviews, Messaging & Notifications

* `POST /api/reviews`: Verified buyer review creation (only allowed for completed orders).
* `GET /api/reviews/crop/:cropId`: Lists paginated crop reviews and aggregate score.
* `GET /api/messages/:conversationId`: P2P buyer-farmer message history.
* `POST /api/messages`: Sends direct P2P message.
* `GET /api/notifications`: Retrieves user notifications.
* `PUT /api/notifications/:id/read`: Marks notification as read.

---

### 4.12 Transactional Outbox Events

* `GET /api/events/outbox`: Inspects outbox queue status and unprocessed event count.
* `POST /api/events/sweep`: Triggers manual outbox sweep runner (Admin / Worker).

---

## 5. Standard Error Codes Matrix

| HTTP Status | Error Code | Description |
| :---: | :--- | :--- |
| **400** | `VALIDATION_ERROR` | Request payload failed Zod schema checks. |
| **400** | `INSUFFICIENT_STOCK` | Requested quantity exceeds available inventory. |
| **401** | `UNAUTHORIZED` | Missing, expired, or invalid JWT access token. |
| **403** | `FORBIDDEN` | Role lack privileges for the requested resource. |
| **404** | `RESOURCE_NOT_FOUND` | Crop, order, user, or negotiation ID does not exist. |
| **409** | `IDEMPOTENCY_CONFLICT` | Request with identical `Idempotency-Key` is already in flight. |
| **429** | `RATE_LIMIT_EXCEEDED` | Request threshold exceeded; client must back off. |
| **500** | `INTERNAL_SERVER_ERROR`| Unhandled server exception with tracked `requestId`. |
