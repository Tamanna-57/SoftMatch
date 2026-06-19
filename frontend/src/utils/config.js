// ─────────────────────────────────────────────────────────────
//  SoftMatch — backend URL resolution (REST + Socket.IO share it)
//
//  Priority:
//   1. VITE_API_URL set at build time (recommended for custom deploys)
//   2. running on localhost → '' so the Vite dev proxy forwards to :3001
//   3. otherwise (deployed, e.g. on Vercel) → the production backend
//
//  Baking in the production URL means the app works even if the build
//  env var is missing — which removes a whole class of deploy headaches.
// ─────────────────────────────────────────────────────────────

// Change this if your backend ever moves to a different host.
const PRODUCTION_API_URL = 'https://softmatch.onrender.com'

const buildTimeUrl = import.meta.env.VITE_API_URL

const isLocalhost =
  typeof window !== 'undefined' &&
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(window.location.hostname)

export const API_BASE =
  (buildTimeUrl && buildTimeUrl.trim().replace(/\/+$/, '')) ||
  (isLocalhost ? '' : PRODUCTION_API_URL)
