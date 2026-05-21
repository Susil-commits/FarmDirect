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

### Backend → Render (FREE)

**Why Render:** Free HTTPS, auto-deploy from GitHub, no cold-start config needed.

1. Go to **[render.com](https://render.com)** → Sign up with GitHub
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `farm-marketplace-api` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |

5. Add **Environment Variables** (copy from your `backend/.env`):

```
PORT=10000
NODE_ENV=production
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
CORS_ORIGIN=https://your-app.vercel.app
```

6. Click **Create Web Service**

---

### Database → MongoDB Atlas (FREE)

1. Go to **[mongodb.com/atlas](https://www.mongodb.com/atlas)** → Sign up
2. Create a **FREE shared cluster** (M0)
3. In **Database Access**, create a user (username + password)
4. In **Network Access**, add `0.0.0.0/0` (allow all IPs)
5. Click **Connect** → **Drivers** → Copy the connection string
6. Replace `<username>` and `<password>` in the URI
7. Paste into your `backend/.env` as `MONGODB_URI`

---

### Image Storage → DigitalOcean Spaces ($5/month)

**Skip this if you don't need image uploads yet.** The app falls back to local storage.

1. Create a Space at [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Generate API keys (Spaces access key + secret)
3. Add to `backend/.env`:
```
DIGITALOCEAN_SPACES_KEY=your_key
DIGITALOCEAN_SPACES_SECRET=your_secret
DIGITALOCEAN_SPACES_NAME=your-space-name
DIGITALOCEAN_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

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