# AGENTS.md — FaRm Project

## Project Overview
Direct Farmer-to-Consumer marketplace with two backends:
- `backend/` — original JavaScript (Express + Mongoose + Socket.io)
- `backend-ts/` — TypeScript port (same architecture, enhanced type safety)
- `F_1/` — React + Vite frontend

## Commands

### TypeScript Backend (`backend-ts/`)
```bash
cd backend-ts
npm run dev          # dev server with hot reload (tsx watch)
npm run typecheck    # type-check only: tsc --noEmit (ALWAYS run after edits)
npm run build        # compile to dist/
npm start            # run compiled server
```

### JavaScript Backend (`backend/`)
```bash
cd backend
npm run dev          # nodemon server.js
npm run seed         # seed database
npm start            # node server.js
```

### Frontend (`F_1/`)
```bash
cd F_1
npm run dev          # vite dev server
npm run build        # production build
npm run lint         # eslint
```

### Root-level
```bash
npm run typecheck:backend:ts   # type-check the TS backend
npm run dev:backend:ts         # start TS backend dev
npm run build:backend:ts       # build TS backend
```

## Important
- Always run `npm run typecheck` in `backend-ts/` after editing TypeScript files
- The TS backend (`backend-ts/`) is the recommended backend — same API surface as `backend/`
- Environment variables: copy `.env.example` → `.env` in each backend dir
- Required keys: `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (see README for all)
- Optional keys: Cloudinary, Razorpay, SMTP, Google/GitHub OAuth (all have fallbacks)
