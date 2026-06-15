// ─────────────────────────────────────────────────────────────
//  SoftMatch — two-way matching engine
//
//  A match is valid ONLY when BOTH directions are satisfied:
//   • my profile fits YOUR preferences, AND
//   • your profile fits MY preferences.
//
//  This is the fix for the "Delhi ↔ Delhi" problem: it's not about
//  having the same interest, it's about each person's reality
//  satisfying the other's wishes.
// ─────────────────────────────────────────────────────────────

import { FILTERABLE } from './attributes'

// Does `target`'s profile satisfy `viewer`'s preferences?
// Missing data on the target is treated as "unknown → don't hard-block"
// (fields are optional, so we never punish someone for leaving a blank).
function directionCheck(viewerPrefs, targetProfile) {
  const reasons = []
  const blockers = []

  // Age range
  if (targetProfile.age != null) {
    if (targetProfile.age < viewerPrefs.ageMin || targetProfile.age > viewerPrefs.ageMax) {
      blockers.push(`age ${targetProfile.age} is outside wanted ${viewerPrefs.ageMin}–${viewerPrefs.ageMax}`)
    } else if (viewerPrefs.ageMin > 18 || viewerPrefs.ageMax < 60) {
      reasons.push(`age fits (${targetProfile.age})`)
    }
  }

  // Set-based fields (gender, city, relationship, smoking, drinking, kids)
  for (const { key, label } of FILTERABLE) {
    const wanted = viewerPrefs[key]
    if (!wanted || wanted.length === 0) continue // "don't care"
    const value = targetProfile[key]
    if (value == null) continue // they didn't share it — don't block
    if (wanted.includes(value)) {
      reasons.push(`${label}: ${value}`)
    } else {
      blockers.push(`${label} is "${value}", you wanted ${wanted.join(' / ')}`)
    }
  }

  return { ok: blockers.length === 0, reasons, blockers }
}

// Soft compatibility (only among already-valid matches) → ranking score 0-100
function softScore(me, other) {
  let score = 40 // base for a clean two-way pass
  const reasons = []

  // Shared hobbies
  const myHob = me.profile.hobbies || []
  const otherHob = other.profile.hobbies || []
  if (myHob.length && otherHob.length) {
    const shared = myHob.filter(h => otherHob.includes(h))
    if (shared.length) {
      score += Math.min(30, shared.length * 10)
      reasons.push(`${shared.length} shared ${shared.length === 1 ? 'hobby' : 'hobbies'}: ${shared.slice(0, 3).join(', ')}`)
    }
  }

  // Same relationship goal
  if (me.profile.relationship && me.profile.relationship === other.profile.relationship) {
    score += 18
    reasons.push(`both want ${other.profile.relationship}`)
  }

  // Same city (nice-to-have bonus, not required)
  if (me.profile.city && me.profile.city === other.profile.city) {
    score += 8
    reasons.push(`both in ${other.profile.city}`)
  }

  // Credibility weight from rating
  if (other.rating) score += Math.round((other.rating / 5) * 4)

  return { score: Math.min(100, score), reasons }
}

// Full match between `me` and `other`. Both are { profile, prefs, rating, ... }
export function matchProfiles(me, other) {
  const mineFitsThem = directionCheck(other.prefs, me.profile) // their wishes vs my profile
  const theyFitMe = directionCheck(me.prefs, other.profile)    // my wishes vs their profile

  const ok = mineFitsThem.ok && theyFitMe.ok
  const soft = softScore(me, other)

  // Reasons shown to the user are framed from their side ("they fit you")
  const reasons = [...new Set([...theyFitMe.reasons, ...soft.reasons])]

  return {
    ok,
    score: ok ? soft.score : 0,
    reasons,
    blockers: [
      ...theyFitMe.blockers.map(b => `they ${b}`),
      ...mineFitsThem.blockers.map(b => `you ${b} (their preference)`),
    ],
  }
}

// Given me + a pool of candidates, return ranked valid matches.
export function rankMatches(me, pool) {
  return pool
    .map(other => ({ ...other, match: matchProfiles(me, other) }))
    .filter(c => c.match.ok)
    .sort((a, b) => b.match.score - a.match.score)
}

// ── Rating / credibility helpers ─────────────────────────────
export function getRatingLabel(rating, count) {
  if (!count || count === 0) return { label: 'new here', color: '#a8929a' }
  if (rating >= 4.3) return { label: 'highly rated', color: '#16a34a' }
  if (rating >= 3.5) return { label: 'well rated', color: '#df2e68' }
  if (rating >= 2.5) return { label: 'mixed', color: '#d97706' }
  return { label: 'caution', color: '#dc2626' }
}

export function getCompatibilityColor(pct) {
  if (pct >= 80) return '#df2e68'
  if (pct >= 60) return '#fb6f99'
  return '#ff97b6'
}
