import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { emptyProfile, emptyPrefs } from '../utils/attributes'

const ADJECTIVES = ['Night','Lost','Quiet','Deep','Lunar','Cosmic','Hollow','Lucid','Silent','Drifting','Soft','Bold','Neon','Faded','Wild','Calm','Stark','Vivid','Velvet','Amber']
const NOUNS = ['Thinker','Nomad','Founder','Reader','Builder','Dreamer','Cipher','Wanderer','Coder','Poet','Mind','Sparrow','Echo','Signal','Ghost','Lens','Bloom','River','Comet','Fox']

function generateUsername() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 90) + 10
  return `${adj}${noun}_${num}`
}

const useStore = create(
  persist(
    (set, get) => ({
      // ── Identity ──────────────────────────────────────────
      user: null,
      // 'temporary' = anonymous (cache only) | 'permanent' = account
      accountType: null,

      initUser: () => {
        if (!get().user) {
          set({
            user: {
              id: uuidv4(),
              username: generateUsername(),
              createdAt: Date.now(),
              rating: 0,
              ratingCount: 0,
              isLoggedIn: false,
            }
          })
        }
      },
      regenerateName: () => set(state => ({ user: { ...state.user, username: generateUsername() } })),
      updateUser: (updates) => set(state => ({ user: { ...state.user, ...updates } })),
      setAccountType: (type) => set({ accountType: type }),
      setLoggedIn: (status) => set(state => ({
        accountType: status ? 'permanent' : state.accountType,
        user: { ...state.user, isLoggedIn: status }
      })),

      // ── Profile (what you are) ────────────────────────────
      profile: emptyProfile(),
      updateProfile: (updates) => set(state => ({ profile: { ...state.profile, ...updates } })),
      toggleProfileMulti: (field, value) => set(state => {
        const cur = state.profile[field] || []
        return {
          profile: {
            ...state.profile,
            [field]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value],
          }
        }
      }),

      // ── Preferences (what you want) ───────────────────────
      prefs: emptyPrefs(),
      setPref: (key, value) => set(state => ({ prefs: { ...state.prefs, [key]: value } })),
      togglePrefMulti: (field, value) => set(state => {
        const cur = state.prefs[field] || []
        return {
          prefs: {
            ...state.prefs,
            [field]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value],
          }
        }
      }),

      onboardingComplete: false,
      completeOnboarding: () => set({ onboardingComplete: true }),
      resetProfile: () => set({
        onboardingComplete: false,
        profile: emptyProfile(),
        prefs: emptyPrefs(),
      }),

      // ── Matches ───────────────────────────────────────────
      matches: [],
      setMatches: (matches) => set({ matches }),
      activeMatch: null,
      setActiveMatch: (match) => set({ activeMatch: match }),
      // ids the user has skipped this session (so they don't reappear)
      skipped: [],
      skipMatch: (id) => set(state => ({ skipped: [...new Set([...state.skipped, id])] })),

      // ── Ratings the user has given ────────────────────────
      ratingsGiven: {},
      rateMatch: (matchId, stars) => set(state => ({
        ratingsGiven: { ...state.ratingsGiven, [matchId]: stars }
      })),

      // ── Conversations ─────────────────────────────────────
      conversations: {},
      addMessage: (matchId, message) => set(state => ({
        conversations: {
          ...state.conversations,
          [matchId]: [...(state.conversations[matchId] || []), message]
        }
      })),
      clearConversation: (matchId) => set(state => {
        const c = { ...state.conversations }
        delete c[matchId]
        return { conversations: c }
      }),

      // ── UI ────────────────────────────────────────────────
      currentPage: 'welcome',
      setPage: (page) => set({ currentPage: page }),

      notifications: [],
      addNotification: (notif) => set(state => ({
        notifications: [{ id: uuidv4(), ...notif }, ...state.notifications].slice(0, 20)
      })),
      clearNotification: (id) => set(state => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),

      // Wipe everything (used by "chat anonymously → start over" / logout)
      clearIdentity: () => {
        set({
          user: null, accountType: null,
          profile: emptyProfile(), prefs: emptyPrefs(),
          onboardingComplete: false, matches: [], activeMatch: null,
          skipped: [], ratingsGiven: {}, conversations: {},
        })
      },
    }),
    {
      name: 'softmatch-storage',
      // Only persist permanent accounts to "disk"; temporary identities
      // still use localStorage but the UI treats them as cache-only.
      partialize: (state) => ({
        user: state.user,
        accountType: state.accountType,
        profile: state.profile,
        prefs: state.prefs,
        onboardingComplete: state.onboardingComplete,
        ratingsGiven: state.ratingsGiven,
        conversations: state.conversations,
      })
    }
  )
)

export default useStore
