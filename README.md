<div align="center">

# 🌾 FaRm: Direct Farmer-to-Consumer Marketplace

**Empowering local farmers and consumers with fair prices, fresh produce, real-time transparency, and zero middlemen.**

<p>
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Node.js-Express-000000?logo=nodedotjs&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/MongoDB-8.x-47A248?logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Socket.io-4.x-010101?logo=socketdotio&logoColor=white" alt="Socket.io">
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white" alt="TailwindCSS">
</p>

</div>

---

## 📖 Overview

**FaRm** is an enterprise-grade, direct farmer-to-consumer e-commerce ecosystem. It bridges the gap between agricultural producers and end consumers by removing traditional brokers and supply-chain markups. 

The platform guarantees transparency through verified farmer KYC, real-time negotiation widgets, automated stock management with concurrency controls, stream-based Cloudinary media pipelines, and live WebSocket order tracking.

---

## ✨ Key Features

### 🛒 For Buyers
- **Produce Marketplace:** Discover fresh produce filtered by category, location, farm type, price, and eco-friendliness ratings.
- **Smart Voice Search:** Search crops using hands-free voice input with multi-language support.
- **Direct Price Negotiation:** Offer custom quotes directly to farmers through interactive negotiation widgets.
- **Real-Time Order Tracking:** Live status indicators and WebSocket alerts from order placement to delivery.
- **KYC-Protected Checkout:** Secure payment processing (Razorpay integration & Cash-on-Delivery) protected by buyer identity validation.

### 👩‍🌾 For Farmers
- **Crop Management:** Add and manage crop listings with multi-image support, custom units, and detailed agricultural specs.
- **Bulk CSV Ingestion:** Upload multiple crops simultaneously using structured CSV files with row-level validation.
- **KYC Verification Pipeline:** Upload identity and land ownership documents for verification by admin reviewers.
- **Analytics & Order Fulfillment:** Dashboard tracking revenue metrics, active buyer inquiries, and order lifecycle states.

### 🛡️ For Administrators
- **KYC Moderation Queue:** Review, approve, or reject user KYC submissions with detailed notes and automated socket notifications.
- **Platform Management:** Manage user status (activate, suspend, delete), moderate crop listings, and resolve disputes.
- **Audit Logging & Analytics:** Full system audit trail recording IP addresses, actions, administrative reasons, and performance metrics.

---

## 🏗️ System Architecture

FaRm employs a decoupled, micro-service ready architecture split into a high-performance **React 19 Frontend** and a **TypeScript Express Backend** backed by **MongoDB**.

```text
 ┌───────────────────────────────────────────────────────────────────────────────────────────┐
 │                                     CLIENT LAYER (F_1)                                    │
 │                                                                                           │
 │   React 19  ·  Vite 8  ·  TailwindCSS v4  ·  Context API  ·  Socket.io-client  ·  PWA       │
 └───────────────────────────────┬───────────────────────────────────┬───────────────────────┘
                                 │ HTTP / REST API                   │ WebSockets
                                 ▼                                   ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   API ENGINE (backend-ts)                                 │
 │                                                                                           │
 │  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
 │  │ Security Middleware: Helmet (CSP) · CORS · Rate Limiter · MongoSanitize · Zod Guard │  │
 │  └───────────────────────────────────┬─────────────────────────────────────────────────┘  │
 │                                      │                                                    │
 │  ┌───────────────────────────────────▼─────────────────────────────────────────────────┐  │
 │  │ Controller Layer: Auth · Crops · Orders · KYC Admin · Wishlist · Reviews · Uploads  │  │
 │  └───────┬───────────────────────────┬───────────────────────────┬─────────────────────┘  │
 │          │                           │                           │                        │
 │          ▼                           ▼                           ▼                        │
 │  ┌───────────────┐           ┌───────────────┐           ┌───────────────┐                │
 │  │ Cloudinary /  │           │ Outbox Worker │           │  Socket.io    │                │
 │  │ Local Storage │           │ (Email/Notif) │           │ Realtime Engine│               │
 │  └───────────────┘           └───────────────┘           └───────────────┘                │
 └──────────────────────────────────────┬────────────────────────────────────────────────────┘
                                        │ Mongoose ODM
                                        ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────────┐
 │                                    DATABASE LAYER                                         │
 │                                 MongoDB (Replica Set)                                     │
 └───────────────────────────────────────────────────────────────────────────────────────────┘
```

