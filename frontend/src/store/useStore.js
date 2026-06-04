import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

const ADJECTIVES = ['Night','Lost','Quiet','Deep','Lunar','Cosmic','Hollow','Lucid','Silent','Drifting','Soft','Bold','Neon','Faded','Wild','Calm','Stark','Vivid']
const NOUNS = ['Thinker','Nomad','Founder','Reader','Builder','Dreamer','Cipher','Wanderer','Coder','Poet','Mind','Sparrow','Echo','Signal','Ghost','Lens']

function generateUsername() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 90) + 10
  return `${adj}${noun}_${num}`
}

const useStore = create(
  persist(
    (set, get) => ({
      // User identity
      user: null,
      initUser: () => {
        if (!get().user) {
          set({
            user: {
              id: uuidv4(),
              username: generateUsername(),
              createdAt: Date.now(),
              trustScore: 50,
              conversationCount: 0,
              isLoggedIn: false,
            }
          })
        }
      },
      updateUser: (updates) => set(state => ({ user: { ...state.user, ...updates } })),
      setLoggedIn: (status) => set(state => ({ user: { ...state.user, isLoggedIn: status } })),

      // Onboarding
      onboardingComplete: false,
      intent: null,
      vibes: [],
      interests: [],
      sliders: { deepTalks: 7, ambition: 5 },

      setIntent: (intent) => set({ intent }),
      toggleVibe: (vibe) => set(state => ({
        vibes: state.vibes.includes(vibe)
          ? state.vibes.filter(v => v !== vibe)
          : [...state.vibes, vibe]
      })),
      toggleInterest: (interest) => set(state => ({
        interests: state.interests.includes(interest)
          ? state.interests.filter(i => i !== interest)
          : [...state.interests, interest]
      })),
      setSlider: (key, val) => set(state => ({ sliders: { ...state.sliders, [key]: val } })),
      completeOnboarding: () => set({ onboardingComplete: true }),
      resetOnboarding: () => set({ onboardingComplete: false, intent: null, vibes: [], interests: [], sliders: { deepTalks: 7, ambition: 5 } }),

      // AI Companion ("Soft")
      companionMessages: [],
      companionSignals: { interests: [], vibes: [], moods: [] },
      addCompanionMessage: (message) => set(state => ({
        companionMessages: [...state.companionMessages, message]
      })),
      mergeCompanionSignals: (signals) => set(state => {
        const merge = (a, b) => [...new Set([...a, ...b])]
        return {
          companionSignals: {
            interests: merge(state.companionSignals.interests, signals.interests),
            vibes: merge(state.companionSignals.vibes, signals.vibes),
            moods: merge(state.companionSignals.moods, signals.moods),
          }
        }
      }),
      // Push what Soft learned into the real matching profile
      applyCompanionSignals: () => set(state => {
        const merge = (a, b) => [...new Set([...a, ...b])]
        return {
          interests: merge(state.interests, state.companionSignals.interests),
          vibes: merge(state.vibes, state.companionSignals.vibes),
        }
      }),
      resetCompanion: () => set({ companionMessages: [], companionSignals: { interests: [], vibes: [], moods: [] } }),

      // Matches
      matches: [],
      setMatches: (matches) => set({ matches }),

      // Active chat
      activeMatch: null,
      setActiveMatch: (match) => set({ activeMatch: match }),

      // Messages per conversation
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

      // UI state
      currentPage: 'welcome',
      setPage: (page) => set({ currentPage: page }),

      // Notifications
      notifications: [],
      addNotification: (notif) => set(state => ({
        notifications: [{ id: uuidv4(), ...notif }, ...state.notifications].slice(0, 20)
      })),
      clearNotification: (id) => set(state => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
    }),
    {
      name: 'softmatch-storage',
      partialize: (state) => ({
        user: state.user,
        onboardingComplete: state.onboardingComplete,
        intent: state.intent,
        vibes: state.vibes,
        interests: state.interests,
        sliders: state.sliders,
        conversations: state.conversations,
        companionMessages: state.companionMessages,
        companionSignals: state.companionSignals,
      })
    }
  )
)

export default useStore
