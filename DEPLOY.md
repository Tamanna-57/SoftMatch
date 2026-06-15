# Deploying SoftMatch

Three pieces:

| Piece     | Where                | Why                                            |
|-----------|----------------------|------------------------------------------------|
| Database  | MongoDB Atlas        | Shared store for profiles, accounts, ratings.  |
| Backend   | Google Cloud Run     | Express + Socket.IO (needs real WebSockets).   |
| Frontend  | Vercel               | Static React app (your existing deploy).       |

---

## 1. MongoDB Atlas
1. Create a free cluster: https://www.mongodb.com/cloud/atlas
2. **Database Access** → add a user (username + password).
3. **Network Access** → add `0.0.0.0/0` (Cloud Run uses dynamic IPs).
4. **Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## 2. Backend → Google Cloud Run
Prereqs: a Google Cloud project + the `gcloud` CLI (`gcloud init`).

From the repo root:
```bash
cd backend

# One command build + deploy from source (uses the included Dockerfile):
gcloud run deploy softmatch-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "MONGODB_URI=YOUR_ATLAS_URI,MONGODB_DB=softmatch,JWT_SECRET=YOUR_LONG_RANDOM_SECRET,CLIENT_URL=https://YOUR-APP.vercel.app"
```
Notes:
- Generate a JWT secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `CLIENT_URL` must be your Vercel URL (comma-separate multiple, or `*` to allow all).
- Cloud Run supports WebSockets. For best Socket.IO behavior, enable session
  affinity and keep at least one warm instance:
  ```bash
  gcloud run services update softmatch-backend --region us-central1 \
    --session-affinity --min-instances 1
  ```
- When it finishes, `gcloud` prints a **Service URL** like
  `https://softmatch-backend-xxxxx-uc.a.run.app`. Copy it.

Sanity check: open `https://<service-url>/health` → `{"status":"ok",...}`.

## 3. Frontend → Vercel
In your Vercel project settings → **Environment Variables**, add:
```
VITE_API_URL = https://softmatch-backend-xxxxx-uc.a.run.app
```
Redeploy. The frontend will now send all matching, auth, and chat traffic to
your Cloud Run backend.

## 4. Verify end-to-end
1. Open your Vercel URL in two browsers, make a profile in each.
2. Hit **find my people** — each should see the other.
3. Open a chat — messages flow in real time and survive a refresh.

---

## Environment variable reference

**Backend (Cloud Run):**
| Var          | Required | Example                                   |
|--------------|----------|-------------------------------------------|
| `MONGODB_URI`| yes      | `mongodb+srv://...mongodb.net/...`        |
| `MONGODB_DB` | no       | `softmatch` (default)                     |
| `JWT_SECRET` | yes      | long random string                        |
| `CLIENT_URL` | yes      | `https://your-app.vercel.app`             |
| `PORT`       | no       | Cloud Run sets this automatically (8080)  |

**Frontend (Vercel):**
| Var            | Required | Example                                      |
|----------------|----------|----------------------------------------------|
| `VITE_API_URL` | yes      | `https://softmatch-backend-xxxxx-uc.a.run.app` |
