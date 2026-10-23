# ⚡ FarmDirect Developer Quick Start Guide

[![Setup Time](https://img.shields.io/badge/Setup_Time-5_Minutes-brightgreen?style=for-the-badge&logo=clock)](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docs/QUICK_START_GUIDE.md)
[![Docker](https://img.shields.io/badge/Docker_Compose-Single_Command-blue?style=for-the-badge&logo=docker)](file:///c:/Users/nayak/OneDrive/Desktop/Projects/web/FaRm/docker-compose.yml)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Production_Deployed-orange?style=for-the-badge&logo=vercel)](https://farm-direct-marketplace-eta.vercel.app)

> Get the entire FarmDirect ecosystem (React 19 PWA Frontend, TypeScript API Backend, Python ML Microservice, MongoDB, and Redis) running locally in under 5 minutes.

---

## 📑 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Option A: Docker Compose (Recommended)](#2-option-a-docker-compose-single-command-boot)
3. [Option B: Manual Local Setup](#3-option-b-manual-local-setup)
   - [Step 1: Backend API (`backend-ts`)](#step-1-backend-api-backend-ts)
   - [Step 2: Frontend Web App (`F_1`)](#step-2-frontend-web-app-f_1)
   - [Step 3: ML Microservice (`ml-service`)](#step-3-ml-microservice-ml-service)
4. [Demo Accounts & Test Credentials](#4-demo-accounts--test-credentials)
5. [Verifying System Health](#5-verifying-system-health)
6. [Common Troubleshooting & FAQs](#6-common-troubleshooting--faqs)

---

## 1. Prerequisites

Before starting, ensure your system has:
* **Node.js**: `v20.x LTS` or higher
* **npm**: `v10.x` or higher
* **Python**: `3.10` or `3.11`
* **Docker & Docker Compose**: (Optional, for single-command orchestration)
* **MongoDB**: `7.x` (or MongoDB Atlas connection string)
* **Redis**: `7.x` (or Redis Cloud connection string)

---

## 2. Option A: Docker Compose (Single-Command Boot)

The fastest way to run all services simultaneously:

```bash
# 1. Clone the repository
git clone https://github.com/Susil-commits/FarmDirect.git
cd FarmDirect

# 2. Setup environment files
cp backend-ts/.env.example backend-ts/.env
cp F_1/.env.example F_1/.env

# 3. Spin up the entire multi-container stack
docker-compose up --build
```

### Exposed Service Endpoints
| Service | Local URL | Port |
| :--- | :--- | :---: |
| 🌐 **Frontend PWA** | [http://localhost:80](http://localhost:80) | `80` |
| ⚙️ **Backend API** | [http://localhost:5000/api](http://localhost:5000/api) | `5000` |
| 🩺 **Backend Health** | [http://localhost:5000/api/health](http://localhost:5000/api/health) | `5000` |
| 🐍 **ML Microservice** | [http://localhost:8000/health](http://localhost:8000/health) | `8000` |
| 🍃 **MongoDB Replica** | `localhost:27017` | `27017` |
| 🔴 **Redis Store** | `localhost:6379` | `6379` |

---

## 3. Option B: Manual Local Setup

### Step 1: Backend API (`backend-ts`)

```bash
# Navigate to backend directory
cd backend-ts

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Seed mock database with farmers, buyers, crops, and price snapshots
npm run seed

# Start TypeScript development server with hot-reload
npm run dev
```
✅ *Backend API running on `http://localhost:5000/api`*

---

### Step 2: Frontend Web App (`F_1`)

```bash
# In a new terminal window:
cd F_1

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Launch Vite development server
npm run dev
```
✅ *Frontend Web App running on `http://localhost:5173`*

---

### Step 3: ML Microservice (`ml-service`)

```bash
# In a third terminal window:
cd ml-service

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
✅ *FastAPI ML Microservice running on `http://localhost:8000`*

---

## 4. Demo Accounts & Test Credentials

The database seeder automatically initializes three pre-configured personas:

| Persona | Demo Email | Password | Privileges & Workflows |
| :--- | :--- | :--- | :--- |
| 🧑‍🌾 **Farmer** | `farmer1@farmdirect.local` | `password123` | Crop listing, AI photo autofill, counter-offers, inventory management |
| 🛒 **Buyer** | `buyer1@farmdirect.local` | `password123` | Geolocation discovery, bilateral negotiations, shopping cart, checkout |
| 🛡️ **Admin** | `admin@farmdirect.local` | `Admin@123` | KYC document approvals, listing moderation, fraud investigation, system KPIs |

---

## 5. Verifying System Health

Run the following checks to ensure all modules are communicating:

```bash
# 1. Check API Liveness
curl http://localhost:5000/api/health

# 2. Check ML Microservice Liveness
curl http://localhost:8000/health

# 3. Run Backend Automated Test Suites (125 tests)
cd backend-ts
npm test

# 4. Run AI Evaluation Benchmark (62 Golden Prompts)
npm run eval:chat
```

---

## 6. Common Troubleshooting & FAQs

### Q: MongoDB fails with `MongoServerError: This MongoDB deployment does not support transactions`
**Solution:** Transactions require MongoDB to be running as a replica set.
* In Docker: The provided `docker-compose.yml` automatically initializes a single-node replica set (`rs0`).
* Local standalone MongoDB: Initialize a replica set using `mongod --replSet rs0` followed by `rs.initiate()`.

### Q: Redis connection refused on `localhost:6379`
**Solution:** Start a local Redis instance via Docker:
```bash
docker run -d -p 6379:6379 --name redis-local redis:7-alpine
```

### Q: Gemini API Key errors in chat or vision
**Solution:** Add your Google Gemini API key to `backend-ts/.env`:
```ini
GEMINI_API_KEY=AIzaSy_your_valid_key
```
If no key is provided, the backend automatically activates the **deterministic offline agronomy handbook**, ensuring zero crashes.
