// ─────────────────────────────────────────────────────────────
//  SoftMatch backend — Express + Socket.IO + MongoDB Atlas
//
//  Real, multi-user backend:
//   • profiles + accounts persisted in MongoDB (shared across users)
//   • two-way matching across ALL registered users (not just online)
//   • email/password auth (bcrypt + JWT)
//   • real-time chat over Socket.IO with persisted history
//
//  Deploys to Google Cloud Run (see Dockerfile). No demo data.
// ─────────────────────────────────────────────────────────────

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const { connectDB, collections } = require('./lib/db')
const { rankMatches } = require('./lib/matching')
const {
  hashPassword, verifyPassword, signToken, optionalAuth,
} = require('./lib/auth')

const app = express()
const server = http.createServer(app)

// CORS: allow the Vercel frontend (and localhost in dev). CLIENT_URL may be a
// comma-separated list of allowed origins; "*" allows any.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

function corsOrigin(origin, cb) {
  if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    return cb(null, true)
  }
  return cb(new Error(`Origin ${origin} not allowed by CORS`))
}

const io = new Server(server, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
})

app.use(cors({ origin: corsOrigin }))
app.use(express.json())
app.use(optionalAuth)

// In-memory presence only (who's connected right now). The durable data lives
// in MongoDB; presence is naturally ephemeral.
const onlineSockets = new Map() // socketId -> userId
const userSockets = new Map()   // userId -> Set<socketId>

function markOnline(userId, socketId) {
  onlineSockets.set(socketId, userId)
  if (!userSockets.has(userId)) userSockets.set(userId, new Set())
  userSockets.get(userId).add(socketId)
}
function markOffline(socketId) {
  const userId = onlineSockets.get(socketId)
  onlineSockets.delete(socketId)
  if (userId && userSockets.has(userId)) {
    userSockets.get(userId).delete(socketId)
    if (userSockets.get(userId).size === 0) userSockets.delete(userId)
  }
  return userId
}
const isOnline = (userId) => userSockets.has(userId)

// ── Helpers ──────────────────────────────────────────────────

// Shape a stored user doc into the public match/profile object the client uses.
function toPublic(u) {
  return {
    id: u.userId,
    userId: u.userId,
    username: u.username,
    rating: u.rating || 0,
    ratingCount: u.ratingCount || 0,
    profile: u.profile || {},
    prefs: u.prefs || {},
    online: isOnline(u.userId),
  }
}

// Upsert a user's identity + profile + preferences so they become matchable.
async function upsertUser({ userId, username, profile, prefs }) {
  if (!userId) throw new Error('userId required')
  const now = new Date()
  const set = { username, lastSeen: now, onboarded: true }
  if (profile) set.profile = profile
  if (prefs) set.prefs = prefs

  await collections.users().updateOne(
    { userId },
    {
      $set: set,
      $setOnInsert: { userId, createdAt: now, rating: 0, ratingCount: 0 },
    },
    { upsert: true }
  )
  return collections.users().findOne({ userId })
}

// Recompute a user's rating aggregate from the ratings collection.
async function recomputeRating(toUserId) {
  const agg = await collections.ratings().aggregate([
    { $match: { toUserId } },
    { $group: { _id: '$toUserId', avg: { $avg: '$stars' }, count: { $sum: 1 } } },
  ]).toArray()
  const rating = agg.length ? +agg[0].avg.toFixed(1) : 0
  const ratingCount = agg.length ? agg[0].count : 0
  await collections.users().updateOne({ userId: toUserId }, { $set: { rating, ratingCount } })
  return { rating, ratingCount }
}

function asyncRoute(fn) {
  return (req, res) => fn(req, res).catch(err => {
    console.error(`[err] ${req.method} ${req.path}:`, err.message)
    res.status(500).json({ error: err.message })
  })
}

// ── REST API ─────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok', online: userSockets.size }))

app.get('/api/stats', asyncRoute(async (_req, res) => {
  const totalUsers = await collections.users().countDocuments({ onboarded: true })
  res.json({ onlineUsers: userSockets.size, totalUsers })
}))

// Sign up — create or claim a permanent account, linked to the client userId.
app.post('/api/auth/signup', asyncRoute(async (req, res) => {
  const { email, password, userId, username } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  if (password.length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' })

  const existing = await collections.users().findOne({ email: email.toLowerCase() })
  if (existing) return res.status(409).json({ error: 'an account with this email already exists' })

  const now = new Date()
  const passwordHash = await hashPassword(password)
  // If we already have an anonymous doc for this userId, upgrade it in place.
  await collections.users().updateOne(
    { userId },
    {
      $set: { email: email.toLowerCase(), passwordHash, username, accountType: 'permanent', lastSeen: now },
      $setOnInsert: { userId, createdAt: now, rating: 0, ratingCount: 0, onboarded: false },
    },
    { upsert: true }
  )
  const user = await collections.users().findOne({ userId })
  const token = signToken({ userId: user.userId, email: user.email })
  res.json({ token, user: toPublic(user), email: user.email })
}))

// Log in — verify credentials, return the stored identity + profile + prefs.
app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })

  const user = await collections.users().findOne({ email: email.toLowerCase() })
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'invalid email or password' })
  }
  await collections.users().updateOne({ userId: user.userId }, { $set: { lastSeen: new Date() } })
  const token = signToken({ userId: user.userId, email: user.email })
  res.json({
    token,
    user: toPublic(user),
    email: user.email,
    profile: user.profile || null,
    prefs: user.prefs || null,
    onboarded: !!user.onboarded,
  })
}))

