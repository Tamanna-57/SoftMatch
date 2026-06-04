// Client-side compatibility score calculator
export function calcCompatibility(userA, userB) {
  let score = 0
  let total = 0

  // Intent match — highest weight
  if (userA.intent && userB.intent) {
    total += 35
    if (userA.intent === userB.intent) score += 35
  }

  // Vibe overlap
  if (userA.vibes?.length && userB.vibes?.length) {
    total += 25
    const overlap = userA.vibes.filter(v => userB.vibes.includes(v))
    score += Math.round((overlap.length / Math.max(userA.vibes.length, userB.vibes.length)) * 25)
  }

  // Interest overlap
  if (userA.interests?.length && userB.interests?.length) {
    total += 25
    const overlap = userA.interests.filter(i => userB.interests.includes(i))
    score += Math.round((overlap.length / Math.max(userA.interests.length, userB.interests.length)) * 25)
  }

  // Slider closeness
  if (userA.sliders && userB.sliders) {
    total += 15
    const deepDiff = Math.abs(userA.sliders.deepTalks - userB.sliders.deepTalks)
    const ambDiff = Math.abs(userA.sliders.ambition - userB.sliders.ambition)
    const sliderScore = Math.round((1 - (deepDiff + ambDiff) / 20) * 15)
    score += Math.max(0, sliderScore)
  }

  return total > 0 ? Math.round((score / total) * 100) : 50
}

export const INTENT_LABELS = {
  deep_talk: 'Deep Talk',
  vent_support: 'Vent / Support',
  startup: 'Startup / Build',
  study: 'Study Partner',
  random_fun: 'Random / Fun',
  philosophy: 'Philosophy',
  career: 'Career Talk',
  gaming: 'Gaming',
}

export const VIBE_OPTIONS = [
  'introvert', 'extrovert', 'night owl', 'early bird',
  'overthinker', 'builder', 'empath', 'chaotic energy',
  'calm energy', 'ambitious', 'creative', 'analytical',
]

export const INTEREST_OPTIONS = [
  'tech', 'startups', 'music', 'books', 'gaming',
  'design', 'philosophy', 'films', 'science', 'art',
  'fitness', 'travel', 'food', 'politics', 'finance',
]

export function getTrustLabel(score) {
  if (score >= 80) return { label: 'highly trusted', color: '#16a34a' }
  if (score >= 60) return { label: 'trusted', color: '#df2e68' }
  if (score >= 40) return { label: 'new', color: '#a8929a' }
  return { label: 'caution', color: '#dc2626' }
}

export function getCompatibilityColor(pct) {
  if (pct >= 80) return '#df2e68'
  if (pct >= 60) return '#fb6f99'
  return '#ff97b6'
}
