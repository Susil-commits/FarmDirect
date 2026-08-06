<div align="center">

# 🌾 FaRm

### Direct Farmer → Consumer Marketplace

**Zero middlemen. Fair prices. Fresh produce.**

<p>
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/MongoDB-8.x-47A248?logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/i18n-React--i18next-009688?logo=react&logoColor=white" alt="i18n">
  <img src="https://img.shields.io/badge/Leaflet-Maps-199900?logo=leaflet&logoColor=white" alt="Maps">
  <img src="https://img.shields.io/badge/License-ISC-blue" alt="License">
</p>

<p>
  <sub><b>Buy directly from local farmers.</b> No middlemen markup, no commission.<br>
  Certified farmers listing their produce — buyers get fresh crops at fair prices.</sub>
</p>

---

</div>

## Table of Contents

- [Quick Start](#-quick-start)
- [Architecture at a Glance](#-architecture-at-a-glance)
- [Environment Configuration](#-environment-configuration)
- [Features](#-features)
- [Order Workflow](#-order-workflow)
- [API Surface](#-api-surface)
- [TypeScript Backend Details](#-typescript-backend-details)
- [Bugs Fixed During Migration](#-bugs-fixed-during-migration)
- [Documentation](#-documentation)
- [Contributing](#-contributing)

---

## Quick Start

> **Prerequisites:** Node.js 18+, MongoDB 4.4+ (or MongoDB Atlas free tier), npm

```bash
git clone https://github.com/yourname/FaRm.git
cd FaRm
```

### 1. Backend (pick one)

```bash
# TypeScript backend — recommended, full type safety
cd backend-ts
npm install
cp .env.example .env     # fill in MONGODB_URI + JWT secrets (see below)
npm run dev              # → http://localhost:5000

# ── OR ──

# JavaScript backend — original
cd backend
npm install
cp .env.example .env
npm run dev              # → http://localhost:5000
```

### 2. Frontend (new terminal)

```bash
cd F_1
npm install
npm run dev              # → http://localhost:5173
```

### 3. Create an admin user

```bash
# Using the JS backend seed script
cd backend && npm run seed

# Or hit the test endpoint (dev only)
curl -X POST http://localhost:5000/api/admin/test/create-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@farm.local","password":"admin123","firstName":"Admin"}'
```

That's it. Open `http://localhost:5173`, register, submit KYC, and start trading.

---

## 🌟 Recent Updates (August 2026 Session)

We recently completed a major **Enterprise-Grade Master Plan** comprising 4 major epics and full core resilience upgrades:

1. **Backend & Core Resilience:** Migrated the Node.js backend to **Cluster Mode** for multi-core scaling, implemented an **LRU Cache** middleware for fast API responses, and added a full suite of **Jest/Supertest E2E tests**.
2. **Epic 1 (PWA):** Transformed the frontend into a fully installable **Progressive Web App (PWA)** using `vite-plugin-pwa`, complete with offline caching and manifest setup.
3. **Epic 2 (Multi-Language i18n):** Integrated **react-i18next** to break language barriers, featuring full English and Hindi translations with a dynamic Navbar language toggle.
4. **Epic 3 (Admin Analytics):** Supercharged the Admin Dashboard with **Recharts**, delivering beautiful interactive visualization charts for *Revenue Growth* and *Order Distribution*.
5. **Epic 4 (Live Tracking):** Integrated **React-Leaflet** maps into the Order Tracking dashboard, allowing users to view dynamic geospatial routes between the Farmer and Buyer.

---

## Architecture at a Glance

```
                    ┌─────────────────────────────────────────────────┐
                    │                   Frontend (F_1)                │
                    │      React 19 · Vite · Tailwind · PWA · i18n    │
                    │   TanStack Query · Socket.io · Leaflet · Recharts │
                    └──────────────────────┬──────────────────────────┘
                                           │  HTTP + WebSocket
                    ┌──────────────────────▼──────────────────────────┐
                    │              Backend (backend-ts)                │
                    │         Express · TypeScript · Zod · Socket.io  │
                    │                                                │
                    │  ┌─────────┐ ┌──────────┐ ┌──────────────────┐  │
                    │  │ Routes  │→│Controlers│→│   Mongoose Models │  │
                    │  │  (14)   │ │  (14)    │ │     (11 typed)    │  │
                    │  └─────────┘ └──────────┘ └────────┬─────────┘  │
                    │  ┌──────────────┐ ┌──────────────┐ │            │
                    │  │  Middleware  │ │   Utilities   │ │            │
                    │  │ Auth/Upload/ │ │ JWT/Cache/   │ │            │
                    │  │ Zod/Errors   │ │ Email/Cloud  │ │            │
                    │  └──────────────┘ └──────────────┘ │            │
                    └───────────────────────────────────┼────────────┘
                                                         │
                                           ┌─────────────▼──────────┐
                                           │     MongoDB            │
                                           │  (Atlas or localhost)  │
                                           └────────────────────────┘
```

### Two backends, one API surface

| | `backend/` (JS) | `backend-ts/` (TS) |
|---|---|---|
| Language | JavaScript (ES modules) | TypeScript 5.5 (strict) |
| Validation | express-validator | Zod schemas |
| Error handling | try/catch + errorHandler | `ApiError` class + typed handler |
| Env config | `process.env` lookups | Validated `env.ts` (fail-fast) |
| Types | None | Enums + DTOs + Express augmentation |
| Dev server | nodemon | tsx watch |
| Graceful shutdown | No | Yes (SIGTERM/SIGINT) |
| Request ID | No | Yes (`X-Request-Id` header) |
| **Same API routes?** | **Yes** | **Yes** |

Both connect to the same MongoDB database and serve the same frontend.

---

## Environment Configuration

Copy `.env.example` → `.env` in your chosen backend directory. The server **starts with zero configuration** — only `MONGODB_URI` is needed for a working dev server. Everything else is opt-in.

### Required

```env
MONGODB_URI=mongodb://localhost:27017/farmdirect
JWT_SECRET=                  # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_REFRESH_SECRET=          # different random hex — same command, new value
```

| Variable | What it does | How to get it |
|----------|-------------|---------------|
| `MONGODB_URI` | MongoDB connection string | **Local:** install [MongoDB Community](https://www.mongodb.com/try/download/community) → `mongodb://localhost:27017/farmdirect`. **Cloud:** free tier at [MongoDB Atlas](https://www.mongodb.com/atlas/database) → copy "Connect → Drivers" string |
| `JWT_SECRET` | Signs access tokens | Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Signs refresh tokens | Same command — use a **different** value |

### Optional — enable features as needed

<details>
<summary><b>Image Uploads — Cloudinary</b> (falls back to local disk automatically)</summary>

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Get all three at [cloudinary.com/console](https://cloudinary.com/console) → **Dashboard**. If any are missing, files save to `uploads/` and serve at `/uploads`.

</details>

<details>
<summary><b>Online Payments — Razorpay</b> (COD works without it)</summary>

```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

Get test keys at [dashboard.razorpay.com/app/keys](https://dashboard.razorpay.com/app/keys). If not set (or placeholder values starting with `your_`), only Cash-on-Delivery is available.

</details>

<details>
<summary><b>Email Notifications — SMTP</b> (falls back to console logging)</summary>

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password      # NOT your Gmail password — see below
SMTP_FROM=noreply@yourdomain.com
ADMIN_EMAIL=admin@farm.local
```

For Gmail: enable 2FA → generate an **App Password** at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords). Use that 16-char code as `SMTP_PASS`. If vars are missing, emails log to console in dev and are skipped in prod — KYC/contact/order flows still work.

</details>

<details>
<summary><b>Social Login — Google & GitHub OAuth</b> (email/password always works)</summary>

```env
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx
GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx
```

**Google:** [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create OAuth 2.0 Client ID → add `FRONTEND_URL/auth/google/callback` to authorized redirect URIs.
**GitHub:** [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers) → New OAuth App → callback = `FRONTEND_URL/auth/github/callback`.

</details>

<details>
<summary><b>Full .env reference</b></summary>

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/farmdirect
JWT_SECRET=
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRE=30d
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
ADMIN_EMAIL=

# Social login
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

</details>

---

### Platform Highlights

| Feature | Description |
|---------|-------------|
| **Premium Experience** | Modern glassmorphism UI, smooth scroll animations, and optimized performance (90+ Lighthouse Score) |
| **Interactive 3D UI** | Hover-responsive 3D tilt cards, dynamic micro-animations, and parallax scroll effects across the app |
| **Smart Voice Search** | Built-in Web Speech API integration for hands-free crop searching |
| **Live Activity Ticker** | Real-time global notifications showcasing community activity on the platform |
| **Eco-Score Engine** | Dynamic freshness and sustainability index calculated for every crop |
| **Real-time Engine** | WebSocket-based order tracking and instant messaging |
| **PWA Ready** | Fully installable Progressive Web App (PWA) with offline support |
| **Multilingual (i18n)** | Integrated English and Hindi localization (Hero & Navbar) |
| **Enterprise Analytics** | Advanced interactive Recharts dashboards for Admins |
| **Live Order Tracking** | Geospatial route maps powered by React-Leaflet |

### For Buyers

| Feature | Description |
|---------|-------------|
| Browse marketplace | Search/filter crops by category, price, location, rating, certification |
| Voice Search | Tap the mic icon to search for crops using your voice |
| Eco-Score | View dynamic sustainability & freshness scores for crops before buying |
| Express interest | Mark interest in a crop → farmer gets notified in real-time |
| Place orders | Cash-on-Delivery or Razorpay online payment |
| Order tracking | Real-time WebSocket status updates + timeline |
| Wishlist | Save crops for later |
| Reviews | Rate and review purchased crops |
| Recommendations | Personalized crop suggestions based on order history + wishlist |
| Messaging | Chat with farmers (requires KYC) |

### For Farmers

| Feature | Description |
|---------|-------------|
| Crop listings | Create listings with images, specs, certifications, harvest date |
| Bulk upload | CSV import for multiple crops at once |
| Interest dashboard | See all buyers interested in your crops |
| Order management | Start orders, update status, deny/reject orders |
| Analytics | Revenue trends, crop performance scores, category breakdown |
| Inventory | Low-stock alerts + configurable thresholds |
| KYC verification | Submit documents for admin verification |

### For Admins

| Feature | Description |
|---------|-------------|
| User management | Suspend/ban/reactivate users, change roles |
| KYC approval | Review and approve/reject farmer & buyer KYC submissions |
| Crop moderation | Approve/reject/freeze/delete crop listings |
| Order management | Update any order status, restore inventory on cancel |
| Coupon system | Create percentage/fixed coupons with usage limits |
| Analytics dashboard | Platform-wide stats (users, crops, orders, revenue) |
| Audit logs | Every admin action logged with before/after state |
| Announcements | Broadcast notifications to all users |
| Document review | View KYC docs, farm images, crop images per user |

---

## Order Workflow

```
  ┌─────────────┐     ┌────────────┐     ┌──────────────────┐     ┌──────────┐
  │  Confirmed  │────→│ Preparing  │────→│ Ready for Pickup │────→│ PickedUp │
  └──────┬──────┘     └─────┬──────┘     └────────┬──────────┘     └────┬─────┘
         │                  │                     │                     │
         │     ┌────────────▼──────┐               │               ┌─────▼─────┐
         │     │ can cancel anytime │              │               │ Completed │
         └────→│  (restores stock)  │←─────────────┘               └───────────┘
               └───────────────────┘
```

**Status transitions are enforced server-side** — both in the farmer/buyer controller and the admin controller. Each transition pushes a timeline entry and fires a Socket.io event + notification.

- **Buyer** marks interest → **Farmer** starts order or buyer places order → Farmer prepares → marks ready → Buyer picks up → Buyer marks received (completed)
- **Cancel** restores crop quantity and re-activates the listing
- **Completion** updates crop `dailySales` and `monthlyStats` analytics
- All transitions emit real-time WebSocket events to both parties

---

## API Surface

All routes are prefixed with `/api`. Authentication uses `Authorization: Bearer <token>` header.

| Resource | Routes | Auth |
|----------|-------|------|
| Auth | `/auth/register`, `/auth/login`, `/auth/me`, `/auth/kyc/submit`, `/auth/google/callback`, `/auth/github/callback`, `/auth/refresh-token`, `/auth/delete-account` | Mixed |
| Crops | `/crops`, `/crops/trending`, `/crops/:id`, `/crops/:id/interest`, `/crops/buyer/recommended` | Mixed |
| Orders | `/orders`, `/orders/start`, `/orders/:id/status`, `/orders/:id/cancel`, `/orders/:id/deny`, `/orders/:id/receive`, `/orders/:id/track` | Private |
| Reviews | `/reviews/:cropId`, `/reviews/crop/:cropId`, `/reviews/farmer/:farmerId` | Mixed |
| Wishlist | `/wishlist`, `/wishlist/:cropId` | Private |
| Messages | `/messages`, `/messages/conversation/:id`, `/messages/conversations`, `/messages/search` | Private + KYC |
| Notifications | `/notifications`, `/notifications/unread/count`, `/notifications/preferences` | Private |
| Contact | `/contact/submit` (public), admin CRUD | Mixed |
| Coupons | `/coupons/validate` (buyer), admin CRUD via `/admin/coupons` | Mixed |
| Payments | `/payments/razorpay/init`, `/payments/razorpay/verify`, `/payments/razorpay/failed` | Buyer |
| Farmer | `/farmer/dashboard/stats`, `/farmer/analytics/*`, `/farmer/inventory/*`, `/farmer/crops/bulk-upload` | Farmer |
| Admin | `/admin/dashboard/stats`, `/admin/users`, `/admin/kyc/*`, `/admin/crops/*`, `/admin/orders/*`, `/admin/audit-logs` | Admin |
| Data Access | `/data/crops` (public), `/data/farmer/*`, `/data/buyer/*`, `/data/admin/*` | Role-specific |
| Upload | `/api/upload` (single file), crop/KYC/profile/upload middleware | Private |
| Health | `/api/health` | Public |

Full API specification: [docs/API_SPECIFICATION.md](docs/API_SPECIFICATION.md)

---

## TypeScript Backend Details

### File count

```
backend-ts/src/
├── config/        5 files    env validation, db, cloudinary, localStorage, razorpay
├── controllers/  14 files    auth, crop, order, review, notification, message,
│                              wishlist, coupon, contact, farmer, dataAccess,
│                              payment, user, admin
├── middleware/    5 files    auth, errorHandler, validator (Zod), localUpload, requestId
├── models/       11 files    User, CropListing, Order, Review, Notification,
│                              Message, Wishlist, Coupon, Contact, ContactQuery, AuditLog
├── routes/       14 files    one per controller
├── socket/        2 files    socketManager, eventHandlers
├── types/         3 files    enums, interfaces/DTOs, Express augmentation
├── utils/         9 files    jwt, password, cache, serverTime, cloudinaryService,
│                              emailService, apiError, apiResponse, asyncHandler
└── server.ts      1 file     Express + Socket.io entry, graceful shutdown
─────────────────────────────
                  63 source files — all pass tsc --noEmit (strict mode)
```

### Commands

```bash
cd backend-ts

npm run dev          # tsx watch — hot reload
npm run typecheck    # tsc --noEmit — verify types (run after every edit)
npm run build        # compile → dist/
npm start            # node dist/server.js
```

### Type safety highlights

- **Enums** for every domain status (`UserRole`, `OrderStatus`, `KycStatus`, `CropCategory`, `PaymentMethod`, …) — compile-time exhaustiveness instead of string typos
- **Interfaces** for every Mongoose document (`IUser`, `IOrder`, `ICropListing`, …) and every DTO (`RegisterDto`, `CreateOrderDto`, …)
- **Express augmentation** — `req.user`, `req.uploadedFile`, `req.uploadedFiles` are fully typed
- **`ApiError`** class — `throw ApiError.notFound('Crop not found')` → handler sends exact 404
- **Zod validation** — `validateRequest({ body: schema })` middleware with automatic type inference
- **`env.ts`** — validated at startup, fail-fast on missing `MONGODB_URI`/`JWT_SECRET` in production

---

## Bugs Fixed During Migration

12 bugs were found by auditing the JS source against the TS port and fixed:

| # | Bug | Severity |
|---|-----|----------|
| 1 | `cropType` defaulted to `CropStatus.Active` ('active') — wrong enum, Mongoose validation failed on every crop creation | Critical |
| 2 | `getFarmerProfile` queried `status: 'completed'` instead of `orderStatus` — farmer total sales always 0 | High |
| 3 | KYC routes pointed to `getCurrentUser` instead of `submitKYCDocuments` — KYC submission silently did nothing | Critical |
| 4 | Missing `submitKYCDocuments`, `googleCallback`, `githubCallback`, `deleteAccount` — 4 API endpoints broken | Critical |
| 5 | Admin `updateOrderStatus` didn't update crop analytics (dailySales/monthlyStats) on completion | High |
| 6 | Admin `updateOrderStatus` didn't set `completedAt` or `paymentStatus` for completed orders | High |
| 7 | Admin `updateOrderStatus` didn't notify buyer/farmer about status changes | Medium |
| 8 | Admin audit log recorded new status as both previous and new (captured after change) | Medium |
| 9 | `bulkUploadCrops` function and `/crops/bulk-upload` route were missing entirely | High |
| 10 | Contact form didn't create in-app notifications (on submit or admin response) | Medium |
| 11 | `publicUser` returned `location: undefined` instead of `user.location` | Low |
| 12 | `axios` missing from `package.json` — Google/GitHub OAuth would crash | High |

---

## Recent Full-Stack Bug Fixes

An extensive audit across both the React frontend and TypeScript backend resulted in 11 critical and high-severity fixes:

| # | File | Bug Fixed | Severity |
|---|------|-----------|----------|
| 1 | `appService.js` | **Password reset**: token was in URL path → moved to request body to match backend POST route | Critical |
| 2 | `appService.js` | **Logout**: now calls backend `POST /auth/logout` to clear the HttpOnly `refreshToken` cookie | High |
| 3 | `api.js` | **Token refresh**: was returning the old expired token → now returns the new one | Critical |
| 4 | `api.js` | **Error shape**: rejection payload now always includes `.status` for consistent error handling | High |
| 5 | `api.js` / `directApi.js` | **Production logs**: debug `console.log` blocks gated behind `import.meta.env.DEV` | Medium |
| 6 | `AuthContext.jsx` | **Deleted account redirect**: `/login` → `/auth/login` (route didn't exist) | High |
| 7 | `AuthContext.jsx` | **resetPassword**: removed invalid `token`/`user` extraction (backend returns only `{success, message}`) | Medium |
| 8 | `useVoiceSearch.js` | **Stale closure**: `onResult` now read from a ref — recognition always calls the latest callback | High |
| 9 | `AdminApprovals.jsx` | **Documents panel**: `response.data` → `response` (interceptor already unwraps data) | Critical |
| 10 | `App.jsx` | Removed leading whitespace from import lines | Low |
| 11 | `authController.ts` | **`updateProfile`**: no longer sets `profilePicture: undefined` when no photo field is sent | Critical |

---

## Documentation

| Document | What it covers |
|----------|---------------|
| [Quick Start Guide](docs/QUICK_START_GUIDE.md) | User-facing getting started |
| [System Architecture](docs/SYSTEM_ARCHITECTURE.md) | Full-stack architecture overview |
| [Database Schema](docs/DATABASE_SCHEMA.md) | All 11 models + relationships |
| [API Specification](docs/API_SPECIFICATION.md) | REST endpoints with examples |
| [Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md) | React component structure |
| [COD Workflow](docs/COD_WORKFLOW_DOCUMENTATION.md) | Cash-on-Delivery payment flow |
| [Order Lifecycle](docs/ORDER_LIFECYCLE.md) | Order status state machine |
| [Verification Flow](docs/VERIFICATION_FLOW_DOCUMENTATION.md) | KYC verification system |
| [RBAC & Permissions](docs/RBAC_AND_PERMISSIONS.md) | Role-based access control |
| [Features Checklist](docs/FEATURES_CHECKLIST.md) | All implemented features |
| [Integration Guide](docs/INTEGRATION_GUIDE.md) | Frontend ↔ Backend API integration |
| [Modules & Workflows](docs/MODULES_AND_WORKFLOWS.md) | Per-module workflow documentation |
| [Deployment Guide](DEPLOYMENT.md) | Deploy to Vercel + Render |
| [Backend Setup](backend/BACKEND_SETUP.md) | JS backend detailed setup |
| [API Integration](backend/API_INTEGRATION.md) | Frontend API service guide |

---

## Contributing

```bash
# 1. Fork & clone
git checkout -b feature/your-feature

# 2. Make changes
#    For backend-ts edits, ALWAYS run typecheck after:
cd backend-ts && npm run typecheck

# 3. Commit & push
git commit -m "feat: your feature"
git push origin feature/your-feature

# 4. Open a PR
```

**Guidelines:**
- Run `npm run typecheck` in `backend-ts/` after any TypeScript edit
- Don't commit `.env` files, `node_modules/`, `dist/`, or `uploads/`
- Keep the JS and TS backends in sync — same API surface
- Follow existing code style (no comments unless asked)

---

## License

ISC — see [LICENSE](LICENSE)

---

<div align="center">

**Built for Indian farmers and consumers**

[Report a bug](https://github.com/yourname/FaRm/issues) · [Request a feature](https://github.com/yourname/FaRm/issues) · [Discussions](https://github.com/yourname/FaRm/discussions)

</div>
