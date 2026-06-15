# SoftMatch Backend

Node.js + Express + Socket.IO + **MongoDB** server for the SoftMatch
anonymous matching app. No demo data — all profiles, accounts, matches,
ratings and chat history are persisted and shared across users.

## Run locally
```bash
cp .env.example .env     # set MONGODB_URI + JWT_SECRET
npm install
npm start                # production
npm run dev              # dev with --watch
```
Runs on `http://localhost:3001`. Requires a reachable MongoDB (Atlas).

## Architecture
- **MongoDB** (`lib/db.js`) — collections: `users`, `ratings`, `messages`
  (TTL 7 days), `reports`. Indexes created on boot.
- **Two-way matching** (`lib/matching.js`) — a match is valid only when *my
  profile fits your preferences AND your profile fits mine*. Mirrors the
  frontend engine. Ranks every registered user, not just those online now.
- **Auth** (`lib/auth.js`) — email/password with bcrypt hashing + JWT.
- **Socket.IO** — real-time chat + presence; messages persisted to MongoDB.

## REST API
| Method | Path                  | Purpose                                       |
|--------|-----------------------|-----------------------------------------------|
| GET    | `/health`             | Liveness + online count                       |
| GET    | `/api/stats`          | Online + total user counts                    |
| POST   | `/api/auth/signup`    | Create/claim a permanent account              |
| POST   | `/api/auth/login`     | Log in, returns token + saved profile         |
| POST   | `/api/profile`        | Save profile + preferences                    |
| POST   | `/api/matches`        | Upsert caller + return ranked two-way matches |
| POST   | `/api/rate`           | Rate another user (1–5)                        |
| POST   | `/api/report`         | Report a user                                 |
| GET    | `/api/messages/:room` | Recent chat history for a room                 |

## Deploy
Containerized for **Google Cloud Run** (see `Dockerfile` and `../DEPLOY.md`).
