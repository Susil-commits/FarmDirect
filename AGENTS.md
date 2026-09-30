# AGENTS.md — FaRm Project

## Project Overview
Direct Farmer-to-Consumer marketplace:
- `backend-ts/` — TypeScript backend (Express + Mongoose + Socket.io + BullMQ)
- `F_1/` — React + Vite frontend

## Commands

### TypeScript Backend (`backend-ts/`)
```bash
cd backend-ts
npm run dev          # dev server with hot reload (tsx watch)
npm run typecheck    # type-check only: tsc --noEmit (ALWAYS run after edits)
npm run lint         # eslint
npm test             # run tests
npm run build        # compile to dist/
npm start            # run compiled server
npm run seed         # seed database
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
npm run seed                   # seed database (runs backend-ts)
```

## Important
- Always run `npm run typecheck` in `backend-ts/` after editing TypeScript files
- Environment variables: copy `.env.example` → `.env` in `backend-ts/`
- Required keys: `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (see README for all)
- Optional keys: Cloudinary, Razorpay, SMTP, Google/GitHub OAuth, Gemini (all have fallbacks)