### Stack Breakdown

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend App** | React 19, Vite 8, TailwindCSS v4, Lucide Icons, Framer Motion |
| **State & Router** | Custom Context API (`AuthContext`, `CartContext`, `ToastContext`), Custom SPA Router |
| **Realtime & Media** | Socket.io-client, Cloudinary v2, Native Canvas & Image Optimization |
| **Backend Core** | Node.js, Express 4, TypeScript 5.5, Mongoose 8 |
| **Security & Auth** | JWT (Access & Refresh), Bcrypt, Helmet (CSP), Express Rate Limit, Mongo Sanitize |
| **Storage & Jobs** | Multer memory storage, Cloudinary buffer streaming, Local fallback storage, Background Outbox Worker |

---

## 🔒 Authentication & Security Architecture

### Authentication & Token Lifecycle

FaRm implements stateless JWT authentication paired with an automated token refresh cycle and role-based route protection.

```text
 Client (Browser)                       Backend API                     MongoDB / Storage
      │                                      │                                  │
      ├─── 1. POST /auth/login ─────────────►│                                  │
      │    (email & password)                ├── Validate user credentials ────►│
      │                                      │◄── Return user record & hash ────┤
      │                                      ├── Verify password with bcrypt    │
      │◄── 2. Return Access + Refresh JWT ───┤                                  │
      │    (Store in memory & localStorage)  │                                  │
      │                                      │                                  │
      ├─── 3. Request with Bearer Token ────►│                                  │
      │    Header: Authorization: Bearer <T> ├── Verify Access Token Signature │
      │                                      ├── Check RBAC (Buyer/Farmer/Admin)│
      │◄── 4. Return Authorized Data ────────┤                                  │
      │                                      │                                  │
      ├─── 5. Access Token Expires (401) ───►│                                  │
      ├─── 6. POST /auth/refresh-token ─────►│                                  │
      │    (Header: Bearer <RefreshToken>)   ├── Validate Refresh Secret       │
      │◄── 7. Return New Access Token ───────┤                                  │
```

### Security Safeguards

1. **Role-Based Access Control (RBAC):**
   - User roles (`buyer`, `farmer`, `admin`) are strictly enforced via middleware (`protect`, `authorize(...)`).
   - Critical operations (e.g. crop creation, order placement, document review) enforce KYC status checks (`requireKYC`).

2. **Input Validation & Sanitization:**
   - Mongo Sanitize strips malicious operators (`$`, `.`) from request payloads to prevent NoSQL injection.
   - Zod schemas validate data types before business logic execution.

3. **Content Security Policy & CORS:**
   - Helmet headers configure Strict CSP directives, restricting image sources to `'self'`, `data:`, `https://res.cloudinary.com`, and `https://images.unsplash.com`.
   - Cross-Origin Resource Policy (CORP) permits cross-origin media rendering while preventing unauthorized cross-site framing.

4. **File Upload Security & Memory Safety:**
   - Multer uses `memoryStorage()` to handle uploads in RAM.
   - Files are validated against an allowed MIME whitelist (`image/*`, `application/pdf`, etc.).
   - Images are piped via Cloudinary `upload_stream` to eliminate server disk contamination. If Cloudinary is unconfigured or unreachable, files gracefully fall back to an isolated `./uploads` storage directory.

5. **Audit Logging & Rate Limiting:**
   - Administrative actions (status changes, approvals, deletions) are recorded in `AuditLog` documents with admin ID, email, action type, resource ID, IP address, and User-Agent.
   - Route-level rate limiters protect sensitive endpoints from brute-force attempts.

---

## 🪪 KYC Verification & Moderation Pipeline

FaRm enforces mandatory identity verification for buyers and farmers to ensure platform safety.

```text
   [User Registers] ──→ [kycStatus: "not_submitted"]
                                │
                                ▼
                       User Uploads Documents
             (Gov ID, Address Proof, Land Records / Tax ID)
                                │
                                ▼
                       [kycStatus: "pending"]
                                │
                                ▼
                    Admin Review Queue Dashboard
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
          [Admin Approves]              [Admin Rejects]
                 │                             │
                 ▼                             ▼
      [kycStatus: "verified"]       [kycStatus: "rejected"]
      (Unlocks Listing / Buying)    (Stores Rejection Reason,
                                     Allows Document Re-upload)
```

1. **Submission Phase:** The user uploads required files via `uploadKYCDocuments()`. Files are processed and attached to the user's `kycDocuments` profile with `kycStatus = 'pending'`.
2. **Lockout & Persistence Sync:** Once submitted, the frontend locks document slots to prevent duplicate uploads while syncing state across sessions via `GET /auth/me`.
3. **Admin Verification:** Administrators review document previews and PDF streams via the `/admin/approvals` interface.
4. **Approval / Rejection:**
   - **Approve:** Updates status to `'verified'`, triggers real-time socket events, sends a system notification, and unlocks marketplace features.
   - **Reject:** Requires a detailed rejection reason, updates status to `'rejected'`, notifies the user, and presents the `KYCSorry` screen with resubmission instructions.

