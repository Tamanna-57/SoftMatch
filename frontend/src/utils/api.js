// ─────────────────────────────────────────────────────────────
//  SoftMatch — REST API client
//
//  Talks to the real backend (Express + MongoDB). The base URL is
//  resolved in ./config (VITE_API_URL → localhost proxy → production).
// ─────────────────────────────────────────────────────────────

import { API_BASE } from './config'

const API_URL = API_BASE

let authToken = null
export const setAuthToken = (t) => { authToken = t }

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  let data = null
  try { data = await res.json() } catch { /* no body */ }

  if (!res.ok) {
    const message = data?.error || `request failed (${res.status})`
    throw new Error(message)
  }
  return data
}

export const api = {
  // Matching — upserts the caller and returns ranked two-way matches.
  getMatches: ({ userId, username, profile, prefs, skipped }) =>
    request('/api/matches', { method: 'POST', body: { userId, username, profile, prefs, skipped } }),

  // Save profile + preferences without fetching matches.
  saveProfile: ({ userId, username, profile, prefs }) =>
    request('/api/profile', { method: 'POST', body: { userId, username, profile, prefs } }),

  // Auth
  signup: ({ email, password, userId, username }) =>
    request('/api/auth/signup', { method: 'POST', body: { email, password, userId, username } }),
  login: ({ email, password }) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } }),

  // Social
  rate: ({ fromUserId, toUserId, stars }) =>
    request('/api/rate', { method: 'POST', body: { fromUserId, toUserId, stars } }),
  report: ({ reporterId, reportedId, reason, roomId }) =>
    request('/api/report', { method: 'POST', body: { reporterId, reportedId, reason, roomId } }),

  // Chat history (also delivered over the socket on join)
  messages: (roomId) => request(`/api/messages/${roomId}`),

  stats: () => request('/api/stats'),
}

export { API_URL }
