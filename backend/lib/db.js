// ─────────────────────────────────────────────────────────────
//  SoftMatch — MongoDB connection (MongoDB Atlas)
//
//  Set MONGODB_URI to your Atlas connection string, e.g.
//  mongodb+srv://user:pass@cluster.xxxx.mongodb.net/softmatch
// ─────────────────────────────────────────────────────────────

const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || 'softmatch'

let client = null
let db = null

async function connectDB() {
  if (db) return db
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Create a free MongoDB Atlas cluster and put its ' +
      'connection string in backend/.env (see backend/.env.example).'
    )
  }

  client = new MongoClient(uri, {
    // sensible defaults for a small app on Cloud Run
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
  })
  await client.connect()
  db = client.db(dbName)
  await ensureIndexes(db)
  console.log(`[db] connected to MongoDB (${dbName})`)
  return db
}

async function ensureIndexes(db) {
  // Unique email for permanent accounts (sparse: anonymous users have none)
  await db.collection('users').createIndex(
    { email: 1 },
    { unique: true, sparse: true }
  )
  // Fast lookup / upsert by the client-generated userId
  await db.collection('users').createIndex({ userId: 1 }, { unique: true })
  // Only registered, onboarded users are matchable — index for the scan
  await db.collection('users').createIndex({ onboarded: 1, lastSeen: -1 })
  // One rating per (rater → ratee); also lets us recompute aggregates
  await db.collection('ratings').createIndex(
    { fromUserId: 1, toUserId: 1 },
    { unique: true }
  )
  await db.collection('ratings').createIndex({ toUserId: 1 })
  // Chat messages, fetched per room, auto-expire after 7 days (privacy)
  await db.collection('messages').createIndex({ roomId: 1, createdAt: 1 })
  await db.collection('messages').createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 60 * 60 * 24 * 7 }
  )
  await db.collection('reports').createIndex({ reportedId: 1 })
}

function getDB() {
  if (!db) throw new Error('DB not connected — call connectDB() first')
  return db
}

const collections = {
  users: () => getDB().collection('users'),
  ratings: () => getDB().collection('ratings'),
  messages: () => getDB().collection('messages'),
  reports: () => getDB().collection('reports'),
}

async function closeDB() {
  if (client) await client.close()
  client = null
  db = null
}

module.exports = { connectDB, getDB, closeDB, collections }