---

## 🔄 Real-Time Order Lifecycle

Order updates are synchronized across farmer and buyer dashboards in real-time using Socket.io and state-machine transitions.

```text
 ┌─────────────┐     Farmer      ┌─────────────┐    Farmer      ┌──────────────────┐
 │  Confirmed  │  ────────────►  │  Preparing  │  ───────────►  │ Ready for Pickup │
 └──────┬──────┘                 └─────────────┘                └────────┬─────────┘
        │                                                                │
        │ Buyer / Farmer Cancel                                          │ Farmer Complete
        ▼                                                                ▼
 ┌─────────────┐                                                ┌──────────────────┐
 │  Cancelled  │                                                │    Completed     │
 └─────────────┘                                                └──────────────────┘
```

- **Stock Guarantee (Concurrency):** Inventory updates utilize Version Checking / Optimistic Concurrency Control (OCC) to prevent race conditions during peak demand.
- **Cancellation Recovery:** Cancelling an active order automatically restores stock quantities to the corresponding crop listing.

---

## 🚀 Installation & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance or MongoDB Atlas URI

### 1. Clone Repository
```bash
git clone https://github.com/Susil-commits/FarmDirect.git
cd FarmDirect
```

### 2. Backend Setup (TypeScript Engine)
```bash
cd backend-ts
npm install
cp .env.example .env
```

Configure your `.env` file (see Environment Template below), then start the development server:
```bash
npm run dev
```
To verify TypeScript type safety at any time:
```bash
npm run typecheck
```

### 3. Frontend Setup
```bash
cd ../F_1
npm install
npm run dev
```
The application will launch at `http://localhost:5173`.

---

## ⚙️ Environment Configuration (`.env.example`)

Create a `.env` file in the `backend-ts/` directory based on the following template. **Do not commit actual production secrets to public repositories.**

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Database Connection
MONGODB_URI=mongodb://localhost:27017/farmdirect

# JWT Authentication Secrets (Use strong, unique keys in production)
JWT_SECRET=your_jwt_access_secret_key_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_REFRESH_EXPIRE=30d

# File Storage Configuration (Optional - falls back to local ./uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Payment Gateway (Optional - Razorpay integration)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email Services (Optional - SMTP Notifications)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@farmdirect.com
ADMIN_EMAIL=admin@farmdirect.com
```

---

## 📂 Repository Structure

```text
FaRm/
├── backend-ts/                   # TypeScript Node.js & Express API Server
│   ├── src/
│   │   ├── config/               # DB, Cloudinary, Env & Storage configs
│   │   ├── controllers/          # Business logic (Auth, Crops, Orders, Admin)
│   │   ├── middleware/           # Auth guards, Rate limiters, Uploads, Cache
│   │   ├── models/               # Mongoose Schemas (User, CropListing, Order)
│   │   ├── routes/               # Express Route Definitions
│   │   ├── services/             # Admin, Payment & File Upload Services
│   │   ├── socket/               # Socket.io connection & event handlers
│   │   ├── types/                # TypeScript Interfaces & Enums
│   │   └── utils/                # Circuit Breaker, Logger, Outbox Worker
│   ├── package.json
│   └── tsconfig.json
│
├── F_1/                          # React 19 Frontend Application
│   ├── src/
│   │   ├── components/           # UI Components (Landing, Dashboard, Modals)
│   │   ├── context/              # React Context (Auth, Cart, Realtime, Toast)
│   │   ├── hooks/                # Custom React Hooks
│   │   ├── pages/                # Page Views (Marketplace, Dashboards, KYC)
│   │   ├── services/             # Axios API Client & Upload Service
│   │   └── utils/                # Formatters, Constants & Image Handlers
│   ├── package.json
│   └── vite.config.js
│
├── docs/                         # Extended System & Architecture Documentation
│   ├── API_SPECIFICATION.md
│   ├── DATABASE_SCHEMA.md
│   ├── SYSTEM_ARCHITECTURE.md
│   └── VERIFICATION_FLOW_DOCUMENTATION.md
└── README.md
```

---

## 📚 Technical Documentation

Additional technical reference guides are available in the [`docs/`](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docs) directory:
- 📄 [API Specification](docs/API_SPECIFICATION.md)
- 🏗️ [System Architecture & Security Details](docs/SYSTEM_ARCHITECTURE.md)
- 🗄️ [Database Schema & Data Models](docs/DATABASE_SCHEMA.md)
- 🔐 [Verification Flow Documentation](docs/VERIFICATION_FLOW_DOCUMENTATION.md)

---

## 📄 License

This project is licensed under the ISC License.

<div align="center">
  <b>FaRm Direct — Direct from local farms to your doorstep.</b>
</div>
