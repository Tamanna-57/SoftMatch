// ─────────────────────────────────────────────────────────────
//  Soft — the SoftMatch AI companion
//
//  This module does two jobs:
//   1. Generate a warm, reflective reply to whatever the user says.
//   2. Quietly extract "signals" (interests, vibes, mood) from the
//      conversation so we can pre-fill the matching profile.
//
//  It runs fully offline (rule-based) so the app works with no API
//  key. If you wire up a real LLM (see backend/server.js → /api/companion),
//  swap `companionReply` for `fetchCompanionReply` — the signal
//  extraction below stays identical either way.
// ─────────────────────────────────────────────────────────────

import { INTEREST_OPTIONS, VIBE_OPTIONS } from './matching'

// Words that hint at a canonical interest
const INTEREST_HINTS = {
  tech: ['tech', 'coding', 'code', 'programming', 'developer', 'software', 'engineer', 'ai', 'ml', 'computer'],
  startups: ['startup', 'founder', 'build', 'building', 'product', 'entrepreneur', 'business', 'saas', 'co-founder'],
  music: ['music', 'song', 'songs', 'album', 'guitar', 'piano', 'singing', 'spotify', 'band', 'lofi'],
  books: ['book', 'books', 'reading', 'read', 'novel', 'author', 'literature', 'kindle'],
  gaming: ['game', 'gaming', 'gamer', 'valorant', 'minecraft', 'playstation', 'xbox', 'steam', 'rpg'],
  design: ['design', 'designer', 'ui', 'ux', 'figma', 'aesthetic', 'typography', 'branding'],
  philosophy: ['philosophy', 'meaning', 'existential', 'consciousness', 'stoic', 'nihilism', 'why we exist'],
  films: ['film', 'films', 'movie', 'movies', 'cinema', 'netflix', 'series', 'show', 'anime'],
  science: ['science', 'physics', 'space', 'astronomy', 'biology', 'chemistry', 'research', 'universe'],
  art: ['art', 'painting', 'drawing', 'sketch', 'illustration', 'creative', 'gallery'],
  fitness: ['gym', 'fitness', 'workout', 'running', 'lifting', 'yoga', 'health', 'training'],
  travel: ['travel', 'trip', 'traveling', 'mountains', 'beach', 'backpacking', 'wanderlust'],
  food: ['food', 'cooking', 'cook', 'foodie', 'baking', 'recipe', 'restaurant', 'coffee'],
  politics: ['politics', 'political', 'government', 'policy', 'election', 'society'],
  finance: ['finance', 'money', 'investing', 'stocks', 'crypto', 'trading', 'markets', 'wealth'],
}

// Words that hint at a canonical vibe
const VIBE_HINTS = {
  introvert: ['introvert', 'alone', 'quiet', 'shy', 'recharge alone', 'small group'],
  extrovert: ['extrovert', 'social', 'people person', 'parties', 'love crowds', 'outgoing'],
  'night owl': ['night owl', 'late night', 'cant sleep', "can't sleep", '3am', 'nocturnal', 'midnight'],
  'early bird': ['early bird', 'morning person', 'sunrise', 'wake up early'],
  overthinker: ['overthink', 'overthinking', 'anxious', 'in my head', 'spiral', 'cant stop thinking'],
  builder: ['build', 'building', 'maker', 'side project', 'ship', 'create things'],
  empath: ['empath', 'sensitive', 'feel things deeply', 'i care', 'emotional', 'good listener'],
  'chaotic energy': ['chaotic', 'random', 'all over the place', 'spontaneous', 'unhinged', 'wild'],
  'calm energy': ['calm', 'chill', 'relaxed', 'peaceful', 'grounded', 'mellow'],
  ambitious: ['ambitious', 'driven', 'goals', 'grind', 'hustle', 'want more', 'big plans'],
  creative: ['creative', 'imagination', 'ideas', 'artistic', 'write', 'make'],
  analytical: ['analytical', 'logical', 'data', 'rational', 'systems', 'breakdown'],
}

const MOOD_HINTS = {
  lonely: ['lonely', 'alone', 'isolated', 'no one to talk', 'nobody'],
  stressed: ['stressed', 'overwhelmed', 'pressure', 'burnt out', 'burnout', 'too much'],
  sad: ['sad', 'down', 'low', 'depressed', 'crying', 'heavy', 'rough day'],
  motivated: ['motivated', 'excited', 'pumped', 'inspired', 'ready', 'fired up'],
  curious: ['curious', 'wondering', 'what if', 'thinking about', 'fascinated'],
  chill: ['chill', 'bored', 'relaxing', 'nothing much', 'just vibing'],
}

function findHits(text, hintMap, allowed) {
  const lower = ` ${text.toLowerCase()} `
  const found = new Set()
  for (const [canonical, words] of Object.entries(hintMap)) {
    if (allowed && !allowed.includes(canonical)) continue
    if (words.some(w => lower.includes(w))) found.add(canonical)
  }
  return [...found]
}

