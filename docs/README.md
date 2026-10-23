# 📚 FarmDirect Documentation Hub & Engineering Index

Welcome to the comprehensive technical, architectural, and business documentation repository for **FarmDirect**. This index serves as the central directory for engineers, product managers, security auditors, and investors.

---

## 🧭 Master Documentation Directory

### 💼 Business & Executive
| Document | Focus & Audience | Key Highlights | Status |
| :--- | :--- | :--- | :---: |
| [🎯 Investor Pitch Deck](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docs/PITCH_DECK.md) | Investors, Partners, Accelerators | 12-slide executive deck, TAM/SAM/SOM, unit economics, GTM, competitive moat | ✅ Up to date |
| [🚀 Features & Roadmap](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docs/FEATURES_CHECKLIST.md) | Product Managers, Stakeholders | Completed capabilities vs future roadmap (ONDC, IoT, cold-chain) | ✅ Up to date |

---

### 🏗️ Architecture & System Design
| Document | Focus & Audience | Key Highlights | Status |
| :--- | :--- | :--- | :---: |
| [🏛️ System Architecture](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docs/SYSTEM_ARCHITECTURE.md) | Solutions Architects, Core Devs | TypeScript Express cluster, FastAPI ML service, Redis cache, BullMQ outbox | ✅ Up to date |
| [🍃 Database Schema Design](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docs/DATABASE_SCHEMA.md) | Data Engineers, Backend Devs | 22 MongoDB schemas, compound indexes, ACID multi-document transactions | ✅ Up to date |
| [🎨 Frontend Architecture](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docs/FRONTEND_ARCHITECTURE.md) | Frontend Devs, UI/UX Designers | React 19, Vite, PWA, Tailwind CSS, TanStack Query, i18n localization | ✅ Up to date |
| [🛡️ Role-Based Access Control (RBAC)](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docs/RBAC_AND_PERMISSIONS.md) | Security Engineers, Compliance | Farmer, Buyer, Admin permission matrix, route-level authorization gates | ✅ Up to date |

---

### ⚙️ API & Integrations
| Document | Focus & Audience | Key Highlights | Status |
| :--- | :--- | :--- | :---: |
| [🔌 API Specification](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docs/API_SPECIFICATION.md) | Frontend & Integration Partners | 60+ REST endpoints, Zod schemas, auth headers, error structures | ✅ Up to date |
| [🤖 AI Endpoint Hardening](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docs/AI_ENDPOINT_HARDENING.md) | Security Analysts, AI Engineers | PII scrubbing, prompt injection guardrails, XML data isolation, safe fallbacks | ✅ Up to date |
| [🧩 Integration Guide](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docs/INTEGRATION_GUIDE.md) | Full-Stack Developers | Razorpay gateway, Cloudinary authenticated uploads, Socket.IO real-time | ✅ Up to date |

---

### 🔄 Critical Business Workflows
| Document | Focus & Audience | Key Highlights | Status |
| :--- | :--- | :--- | :---: |
| [📦 Order Lifecycle & Outbox Pattern](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docs/ORDER_LIFECYCLE.md) | Backend Devs, Operations | Zero-oversell invariant, atomic decrement, BullMQ event sweeper | ✅ Up to date |
| [💵 Cash on Delivery (COD) Workflow](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docs/COD_WORKFLOW_DOCUMENTATION.md) | Operations & Customer Support | Automated risk scoring, buyer verification calling pipeline, OTP delivery | ✅ Up to date |
| [🧑‍🌾 Farmer Verification & KYC](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docs/VERIFICATION_FLOW_DOCUMENTATION.md) | Trust & Safety Team, Admins | Aadhaar/PAN masking, land record checks, admin approval queues | ✅ Up to date |
| [🔄 Modules & Workflows](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docs/MODULES_AND_WORKFLOWS.md) | QA Engineers, Product Analysts | Step-by-step user journeys for buyers, farmers, and administrators | ✅ Up to date |

---

### 🚀 Getting Started & Operations
| Document | Focus & Audience | Key Highlights | Status |
| :--- | :--- | :--- | :---: |
| [⚡ Quick Start Guide](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docs/QUICK_START_GUIDE.md) | New Developers, Contributors | 5-minute local setup, Docker Compose, environment configuration | ✅ Up to date |
| [💻 Backend Service Readme](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/backend-ts/README.md) | Backend Developers | Node 20 / TypeScript 5.9, tests, scripts, database seeding | ✅ Up to date |
| [🖥️ Frontend App Readme](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/F_1/README.md) | Frontend Developers | React 19 / Vite PWA setup, component directory, translation guide | ✅ Up to date |
| [🐍 ML Microservice Readme](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/ml-service/README.md) | Data Scientists, ML Engineers | Python 3.11 / FastAPI, LightGBM forecasting, anomaly detection | ✅ Up to date |

---

## 🏛️ Architecture at a Glance

```
                               ┌──────────────────────────────────────────────┐
                               │       Client Tier (React 19 Vite PWA)        │
                               │  EN / HI / OD Locales · Tailwind · Socket.IO │
                               └──────────────────────┬───────────────────────┘
                                                      │ HTTPS / WSS
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │    Backend Ingress (Express + TypeScript)    │
                               │  Timing-Safe Auth · Rate Limit · Sanitizers │
                               └───────┬──────────────┬──────────────┬────────┘
                                       │              │              │
                   ┌───────────────────┴──┐           │        ┌─────┴──────────────────┐
                   ▼                      ▼           ▼        ▼                        ▼
       ┌──────────────────────┐  ┌─────────────┐  ┌───────┐ ┌───────────────┐ ┌────────────────┐
       │ MongoDB 7.x Replica  │  │ Redis Store │  │BullMQ │ │FastAPI ML Svc │ │Google Gemini   │
       │ ACID Txn · WiredTiger│  │ Idempotency │  │Outbox │ │Price Forecast │ │Vision & AgriBot│
       └──────────────────────┘  └─────────────┘  └───────┘ └───────────────┘ └────────────────┘
```

---

## 💡 How to Contribute to Documentation
1. **Preserve Architectural Parity**: Whenever updating controllers, routes, or models, ensure the corresponding schema and API specifications are updated synchronously.
2. **Adhere to Styling Standards**:
   - Use clear markdown tables and ASCII / mermaid diagrams for complex flows.
   - Use GitHub alert callouts (`> [!NOTE]`, `> [!IMPORTANT]`, `> [!WARNING]`).
   - Format file references as clickable links.
