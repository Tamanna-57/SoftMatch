# Aura Backend

Node.js + Express + Socket.IO server for the Aura anonymous matching app.

## Start
```bash
npm install
npm start        # production
npm run dev      # dev with --watch (Node 18+)
```

Runs on `http://localhost:3001`

## Architecture
- In-memory Maps for users/rooms (swap with DB for production)
- Socket.IO for real-time matching + messaging
- Matching algorithm: intent (35%) + vibes (25%) + interests (25%) + sliders (15%)

## Recommended DB: MongoDB or SQLite (see main README)
