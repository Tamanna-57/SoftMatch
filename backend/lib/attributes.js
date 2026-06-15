// ─────────────────────────────────────────────────────────────
//  SoftMatch — shared attribute schema (server copy)
//
//  This MUST stay in sync with frontend/src/utils/attributes.js.
//  Matching relies on profile and preferences sharing the same
//  fields, so a match can be checked both ways.
// ─────────────────────────────────────────────────────────────

const GENDERS = ['woman', 'man', 'non-binary', 'other']

const CITIES = [
  'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Jaipur', 'Ahmedabad', 'Lucknow', 'Other',
]

const SMOKING = ['never', 'sometimes', 'regularly']
const DRINKING = ['never', 'socially', 'regularly']
const KIDS = ["don't have", 'have kids', 'want someday', "don't want"]
const RELATIONSHIP = ['long-term', 'casual', 'friendship', 'figuring it out']
const POLITICS = ['apolitical', 'moderate', 'liberal', 'conservative', 'prefer not to say']

const HOBBIES = [
  'music', 'reading', 'gaming', 'fitness', 'travel', 'cooking',
  'art', 'movies', 'tech', 'sports', 'photography', 'dancing',
  'writing', 'coffee', 'startups', 'nature',
]

// Single-choice profile fields. `match: true` means the field can be
// used as a hard filter in preferences.
const PROFILE_FIELDS = [
  { key: 'gender', label: 'gender', options: GENDERS, match: true },
  { key: 'city', label: 'city', options: CITIES, match: true },
  { key: 'relationship', label: 'looking for', options: RELATIONSHIP, match: true },
  { key: 'smoking', label: 'smoking', options: SMOKING, match: true },
  { key: 'drinking', label: 'drinking', options: DRINKING, match: true },
  { key: 'kids', label: 'kids', options: KIDS, match: true },
  { key: 'politics', label: 'politics', options: POLITICS, match: false },
]

const FILTERABLE = PROFILE_FIELDS.filter(f => f.match)

module.exports = {
  GENDERS, CITIES, SMOKING, DRINKING, KIDS, RELATIONSHIP, POLITICS, HOBBIES,
  PROFILE_FIELDS, FILTERABLE,
}
