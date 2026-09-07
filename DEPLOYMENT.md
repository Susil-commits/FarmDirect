# 🚀 Deployment Guide — FaRm Marketplace

> Quick deployment guide for recruiters to get this full-stack app running in under 30 minutes.

---

## 📦 Project Overview

| Layer | Tech | Port |
|-------|------|------|
| **Frontend** | React 19 + Vite + Tailwind CSS | `5173` (dev) |
| **Backend** | Express.js + MongoDB + JWT | `5000` |
| **Database** | MongoDB Atlas (cloud) | — |
| **Image Storage** | DigitalOcean Spaces (S3) | — |

---

## ⚡ Quick Start (Local — 5 minutes)

```bash
# 1. Clone & install everything
git clone <your-repo-url> farm-marketplace
cd farm-marketplace
npm run install:all

# 2. Set up backend environment
cp backend/.env.example backend/.env
# Edit backend/.env → paste your MongoDB URI and JWT_SECRET

# 3. Set up frontend environment
cp F_1/.env.example F_1/.env

# 4. Seed the database (creates admin user + sample data)
npm run seed

# 5. Start both servers (open 2 terminals)
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend

# 6. Open http://localhost:5173
```

---

## 🌐 Production Deployment

### Frontend → Vercel (FREE)

**Why Vercel:** Zero-config React/Vite hosting, auto-HTTPS, global CDN, free tier.

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy from the F_1/ directory
cd F_1
vercel

# 3. Follow prompts:
#    - Set up and deploy: Y
#    - Which scope: (your account)
#    - Link to existing project: N
#    - Project name: farm-marketplace
#    - Root directory: ./
#    - Build command: npm run build
#    - Output directory: dist
```

**After deploying**, update these environment variables in Vercel dashboard:
```
VITE_API_BASE_URL=https://your-backend.onrender.com/api
VITE_API_DIRECT_URL=https://your-backend.onrender.com/api
```

---

### Backend → Render (TypeScript Backend Recommended)

**Why Render:** Native Node.js deployment, automatic HTTPS, Git-based CI/CD.

1. Go to **[render.com](https://render.com)** → Sign up / Log in
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Configure service:

| Setting | Value |
|---------|-------|
| **Name** | `farmdirect-api` |
| **Root Directory** | `backend-ts` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

5. Add **Environment Variables**:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=<your-mongodb-atlas-replica-set-uri>
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-refresh-secret>
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=30d
CORS_ORIGIN=https://your-app.vercel.app

# Cloud Storage (MANDATORY in production to avoid ephemeral disk loss)
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Payments (Razorpay)
RAZORPAY_KEY_ID=<your-razorpay-key-id>
RAZORPAY_KEY_SECRET=<your-razorpay-key-secret>
RAZORPAY_WEBHOOK_SECRET=<your-razorpay-webhook-secret>

# Keep-alive & Diagnostics
RENDER_EXTERNAL_URL=https://your-backend.onrender.com
```

> [!WARNING]
> **Render Free Tier Constraints & Production Advice:**
> - **Cold Starts:** Free instances spin down after 15 minutes of inactivity, resulting in a ~30-50s latency delay on cold requests. The backend includes a self-ping mechanism in `server.ts` utilizing `RENDER_EXTERNAL_URL` to keep instances warm while active.
> - **Ephemeral Storage:** Containers lose local filesystem state upon restart or deploy. Local disk storage is disabled in production; Cloudinary credentials are strictly required at boot.
> - **Background Queues & Workers:** Periodic reconciliation and Redis outbox workers run continuously in the Node process. For mission-critical high-traffic environments, upgrading to the Render Starter plan ($7/mo) guarantees uninterrupted 24/7 uptime without spinning down.

---

### Database → MongoDB Atlas (FREE M0 or Replica Set)

1. Go to **[mongodb.com/atlas](https://www.mongodb.com/atlas)** → Sign up
2. Create a **FREE shared cluster** (M0 or higher)
3. Under **Database Access**, create a user with read/write privileges
4. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`)
5. Click **Connect** → **Drivers** → Copy the connection URI
6. Set `MONGODB_URI` in your backend environment variables (MongoDB Atlas clusters are replica sets by default, enabling ACID order transactions).

---

## 🔐 Admin Account

After running `npm run seed`, login with:

| Field | Value |
|-------|-------|
| **Email** | `admin@farmdirect.com` |
| **Password** | `Admin@123` |

---

## 📁 Project Structure

```
farm-marketplace/
├── package.json              # Root scripts
├── .gitignore                # Ignores node_modules, .env, uploads
├── README.md                 # Project overview
├── DEPLOYMENT.md             # This file
├── backend/
│   ├── .env.example          # Backend env template (safe to commit)
│   ├── package.json
│   ├── server.js             # Express entry point
│   ├── config/db.js          # MongoDB connection
│   ├── models/               # Mongoose schemas
│   ├── controllers/          # Route logic
│   ├── routes/               # API endpoints
│   ├── middleware/            # Auth, upload, validation
│   └── utils/                # JWT, email, password helpers
├── F_1/
│   ├── .env.example          # Frontend env template
│   ├── vercel.json           # SPA routing for Vercel
│   ├── vite.config.js        # Dev proxy config
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── pages/            # Route pages
│       ├── services/         # API calls
│       └── utils/            # Helpers
└── docs/                     # Architecture & feature docs
```

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install both frontend & backend deps |
| `npm run dev:backend` | Start backend with nodemon (hot reload) |
| `npm run dev:frontend` | Start Vite dev server |
| `npm run build:frontend` | Production build to `F_1/dist/` |
| `npm run seed` | Seed database with admin + sample data |
| `npm run start:backend` | Start backend in production mode |

---

## ✅ Pre-Deployment Checklist

- [ ] MongoDB Atlas cluster is running
- [ ] `backend/.env` has valid `MONGODB_URI` and `JWT_SECRET`
- [ ] `backend/.env` has correct `CORS_ORIGIN` (your Vercel URL)
- [ ] `F_1/.env` has correct `VITE_API_DIRECT_URL` (your Render URL)
- [ ] Database seeded: `npm run seed`
- [ ] Frontend builds without errors: `npm run build:frontend`
- [ ] GitHub repo does NOT contain `backend/.env` (it's in `.gitignore`)

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| CORS errors | Update `CORS_ORIGIN` in backend `.env` to your Vercel URL |
| MongoDB connection failed | Whitelist `0.0.0.0/0` in Atlas Network Access |
| Images not uploading | DigitalOcean Spaces credentials missing; app uses local fallback |
| File upload fails in production | Set `VITE_API_DIRECT_URL` to your Render backend URL |
| 404 on page refresh | Vercel `vercel.json` handles SPA routing (already configured) |

---

## 📞 Questions?

Check `docs/` for detailed architecture, API specs, and feature documentation.