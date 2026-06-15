import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { rankMatches, getRatingLabel, getCompatibilityColor } from '../utils/matching'
import { CITIES, GENDERS, RELATIONSHIP, SMOKING, HOBBIES } from '../utils/attributes'
import styles from './Matches.module.css'

const NAMES = ['NightThinker','CodeNomad','LostFounder','QuietReader','VelvetBloom','LunarFox','AmberRiver','SilentComet','BoldPoet','CalmLens']

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function sample(arr, n) {
  const a = [...arr].sort(() => Math.random() - 0.5)
  return a.slice(0, n)
}

// A pool of full anonymous profiles. Their prefs are mostly lenient so the
// user's own preferences do the filtering — demonstrating the two-way logic.
function generateDemoPool() {
  return Array.from({ length: 9 }, (_, i) => {
    const ratingCount = Math.floor(Math.random() * 40)
    return {
      id: `demo-${i}`,
      username: `${NAMES[i % NAMES.length]}_${10 + i}`,
      rating: ratingCount ? +(3 + Math.random() * 2).toFixed(1) : 0,
      ratingCount,
      profile: {
        name: Math.random() > 0.5 ? '' : NAMES[i % NAMES.length],
        age: 19 + Math.floor(Math.random() * 16),
        gender: rand(GENDERS),
        city: rand(CITIES),
        relationship: rand(RELATIONSHIP),
        smoking: rand(SMOKING),
        drinking: rand(['never', 'socially', 'regularly']),
        kids: rand(["don't have", 'want someday', "don't want"]),
        politics: null,
        hobbies: sample(HOBBIES, 3 + Math.floor(Math.random() * 3)),
        bio: '',
      },
      // lenient: they accept anyone (so the user's filters are what matters)
      prefs: { ageMin: 18, ageMax: 60, gender: [], city: [], relationship: [], smoking: [], drinking: [], kids: [] },
    }
  })
}

export default function Matches() {
  const navigate = useNavigate()
  const { user, profile, prefs, matches, setMatches, setActiveMatch, skipped } = useStore()
  const [searching, setSearching] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/'); return }
    setSearching(true)
    const t = setTimeout(() => {
      const me = { profile, prefs }
      const pool = generateDemoPool().filter(c => !skipped.includes(c.id))
      setMatches(rankMatches(me, pool))
      setSearching(false)
    }, 1400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOpenChat = (match) => {
    setActiveMatch(match)
    navigate(`/chat/${match.id}`)
  }

  const reroll = () => {
    setSearching(true)
    setMatches([])
    setTimeout(() => {
      const pool = generateDemoPool().filter(c => !skipped.includes(c.id))
      setMatches(rankMatches({ profile, prefs }, pool))
      setSearching(false)
    }, 1000)
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => navigate('/preferences')}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className={styles.appLogo}>SoftMatch</span>
        <button className={styles.profileBtn} onClick={() => navigate('/profile')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className={styles.content}>
        {searching ? (
          <div className={styles.searching}>
            <motion.div className={styles.searchRing}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
            <p className={styles.searchText}>finding people who fit both ways…</p>
            <p className={styles.searchSub}>they match you · you match them</p>
          </div>
        ) : (
          <>
            <div className={styles.pageHeader}>
              <div>
                <h2 className={styles.pageTitle}>your matches</h2>
                <p className={styles.pageSub}>
                  {matches.length} {matches.length === 1 ? 'person fits' : 'people fit'} both ways
                </p>
              </div>
              <button className={styles.refreshBtn} onClick={reroll}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 8a6 6 0 11-2-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M14 3v3h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className={styles.list}>
              <AnimatePresence>
                {matches.map((m, idx) => (
                  <MatchCard key={m.id} m={m} idx={idx} onOpen={() => handleOpenChat(m)} />
                ))}
              </AnimatePresence>

              {matches.length === 0 && (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>🔍</div>
                  <p className={styles.emptyTitle}>no two-way matches yet</p>
                  <p className={styles.emptySub}>your filters might be strict. try loosening a preference.</p>
                  <button className={styles.emptyBtn} onClick={() => navigate('/preferences')}>edit preferences</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MatchCard({ m, idx, onOpen }) {
  const display = m.profile.name || m.username
  const r = getRatingLabel(m.rating, m.ratingCount)
  const color = getCompatibilityColor(m.match.score)
  const meta = [m.profile.age, m.profile.city, m.profile.relationship].filter(Boolean).join(' · ')

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ delay: idx * 0.06, duration: 0.4 }}
      whileHover={{ y: -2 }}
      onClick={onOpen}
    >
      <div className={styles.cardTop}>
        <div className={styles.avatar}>{display.slice(0, 2).toUpperCase()}</div>
        <div className={styles.cardInfo}>
          <div className={styles.cardName}>
            {display}
            <span className={styles.ratingBadge} style={{ color: r.color, borderColor: r.color + '40', background: r.color + '12' }}>
              {m.ratingCount ? `★ ${m.rating}` : '☆'} · {r.label}
            </span>
          </div>
          {meta && <div className={styles.cardMeta}>{meta}</div>}
        </div>
        <div className={styles.score} style={{ color }}>{m.match.score}%</div>
      </div>

      {m.match.reasons.length > 0 && (
        <ul className={styles.reasons}>
          {m.match.reasons.slice(0, 3).map((reason, i) => (
            <li key={i}><span className={styles.check}>✓</span> {reason}</li>
          ))}
        </ul>
      )}

      {m.profile.hobbies?.length > 0 && (
        <div className={styles.tagRow}>
          {m.profile.hobbies.slice(0, 4).map(h => <span key={h} className={styles.tag}>{h}</span>)}
        </div>
      )}

      <div className={styles.cardBottom}>
        <div className={styles.bar}>
          <motion.div className={styles.barFill}
            initial={{ width: 0 }} animate={{ width: `${m.match.score}%` }}
            transition={{ delay: 0.3, duration: 0.6 }} style={{ background: color }} />
        </div>
        <span className={styles.startChat}>start chat →</span>
      </div>
    </motion.div>
  )
}