// Pull interests / vibes / moods out of a single user message
export function extractSignals(text) {
  return {
    interests: findHits(text, INTEREST_HINTS, INTEREST_OPTIONS),
    vibes: findHits(text, VIBE_HINTS, VIBE_OPTIONS),
    moods: findHits(text, MOOD_HINTS),
  }
}

// ── Reply generation (offline / rule-based) ──────────────────

const OPENERS = [
  "hey — i'm Soft. no pressure here, no forms to fill. what's actually on your mind right now?",
  "hi, i'm Soft 🌸 think of this as a low-key warm-up before you meet people. what's your headspace today?",
  "hey there. i'm Soft. tell me anything — a thought, a mood, a rabbit hole you're in. i'll figure out who you'd click with.",
]

const REFLECT = [
  "that's real. ",
  "i hear you. ",
  "ok i like where this is going. ",
  "mm, that says a lot about you actually. ",
  "noted — and honestly relatable. ",
  "yeah, that tracks. ",
]

const MOOD_REPLIES = {
  lonely: "loneliness is sneaky like that — being around people doesn't always fix it, the right person does. i'll keep that in mind for your matches. ",
  stressed: "sounds like a lot is sitting on you right now. you don't have to perform here. ",
  sad: "thanks for saying it out loud — that takes something. i'm not going anywhere. ",
  motivated: "love that energy. let's point it somewhere good. ",
  curious: "a curious mind is the best kind to match. ",
  chill: "chill is a whole vibe, no notes. ",
}

const INTEREST_FOLLOWUPS = {
  tech: "what are you building or breaking lately?",
  startups: "are you chasing an idea right now, or looking for the people to chase one with?",
  music: "what's been on repeat for you this week?",
  books: "what's the last thing you read that stuck with you?",
  gaming: "solo grind or chaotic-with-friends kind of player?",
  design: "what makes something feel 'right' to you when you design?",
  philosophy: "ok deep one — what question have you been circling lately?",
  films: "what's a film or show you'd make a stranger watch?",
  science: "what's a thing about the universe that breaks your brain a little?",
  art: "do you make art, or mostly get lost in other people's?",
  fitness: "is it more about the body or the headspace for you?",
  travel: "where's the one place that changed how you see things?",
  food: "comfort food or chaos experiments in the kitchen?",
  politics: "what's something you wish more people actually talked about?",
  finance: "are you the spreadsheet type or the 'figure it out' type?",
}

const VIBE_FOLLOWUPS = {
  introvert: "do you recharge best in silence or with one specific person?",
  extrovert: "what kind of energy makes a conversation click for you?",
  'night owl': "what's your brain usually chewing on at 2am?",
  overthinker: "what's the loop running in your head most often?",
  builder: "what's the thing you keep wanting to make?",
  empath: "do people tend to open up to you?",
  ambitious: "what's the thing you secretly want but don't say out loud?",
  creative: "where do your best ideas usually show up?",
}

const GENERIC_FOLLOWUPS = [
  "tell me more — what's underneath that?",
  "what made today feel like today?",
  "if you could talk to one kind of person right now, what would they be like?",
  "what's something you'd never put on a normal dating profile, but matters?",
  "deep talks or easy banter — which do you need more this week?",
  "what's a small thing that's been making you happy lately?",
]

function pick(arr, seed) {
  return arr[Math.abs(seed) % arr.length]
}

export function getOpener() {
  return pick(OPENERS, Date.now())
}

// Build a reply locally. `turn` = index of this exchange (for variety).
export function companionReply(userText, signals, turn = 0) {
  const parts = []
  parts.push(pick(REFLECT, userText.length + turn))

  if (signals.moods.length) {
    parts.push(MOOD_REPLIES[signals.moods[0]] || '')
  }

  // Prefer an interest-aware follow-up, then vibe, then generic
  let followup
  if (signals.interests.length) {
    const key = signals.interests[signals.interests.length - 1]
    followup = INTEREST_FOLLOWUPS[key]
  } else if (signals.vibes.length && VIBE_FOLLOWUPS[signals.vibes[0]]) {
    followup = VIBE_FOLLOWUPS[signals.vibes[0]]
  }
  if (!followup) followup = pick(GENERIC_FOLLOWUPS, userText.length * 3 + turn)

  parts.push(followup)
  return parts.join('').trim()
}

// Suggested quick-reply chips to keep things low-pressure
export const QUICK_PROMPTS = [
  "honestly just feeling a bit lonely",
  "i want deep conversations, not small talk",
  "i'm building something and need my people",
  "late night thoughts hit different",
  "looking for someone to vibe with, no pressure",
]

// ── Optional: real LLM via backend ───────────────────────────
// Wire ANTHROPIC_API_KEY in backend/.env and this will light up.
export async function fetchCompanionReply(history) {
  const base = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'
  const res = await fetch(`${base}/api/companion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history }),
  })
  if (!res.ok) throw new Error('companion unavailable')
  const data = await res.json()
  return data.reply
}
