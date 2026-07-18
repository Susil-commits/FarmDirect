# FaRm — ATS-Optimized CV Bullet Points

> **Project**: FaRm — Direct Farmer-to-Consumer Marketplace  
> **Stack**: React 19 · TypeScript 5.5 · Node.js · Express.js · MongoDB · Socket.io · Vite · TanStack Query · Razorpay · Cloudinary · Zod · JWT  
> **Role**: Full-Stack Developer

---

## ⭐ Pick 3–5 of these for your CV. Mix levels (architecture + feature + engineering quality).

---

## 🏗️ Architecture & System Design

- **Architected a full-stack farmer-to-consumer e-commerce platform** using React 19, Node.js (Express.js), and MongoDB, serving **3 distinct user roles** (Buyer, Farmer, Admin) with **role-based access control (RBAC)** and **14 REST API route groups**

- **Designed and implemented a dual-backend architecture** — migrated a JavaScript/Express codebase to a **TypeScript 5.5 strict-mode backend** comprising **63 source files** (14 controllers, 14 routes, 11 Mongoose models, 5 middleware), achieving zero type errors under `tsc --noEmit`

- **Built a scalable RESTful API** with Express.js covering **15 resource domains** (auth, crops, orders, payments, reviews, notifications, messages, admin, farmer, wishlist, coupons, data access, uploads, contact, cart) with **Zod schema validation** and automatic type inference on all request bodies

---

## ⚡ Real-Time & Performance

- **Implemented real-time bidirectional communication** using Socket.io (WebSocket), enabling live order-status updates, buyer-farmer chat messaging, and push notifications across **3 user roles** simultaneously — eliminating polling for time-critical order state transitions

- **Optimized frontend data-fetching layer** using **TanStack Query (React Query)**, implementing **optimistic UI updates** with automatic rollback on error, query prefetching, and cache invalidation strategies — reducing perceived latency by instantly reflecting user actions before server confirmation

- **Engineered a tiered rate-limiting strategy** with express-rate-limit: **600 req/15 min** (global), **30 req/15 min** (auth endpoints), and **120 req/min** (polling endpoints) — protecting the API against brute-force attacks and abuse while preserving normal user throughput

---

## 🛒 E-Commerce Features

- **Developed end-to-end order lifecycle management** with a **6-state finite state machine** (Confirmed → Preparing → Ready for Pickup → Picked Up → Completed / Cancelled), enforcing valid transitions server-side, auto-restoring crop inventory on cancellation, and emitting real-time Socket.io events on every transition

- **Integrated Razorpay payment gateway** for online transactions alongside Cash-on-Delivery (COD) fallback; implemented order-verification webhook flow with payment status tracking, failure handling, and automatic payment-method-based routing

- **Built a KYC verification pipeline** for farmers and buyers — document submission, admin review queue, approval/rejection with in-app notifications and email triggers (SMTP) — enforcing that only KYC-verified users can access private messaging and certain marketplace features

- **Implemented a product recommendation engine** serving **personalized crop suggestions** based on order history and wishlist data, alongside a **bulk CSV upload feature** enabling farmers to list multiple crop entries in a single API call

---

## 🔐 Security & Authentication

- **Implemented JWT-based authentication** with **dual-token strategy** — short-lived access tokens (7d) and long-lived refresh tokens (30d) — along with **OAuth 2.0 social login** (Google & GitHub) using Passport.js callbacks, supporting email/password and social auth simultaneously

- **Secured the API layer** using **Helmet.js** (secure HTTP headers), **CORS** with allowlist-based origin validation, request-ID middleware (`X-Request-Id`) for log correlation, and **Multer + Cloudinary** for safe file uploads with local-disk fallback — processing KYC documents, farm images, and crop photos

---

## 🗄️ Database & Data Modeling

- **Designed and implemented 11 Mongoose data models** — User, CropListing, Order, Review, Notification, Message, Wishlist, Coupon, Contact, ContactQuery, AuditLog — with TypeScript interfaces (`IUser`, `IOrder`, `ICropListing`) ensuring compile-time safety across all database interactions

- **Built an admin audit-log system** capturing every admin action with before/after state snapshots, enabling full traceability across user management, KYC approvals, crop moderation, coupon management, and order overrides across the platform

---

## 📊 Admin & Analytics

- **Developed a comprehensive admin dashboard** covering platform-wide analytics (users, crops, orders, revenue), crop moderation (approve/reject/freeze), KYC document review, coupon system (percentage & fixed-value with usage limits), announcement broadcasting, and user management (suspend/ban/reactivate) — all changes persisted to AuditLog

- **Built farmer analytics** including revenue trend charts, crop performance scoring, category breakdowns, daily/monthly sales tracking (`dailySales`, `monthlyStats`), and low-stock inventory alerts with configurable thresholds

---

## 🧹 Code Quality & DevOps

- **Identified and resolved 12 production bugs** during JS → TS migration — including a critical KYC route misconfiguration (endpoint silently did nothing), a broken `cropType` enum causing every crop creation to fail Mongoose validation, and 4 missing API endpoints — demonstrating systematic code-audit and debugging skills

- **Implemented graceful server shutdown** handling `SIGTERM`/`SIGINT` signals, closing the HTTP server and disconnecting MongoDB before process exit, with a 10-second force-kill safety timeout — production-grade reliability pattern

- **Authored 14 technical documentation files** covering API specification, database schema, system architecture, RBAC & permissions, frontend architecture, order lifecycle, KYC verification flow, integration guide, and deployment instructions (Vercel + Render)

---

## 🎨 Frontend Engineering

- **Built a multi-page React 19 + Vite SPA** with **35+ page components** and **8+ context providers** (Auth, Cart, Wishlist, Toast, Notification, Chat, RecentlyViewed, Realtime) — implementing custom hooks for routing, socket management, browser notifications, swipe gestures, scroll-reveal animations, and search with debouncing

- **Implemented a product comparison feature**, recently-viewed carousel with localStorage persistence, advanced search with filter panel (category, price range, location, rating, certification), and real-time search-as-you-type — elevating the buyer discovery experience

---

## 📋 One-Line Summary (use in Project Header on CV)

> **FaRm** | Full-Stack Marketplace | React 19 · TypeScript · Node.js · Express · MongoDB · Socket.io · Razorpay | 63-file TypeScript backend · 35+ page React SPA · Real-time WebSocket · JWT + OAuth 2.0 · Zod · TanStack Query · Cloudinary · RBAC · KYC Pipeline

---

## 🔑 ATS Keyword Bank (embed naturally in bullets above)

`React.js` · `Node.js` · `TypeScript` · `Express.js` · `MongoDB` · `Mongoose` · `REST API` · `WebSocket` · `Socket.io` · `JWT` · `OAuth 2.0` · `Razorpay` · `Cloudinary` · `TanStack Query` · `React Query` · `Zod` · `Vite` · `role-based access control` · `RBAC` · `real-time` · `optimistic UI` · `rate limiting` · `Helmet.js` · `CORS` · `Multer` · `SMTP` · `full-stack` · `e-commerce` · `payment gateway` · `state machine` · `data modeling` · `API design` · `KYC` · `audit logging` · `CI/CD` · `Vercel` · `Render`
