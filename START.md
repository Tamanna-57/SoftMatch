# SoftMatch — Quick Start

Real backend now: profiles, accounts, matching, and chat are stored in
MongoDB and shared across all users. **No demo data.**

## 1. Database — MongoDB Atlas (one-time)
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Create a database user (username + password).
3. Under **Network Access**, allow your IP (or `0.0.0.0/0` for cloud hosting).
4. Copy the connection string (**Connect → Drivers**).

## 2. Run the backend
```bash
cd backend
cp .env.example .env        # then paste your MONGODB_URI + set JWT_SECRET
npm install
npm start
```
Runs on http://localhost:3001

## 3. Run the frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 — the Vite dev server proxies `/api` and the
Socket.IO connection to the backend automatically.

## 4. Test real matching
Open the app in two different browsers (or one normal + one incognito),
create a profile in each, and hit **find my people**. Each side now sees the
other — because both profiles live in the shared database.

---

## Deploying for real (Vercel + Google Cloud Run)
See **DEPLOY.md** for step-by-step instructions:
- Backend → Google Cloud Run (Docker)
- Frontend → Vercel (set `VITE_API_URL` to the Cloud Run URL)
- Database → MongoDB Atlas
