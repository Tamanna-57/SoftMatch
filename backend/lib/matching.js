// ─────────────────────────────────────────────────────────────
//  SoftMatch — two-way matching engine (server)
//
//  A match is valid ONLY when BOTH directions are satisfied:
//   • my profile fits YOUR preferences, AND
//   • your profile fits MY preferences.
//
//  Mirrors frontend/src/utils/matching.js so the client and server
//  agree on what a match is. The server is the source of truth: it
//  ranks every other registered user against the requester.
// ─────────────────────────────────────────────────────────────

const { FILTERABLE } = require('./attributes')

// Does `targetProfile` satisfy `viewerPrefs`?
// Missing data on the target is treated as "unknown → don't hard-block".
function directionCheck(viewerPrefs = {}, targetProfile = {}) {
  const reasons = []
  const blockers = []

  // Age range
  if (targetProfile.age != null) {
    const min = viewerPrefs.ageMin ?? 18
    const max = viewerPrefs.ageMax ?? 60
    if (targetProfile.age < min || targetProfile.age > max) {
      blockers.push(`age ${targetProfile.age} is outside wanted ${min}–${max}`)
    } else if (min > 18 || max < 60) {
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

// Soft compatibility (only among already-valid matches) → 0-100 ranking score
function softScore(me, other) {
  let score = 40 // base for a clean two-way pass
  const reasons = []

  const myHob = me.profile?.hobbies || []
  const otherHob = other.profile?.hobbies || []
  if (myHob.length && otherHob.length) {
    const shared = myHob.filter(h => otherHob.includes(h))
    if (shared.length) {
      score += Math.min(30, shared.length * 10)
      reasons.push(`${shared.length} shared ${shared.length === 1 ? 'hobby' : 'hobbies'}: ${shared.slice(0, 3).join(', ')}`)
    }
  }

  if (me.profile?.relationship && me.profile.relationship === other.profile?.relationship) {
    score += 18
    reasons.push(`both want ${other.profile.relationship}`)
  }

  if (me.profile?.city && me.profile.city === other.profile?.city) {
    score += 8
    reasons.push(`both in ${other.profile.city}`)
  }

  if (other.rating) score += Math.round((other.rating / 5) * 4)

  return { score: Math.min(100, score), reasons }
}

// Full match between `me` and `other`. Both are { profile, prefs, rating, ... }
function matchProfiles(me, other) {
  const mineFitsThem = directionCheck(other.prefs, me.profile) // their wishes vs my profile
  const theyFitMe = directionCheck(me.prefs, other.profile)    // my wishes vs their profile

  const ok = mineFitsThem.ok && theyFitMe.ok
  const soft = softScore(me, other)

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
function rankMatches(me, pool) {
  return pool
    .map(other => ({ ...other, match: matchProfiles(me, other) }))
    .filter(c => c.match.ok)
    .sort((a, b) => b.match.score - a.match.score)
}

module.exports = { directionCheck, softScore, matchProfiles, rankMatches }
