const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  }
})

app.use(cors())
app.use(express.json())

// In-memory store (replace with DB: MongoDB/Postgres/SQLite)
const onlineUsers = new Map()   // socketId -> user profile
const userSockets = new Map()   // userId -> socketId
const rooms = new Map()         // roomId -> [userId, userId]

// --- Matching Algorithm ---
function calcCompatibility(a, b) {
  let score = 0, total = 0

  if (a.intent && b.intent) {
    total += 35
    if (a.intent === b.intent) score += 35
  }

  const vibesA = a.vibes || [], vibesB = b.vibes || []
  if (vibesA.length && vibesB.length) {
    total += 25
    const overlap = vibesA.filter(v => vibesB.includes(v))
    score += Math.round((overlap.length / Math.max(vibesA.length, vibesB.length)) * 25)
  }

  const intA = a.interests || [], intB = b.interests || []
  if (intA.length && intB.length) {
    total += 25
    const overlap = intA.filter(i => intB.includes(i))
    score += Math.round((overlap.length / Math.max(intA.length, intB.length)) * 25)
  }

  if (a.sliders && b.sliders) {
    total += 15
    const deepDiff = Math.abs((a.sliders.deepTalks || 5) - (b.sliders.deepTalks || 5))
    const ambDiff = Math.abs((a.sliders.ambition || 5) - (b.sliders.ambition || 5))
    const s = Math.round((1 - (deepDiff + ambDiff) / 20) * 15)
    score += Math.max(0, s)
  }

  return total > 0 ? Math.round((score / total) * 100) : 50
}

function findMatches(requester) {
  const candidates = []
  for (const [socketId, user] of onlineUsers) {
    if (user.userId === requester.userId) continue
    const compat = calcCompatibility(requester, user)
    if (compat >= 20) {
      candidates.push({ ...user, compatibility: compat })
    }
  }
  return candidates.sort((a, b) => b.compatibility - a.compatibility).slice(0, 8)
}

// --- REST API ---
app.get('/health', (req, res) => res.json({ status: 'ok', onlineUsers: onlineUsers.size }))

app.get('/api/stats', (req, res) => {
  res.json({
    onlineUsers: onlineUsers.size,
    activeRooms: rooms.size,
  })
})

// --- AI Companion ("Soft") ---
// Optional: only lights up if ANTHROPIC_API_KEY is set in the environment.
// The frontend has a full offline fallback, so this is purely an upgrade path.
const SOFT_SYSTEM = `You are "Soft", the warm, low-pressure AI companion inside SoftMatch,
an anonymous matching app. Talk like a thoughtful friend at 2am, never like a form or a therapist bot.
Keep replies short (1-3 sentences), lowercase-casual, emotionally attuned. Ask one gentle follow-up
question that helps reveal the person's interests, vibe, or what kind of connection they need.
Never ask for real names, photos, or personal identifying info.`

app.post('/api/companion', async (req, res) => {
  const { history = [] } = req.body || {}
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    // Tell the client to use its offline brain
    return res.status(503).json({ error: 'companion_offline' })
  }

  try {
    const messages = history.map(m => ({
      role: m.isMe ? 'user' : 'assistant',
      content: m.text,
    }))

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: SOFT_SYSTEM,
        messages,
      }),
    })

    const data = await r.json()
    const reply = data?.content?.[0]?.text?.trim() || "i'm here. tell me more?"
    res.json({ reply })
  } catch (err) {
    console.error('[companion] error:', err.message)
    res.status(503).json({ error: 'companion_offline' })
  }
})

// --- Socket.IO ---
io.on('connection', (socket) => {
  console.log(`[+] connected: ${socket.id}`)

  socket.on('register', ({ userId }) => {
    userSockets.set(userId, socket.id)
    console.log(`[reg] userId=${userId} socket=${socket.id}`)
  })

  socket.on('find_matches', (profile) => {
    // Store in online users
    onlineUsers.set(socket.id, {
      ...profile,
      socketId: socket.id,
      connectedAt: Date.now(),
    })

    userSockets.set(profile.userId, socket.id)

    // Find matches
    const matches = findMatches(profile)
    socket.emit('matches_found', matches)

    // Notify others they might have a new match
    for (const [sid, user] of onlineUsers) {
      if (sid === socket.id) continue
      const compat = calcCompatibility(profile, user)
      if (compat >= 50) {
        io.to(sid).emit('new_match', {
          ...profile,
          compatibility: compat
        })
      }
    }
  })

  socket.on('join_room', ({ roomId, userId, username }) => {
    socket.join(roomId)
    if (!rooms.has(roomId)) rooms.set(roomId, [])
    const roomUsers = rooms.get(roomId)
    if (!roomUsers.includes(userId)) roomUsers.push(userId)
    console.log(`[room] ${username} joined ${roomId}`)
  })

  socket.on('message', (msg) => {
    // Broadcast to room (excluding sender)
    socket.to(msg.roomId).emit('message', msg)
    console.log(`[msg] room=${msg.roomId} from=${msg.senderName}`)
  })

  socket.on('typing', ({ roomId, userId }) => {
    socket.to(roomId).emit('typing', { userId })
  })

  socket.on('leave_room', ({ roomId, userId }) => {
    socket.leave(roomId)
    socket.to(roomId).emit('user_left', { userId })
  })

  socket.on('report_user', ({ reportedId, reason, roomId }) => {
    console.log(`[REPORT] reportedId=${reportedId} reason=${reason}`)
    // In production: store in DB, trigger review, auto-ban on threshold
    socket.emit('report_ack', { success: true })
  })

  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id)
    if (user) {
      console.log(`[-] disconnected: ${user.username || socket.id}`)
      onlineUsers.delete(socket.id)
      userSockets.delete(user.userId)
    }
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`\n🌸 SoftMatch backend running on http://localhost:${PORT}`)
  console.log(`   Socket.IO ready for connections\n`)
})
