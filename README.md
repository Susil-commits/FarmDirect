<div align="center">

# 🌾 FaRm: Direct Farmer-to-Consumer Marketplace

**Empowering farmers and consumers with fair prices, fresh produce, and zero middlemen.**

<p>
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Node.js-Express-000000?logo=nodedotjs&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/MongoDB-8.x-47A248?logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white" alt="Vite">
</p>

</div>

---

## 📖 Overview

**FaRm** is an enterprise-grade web application designed to connect local farmers directly with consumers. By eliminating intermediaries, farmers receive better profit margins, and buyers gain access to fresh, high-quality produce at fair prices. The platform provides a seamless, secure, and intuitive trading experience.

---

## ✨ Key Features

### For Buyers
- **Explore & Discover:** Filter fresh produce by category, price, and location.
- **Smart Voice Search:** Hands-free crop searching.
- **Eco-Score & Transparency:** View freshness and sustainability scores.
- **Real-Time Tracking:** Live WebSocket-based order tracking and status updates.
- **Secure Checkout:** Robust payment integrations with Razorpay (or Cash-on-Delivery).

### For Farmers
- **Effortless Listings:** Create and manage crop listings with rich media and specifications.
- **Inventory Management:** Low-stock alerts and bulk CSV uploads.
- **Analytics Dashboard:** Revenue trends, product performance, and buyer interest insights.
- **Order Processing:** Accept, manage, and complete orders with ease.

### For Administrators
- **Platform Governance:** Manage users, approve KYC verifications, and moderate crop listings.
- **Advanced Analytics:** Platform-wide metrics visualized with Recharts.
- **System Monitoring:** View audit logs and manage flagged transactions securely.

---

## 🏗️ System Architecture

FaRm utilizes a distributed, scalable architecture with a decoupled frontend and backend, communicating securely via REST APIs and WebSockets.

```text
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
                     │  └─────────┘ └──────────┘ └────────┬─────────┘  │
                     │  ┌──────────────┐ ┌──────────────┐ │            │
                     │  │  Middleware  │ │   Utilities   │ │            │
                     │  │ Auth/Upload  │ │ Caching/Jobs  │ │            │
                     │  └──────────────┘ └──────────────┘ │            │
                     └───────────────────────────────────┼────────────┘
                                                          │
                                            ┌─────────────▼──────────┐
                                            │        MongoDB         │
                                            └────────────────────────┘
```

### Architecture Highlights
- **Performance:** LRU Caching and Redis-backed distributed rate limiting.
- **Resilience:** Circuit Breaker pattern for third-party services (e.g., payments).
- **Concurrency Control:** Optimistic Concurrency Control (OCC) ensures zero data conflicts during inventory updates.
- **Real-time Engine:** Socket.io for live tracking and notifications.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** (Local or Atlas)

### Setup Instructions

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/yourname/FaRm.git
   cd FaRm
   ```

2. **Backend Setup (TypeScript - Recommended):**
   ```bash
   cd backend-ts
   npm install
   cp .env.example .env
   npm run dev
   ```
   *The API will be available at `http://localhost:5000`*

3. **Frontend Setup:**
   ```bash
   cd F_1
   npm install
   npm run dev
   ```
   *The application will be available at `http://localhost:5173`*

---

## ⚙️ Environment Variables

To run the platform locally, configure the `.env` file in your backend directory. Example configuration structure:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/farmdirect

# Security (JWT)
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_key

# Third-Party Integrations (Optional for Dev)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

SMTP_HOST=
SMTP_USER=
SMTP_PASS=
```
*(Note: Do not expose production secrets or API keys in public repositories.)*

---

## 🔄 Order Workflow

FaRm employs a robust state machine for order processing, ensuring clarity for all parties.

```text
  [Confirmed] ──→ [Preparing] ──→ [Ready for Pickup] ──→ [PickedUp] ──→ [Completed]
       │                                                      │
       ▼                                                      ▼
  [Cancelled] ◄───────────────────────────────────────────────┘
(Restores Stock)
```

---

## 📚 Documentation

Detailed documentation is available in the `docs/` directory:
- [API Specification](docs/API_SPECIFICATION.md)
- [System Architecture](docs/SYSTEM_ARCHITECTURE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT.md)

---

## 📄 License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

<div align="center">
  <b>Built for farmers and consumers to thrive together.</b>
</div>
