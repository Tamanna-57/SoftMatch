import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { getRatingLabel, getCompatibilityColor } from '../utils/matching'
import { api } from '../utils/api'
import { connectSocket } from '../utils/socket'
import styles from './Matches.module.css'

export default function Matches() {
  const navigate = useNavigate()
  const { user, profile, prefs, matches, setMatches, setActiveMatch, skipped } = useStore()
  const [searching, setSearching] = useState(true)
  const [error, setError] = useState(null)

  const loadMatches = useCallback(async () => {
    if (!user) return
    setSearching(true)
    setError(null)
    try {
      const { matches: found } = await api.getMatches({
        userId: user.id,
        username: profile.name || user.username,
        profile,
        prefs,
        skipped,
      })
      setMatches(found)
    } catch (e) {
      setError(e.message || 'could not reach the server')
      setMatches([])
    } finally {
      setSearching(false)
    }
  }, [user, profile, prefs, skipped, setMatches])

  useEffect(() => {
    if (!user) { navigate('/'); return }
    // Connect the realtime socket so we're marked online + reachable for chat.
    connectSocket(user.id)
    // Initial load on mount — intentional one-shot fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOpenChat = (match) => {
    setActiveMatch(match)
    navigate(`/chat/${match.id}`)
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
              <button className={styles.refreshBtn} onClick={loadMatches}>
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

              {matches.length === 0 && !error && (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>🌱</div>
                  <p className={styles.emptyTitle}>no two-way matches yet</p>
                  <p className={styles.emptySub}>
                    either your filters are strict, or not enough people are here yet.
                    invite a friend, or loosen a preference.
                  </p>
                  <button className={styles.emptyBtn} onClick={() => navigate('/preferences')}>edit preferences</button>
                </div>
              )}

              {error && (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>⚠️</div>
                  <p className={styles.emptyTitle}>couldn't load matches</p>
                  <p className={styles.emptySub}>{error}</p>
                  <button className={styles.emptyBtn} onClick={loadMatches}>try again</button>
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
  const display = m.profile?.name || m.username
  const r = getRatingLabel(m.rating, m.ratingCount)
  const color = getCompatibilityColor(m.match.score)
  const meta = [m.profile?.age, m.profile?.city, m.profile?.relationship].filter(Boolean).join(' · ')

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
            {m.online && <span className={styles.onlineDot} title="online now" />}
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

      {m.profile?.hobbies?.length > 0 && (
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
