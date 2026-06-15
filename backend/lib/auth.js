// ─────────────────────────────────────────────────────────────
//  SoftMatch — auth helpers (bcrypt password hashing + JWT)
// ─────────────────────────────────────────────────────────────

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me'
const TOKEN_TTL = '30d'

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10)
}

async function verifyPassword(plain, hash) {
  if (!hash) return false
  return bcrypt.compare(plain, hash)
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL })
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

// Express middleware — optional auth: attaches req.auth if a valid bearer token
// is present, but does not reject anonymous requests.
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  req.auth = token ? verifyToken(token) : null
  next()
}

module.exports = {
  hashPassword, verifyPassword, signToken, verifyToken, optionalAuth, JWT_SECRET,
}
