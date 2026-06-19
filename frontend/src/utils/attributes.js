// ─────────────────────────────────────────────────────────────
//  SoftMatch — attribute schema (single source of truth)
//
//  Every profile field and every preference is built from this.
//  Because profile + preferences share the SAME fields, we can do
//  proper two-way matching ("my profile fits your wishes AND yours
//  fits mine") instead of dumb interest-overlap.
//
//  Users only ever PICK from these options — they never invent fields.
// ─────────────────────────────────────────────────────────────

export const GENDERS = ['woman', 'man', 'non-binary', 'other']

export const CITIES = [
  'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Jaipur', 'Ahmedabad', 'Lucknow', 'Other',
]

export const SMOKING = ['never', 'sometimes', 'regularly']
export const DRINKING = ['never', 'socially', 'regularly']
export const KIDS = ["don't have", 'have kids', 'want someday', "don't want"]
export const RELATIONSHIP = ['long-term', 'casual', 'friendship', 'figuring it out']
export const POLITICS = ['apolitical', 'moderate', 'liberal', 'conservative', 'prefer not to say']

export const HOBBIES = [
  'music', 'reading', 'gaming', 'fitness', 'travel', 'cooking',
  'art', 'movies', 'tech', 'sports', 'photography', 'dancing',
  'writing', 'coffee', 'startups', 'nature',
]

// Single-choice profile fields, in display order.
// `match: true` means this field can be used as a hard filter in preferences.
export const PROFILE_FIELDS = [
  { key: 'gender', label: 'gender', icon: '⚧', options: GENDERS, match: true },
  { key: 'city', label: 'city', icon: '📍', options: CITIES, match: true },
  { key: 'relationship', label: 'looking for', icon: '✦', options: RELATIONSHIP, match: true },
  { key: 'smoking', label: 'smoking', icon: '🚬', options: SMOKING, match: true },
  { key: 'drinking', label: 'drinking', icon: '🍷', options: DRINKING, match: true },
  { key: 'kids', label: 'kids', icon: '🧸', options: KIDS, match: true },
  { key: 'politics', label: 'politics', icon: '🗳', options: POLITICS, match: false },
]

// The fields a preference can hard-filter on (everything with match:true).
export const FILTERABLE = PROFILE_FIELDS.filter(f => f.match)

// Empty starting profile
export const emptyProfile = () => ({
  name: '',
  age: null,
  gender: null,
  city: null,
  relationship: null,
  smoking: null,
  drinking: null,
  kids: null,
  politics: null,
  hobbies: [],
  bio: '',
})

// Empty preferences — empty arrays / wide age = "don't care"
export const emptyPrefs = () => ({
  ageMin: 18,
  ageMax: 99,
  gender: [],
  city: [],
  relationship: [],
  smoking: [],
  drinking: [],
  kids: [],
})

export const fieldLabel = (key) =>
  PROFILE_FIELDS.find(f => f.key === key)?.label || key