// Save profile + preferences (works for anonymous and permanent users).
app.post('/api/profile', asyncRoute(async (req, res) => {
  const { userId, username, profile, prefs } = req.body || {}
  if (!userId || !username) return res.status(400).json({ error: 'userId and username required' })
  const user = await upsertUser({ userId, username, profile, prefs })
  res.json({ ok: true, user: toPublic(user) })
}))

// Core endpoint: upsert the caller (so they're matchable) AND return ranked
// two-way matches drawn from every other registered user.
app.post('/api/matches', asyncRoute(async (req, res) => {
  const { userId, username, profile, prefs, skipped = [] } = req.body || {}
  if (!userId || !username) return res.status(400).json({ error: 'userId and username required' })

  const me = await upsertUser({ userId, username, profile, prefs })

  // Candidate pool: every onboarded user except me and anyone skipped.
  const pool = await collections.users()
    .find({ onboarded: true, userId: { $nin: [userId, ...skipped] } })
    .sort({ lastSeen: -1 })
    .limit(500)
    .toArray()

  const candidates = pool.map(toPublic)
  const ranked = rankMatches(
    { profile: me.profile || {}, prefs: me.prefs || {} },
    candidates
  )
  // Trim to a reasonable page and bubble online users up within equal scores.
  ranked.sort((a, b) => (b.match.score - a.match.score) || (Number(b.online) - Number(a.online)))
  res.json({ matches: ranked.slice(0, 30), poolSize: candidates.length })
}))

// Rate another user (5 hearts, one rating per pair, updatable).
app.post('/api/rate', asyncRoute(async (req, res) => {
  const { fromUserId, toUserId, stars } = req.body || {}
  if (!fromUserId || !toUserId || !stars) return res.status(400).json({ error: 'fromUserId, toUserId, stars required' })
  if (fromUserId === toUserId) return res.status(400).json({ error: 'cannot rate yourself' })
  const s = Math.max(1, Math.min(5, Math.round(stars)))

  await collections.ratings().updateOne(
    { fromUserId, toUserId },
    { $set: { stars: s, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  )
  const result = await recomputeRating(toUserId)
  res.json({ ok: true, ...result })
}))

// Report a user.
app.post('/api/report', asyncRoute(async (req, res) => {
  const { reporterId, reportedId, reason, roomId } = req.body || {}
  if (!reportedId) return res.status(400).json({ error: 'reportedId required' })
  await collections.reports().insertOne({
    reporterId: reporterId || null, reportedId, reason: reason || 'unspecified',
    roomId: roomId || null, createdAt: new Date(),
  })
  res.json({ ok: true })
}))

// Recent chat history for a room.
app.get('/api/messages/:roomId', asyncRoute(async (req, res) => {
  const msgs = await collections.messages()
    .find({ roomId: req.params.roomId })
    .sort({ createdAt: 1 })
    .limit(200)
    .toArray()
  res.json({ messages: msgs })
}))

// ── Socket.IO (real-time chat + presence) ────────────────────
io.on('connection', (socket) => {
  socket.on('register', ({ userId }) => {
    if (!userId) return
    markOnline(userId, socket.id)
    collections.users().updateOne({ userId }, { $set: { lastSeen: new Date() } }).catch(() => {})
  })

  socket.on('join_room', async ({ roomId, userId, username }) => {
    socket.join(roomId)
    if (userId) markOnline(userId, socket.id)
    // Send recent history so both sides see the same conversation.
    try {
      const history = await collections.messages()
        .find({ roomId }).sort({ createdAt: 1 }).limit(200).toArray()
      socket.emit('history', { roomId, messages: history })
    } catch (e) {
      console.error('[socket] history error:', e.message)
    }
    socket.to(roomId).emit('user_joined', { userId, username })
  })

  socket.on('message', async (msg) => {
    if (!msg || !msg.roomId || !msg.text) return
    const record = {
      id: msg.id,
      roomId: msg.roomId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      text: String(msg.text).slice(0, 2000),
      createdAt: new Date(msg.timestamp || Date.now()),
    }
    try {
      await collections.messages().insertOne(record)
    } catch (e) {
      console.error('[socket] message persist error:', e.message)
    }
    socket.to(msg.roomId).emit('message', { ...msg, isMe: false })
  })

  socket.on('typing', ({ roomId, userId }) => {
    socket.to(roomId).emit('typing', { userId })
  })

  socket.on('leave_room', ({ roomId, userId }) => {
    socket.leave(roomId)
    socket.to(roomId).emit('user_left', { userId })
  })

  socket.on('disconnect', () => {
    const userId = markOffline(socket.id)
    if (userId) {
      collections.users().updateOne({ userId }, { $set: { lastSeen: new Date() } }).catch(() => {})
    }
  })
})

// ── Boot ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`\n🌸 SoftMatch backend running on http://localhost:${PORT}`)
      console.log(`   MongoDB connected · Socket.IO ready\n`)
    })
  })
  .catch(err => {
    console.error('[fatal] could not start:', err.message)
    process.exit(1)
  })
