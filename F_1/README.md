# 🎨 FarmDirect Frontend: Progressive Web App (PWA)

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![i18next](https://img.shields.io/badge/i18n-English_%7C_Hindi_%7C_Odia-26A69A?style=for-the-badge&logo=i18next&logoColor=white)](https://www.i18next.com/)
[![PWA](https://img.shields.io/badge/PWA-Offline_Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel_Edge-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://farm-direct-marketplace-eta.vercel.app)

> The modern client interface for FarmDirect. Engineered with React 19, Vite, and Tailwind CSS. Built mobile-first as an offline-resilient Progressive Web App supporting real-time bilateral negotiations, interactive agronomy AI, multilingual accessibility (English, Hindi, Odia), and high-contrast rural usability.

---

## 📑 Table of Contents
1. [Key Capabilities](#-key-capabilities)
2. [Project Architecture & Directory Layout](#-project-architecture--directory-layout)
3. [Environment Setup](#-environment-setup)
4. [Getting Started Locally](#-getting-started-locally)
5. [Page Directory & User Routes](#-page-directory--user-routes)
6. [State Management & Data Fetching](#-state-management--data-fetching)
7. [Internationalization & Multilingual Support (i18n)](#-internationalization--multilingual-support-i18n)
8. [Real-Time WebSocket Integration](#-real-time-websocket-integration)
9. [Production Build & Deployment](#-production-build--deployment)

---

## 💎 Key Capabilities

* 📱 **Mobile-First PWA**: Responsive across all screen sizes, installable on mobile devices with offline asset caching and service worker synchronization.
* 🤝 **Interactive Bilateral Negotiation**: Live counter-offer interface with mandi price corridor visual bands (p25, median, p75).
* 🤖 **Multimodal AgriBot & Smart Vision**: Real-time streaming chat, photo upload for instant variety detection, and market price guidance.
* 🌐 **Trilingual Accessibility**: Full UI translation across English, Hindi (हिंदी), and Odia (ଓଡ଼ିଆ) with persistent locale preference.
* 🗺️ **Hyperlocal Discovery**: Geolocation-based farm radius filtering, sorting produce by harvest freshness and distance.
* 💳 **Unified Payment Gateway**: Seamless Razorpay checkout modal with automated fallback to risk-verified Cash on Delivery (COD).

---

## 📁 Project Architecture & Directory Layout

```
F_1/
├── src/
│   ├── assets/            # Static images, agricultural icons, illustrations
│   ├── components/        # Reusable UI components
│   │   ├── admin/         # KYC approvals, moderation, analytics widgets
│   │   ├── ai/            # AgriBot chat modal, audio visualizers, vision uploaders
│   │   ├── common/        # Buttons, Modals, Spinners, Badges, Dropdowns
│   │   ├── crops/         # CropCard, CropGrid, PriceBandSlider, FreshnessBadge
│   │   ├── layout/        # Navbar, Footer, MobileNav, Sidebar
│   │   ├── negotiation/   # Counter-offer cards, negotiation chat, round history
│   │   └── orders/        # OrderCard, TrackingTimeline, ReceiptGenerator
│   ├── config/            # API client configuration & axios interceptors
│   ├── constants/         # App routes, crop categories, status enums
│   ├── context/           # AuthContext, CartContext, SocketContext, NotificationContext
│   ├── hooks/             # Custom React hooks (useAuth, useSocket, useGeolocation, useNegotiation)
│   ├── locales/           # Translation dictionaries (en.json, hi.json, od.json)
│   ├── pages/             # 31 top-level route pages
│   │   ├── auth/          # Login, Register, ForgotPassword, RoleSelector
│   │   ├── dashboards/    # FarmerDashboard, BuyerDashboard, AdminProfile
│   │   ├── verification/  # KYC submission, PendingVerification status
│   │   ├── Marketplace.jsx# Catalog discovery with multi-faceted filtering
│   │   ├── CropDetail.jsx # Deep listing info, photo gallery, farmer reviews
│   │   ├── Checkout.jsx   # Multi-step checkout & payment selector
│   │   └── OrderTracking.jsx# Live delivery progress & OTP delivery codes
│   ├── services/          # API service endpoints (authService, cropService, orderService, aiService)
│   ├── utils/             # Formatters, currency conversion, date math, validation
│   ├── App.jsx            # Top-level router and context providers
│   ├── index.css          # Tailwind directives, custom gradients & animations
│   └── main.jsx           # App mounting & i18n initialization
├── public/                # Favicon, PWA manifest.json, service-worker.js
├── nginx.conf             # Production Nginx reverse proxy configuration
├── vite.config.js         # Vite configuration with chunk splitting & proxying
└── package.json           # Dependencies and scripts
```

---

## ⚙️ Environment Setup

Create a `.env` file in `F_1/` using `.env.example` as a template:

```ini
# Backend API Base URL
VITE_API_URL=http://localhost:5000/api

# WebSocket URL
VITE_SOCKET_URL=http://localhost:5000

# Razorpay Client Key ID
VITE_RAZORPAY_KEY_ID=rzp_test_placeholder_key

# Cloudinary Cloud Name (for direct client previews)
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
```

---

## 🚀 Getting Started Locally

```bash
# 1. Navigate to the frontend directory
cd F_1

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev

# 4. Open in browser
# Local URL: http://localhost:5173
```

### Essential NPM Scripts
* `npm run dev`: Starts the local dev server on port 5173 with hot-module replacement (HMR).
* `npm run build`: Generates an optimized production bundle in `dist/`.
* `npm run preview`: Locally previews the production build.
* `npm run lint`: Validates ESLint syntax and i18n translation key consistency.

---

## 🧭 Page Directory & User Routes

| Route | Page Component | Access Scope | Description |
| :--- | :--- | :--- | :--- |
| `/` | `Home.jsx` | Public | Hero banner, seasonal harvests, value props, statistics |
| `/marketplace` | `Marketplace.jsx` | Public | Search, distance radius, categories, mandi price bands |
| `/crop/:id` | `CropDetail.jsx` | Public | Crop details, harvest date, farmer bio, negotiation trigger |
| `/login` | `auth/Login.jsx` | Public | Credentials & demo persona fast-fill buttons |
| `/register` | `auth/Register.jsx`| Public | Role selection (Farmer / Buyer) & initial registration |
| `/farmer/dashboard` | `FarmerDashboard.jsx` | Farmer | Sales charts, pending orders, crop listings, negotiations |
| `/farmer/create-crop`| `CreateCrop.jsx` | Farmer | Listing creation with AI Smart Vision auto-fill |
| `/farmer/kyc` | `JoinAsFarmer.jsx` | Farmer | Document upload for Aadhaar/PAN bank verification |
| `/buyer/dashboard` | `BuyerDashboard.jsx` | Buyer | Active orders, recent negotiations, favorite farmers |
| `/cart` | `ShoppingCart.jsx` | Buyer | Cart contents, quantity adjustments, price totals |
| `/checkout` | `Checkout.jsx` | Buyer | Address selection, delivery notes, Razorpay / COD selection |
| `/orders/:id` | `OrderDetails.jsx` | Protected | Invoice breakdown, delivery OTP, cancellation triggers |
| `/orders/:id/track`| `OrderTracking.jsx` | Protected | Visual step-by-step dispatch and transit timeline |
| `/admin` | `AdminProfile.jsx` | Admin | KYC verification queue, anomaly alerts, platform KPIs |

---

## 🌐 Internationalization & Multilingual Support (i18n)

FarmDirect is architected for linguistic inclusion across rural communities:

```
src/locales/
├── en.json    # English (Default)
├── hi.json    # Hindi (हिंदी)
└── od.json    # Odia (ଓଡ଼ିଆ)
```

The active language is persisted in `localStorage` and synchronized across all child components via `react-i18next`:

```jsx
import { useTranslation } from 'react-i18next';

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  return (
    <div className="flex gap-2">
      <button onClick={() => i18n.changeLanguage('en')}>English</button>
      <button onClick={() => i18n.changeLanguage('hi')}>हिंदी</button>
      <button onClick={() => i18n.changeLanguage('od')}>ଓଡ଼ିଆ</button>
    </div>
  );
}
```

---

## 📡 Real-Time WebSocket Integration

Socket.IO connections are authenticated with the active JWT token and managed via `SocketContext`:

* `negotiation:offer`: Receives instant counter-offers during bilateral negotiations.
* `order:updated`: Pushes live status changes (Pending → Accepted → Shipped → Delivered).
* `notification:new`: Displays toast alerts for buyer inquiries, price drops, and admin approvals.

---

## 🚢 Production Build & Deployment

The application is deployed on **Vercel Edge Network**:
* **Live Production URL:** [https://farm-direct-marketplace-eta.vercel.app](https://farm-direct-marketplace-eta.vercel.app)
* **Build Command:** `npm run build`
* **Output Directory:** `dist/`
* **Caching & Routing:** Handled via `vercel.json` with SPA catch-all rewrites and immutable asset caching headers.
