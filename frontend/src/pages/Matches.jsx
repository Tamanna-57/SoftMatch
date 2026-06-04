import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { connectSocket } from '../utils/socket'
import { calcCompatibility, getTrustLabel, getCompatibilityColor, INTENT_LABELS } from '../utils/matching'
import styles from './Matches.module.css'

// Generate demo matches for when backend isn't running
function generateDemoMatches(user, intent, vibes, interests, sliders) {
  const names = ['NightThinker','CodeNomad','LostFounder','QuietReader','DeepBuilder','LunarDreamer','SilentCoder','BoldMind']
  const nums = [42, 77, 12, 55, 88, 31, 64, 19]
  const demoVibes = [['night owl','builder','overthinker'],['introvert','calm energy','creative'],['ambitious','builder','night owl'],['empath','introvert','analytical']]
  const demoInterests = [['tech','startups','philosophy'],['books','films','design'],['startups','tech','finance'],['books','music','philosophy']]
  const intents = ['deep_talk','startup','vent_support','philosophy','random_fun']
  const trusts = [82, 71, 55, 90, 43, 67]

  return Array.from({ length: 5 }, (_, i) => {
    const matchUser = {
      intent: intent || intents[i % intents.length],
      vibes: demoVibes[i % demoVibes.length],
      interests: demoInterests[i % demoInterests.length],
      sliders: { deepTalks: 5 + (i % 5), ambition: 4 + (i % 6) },
    }
    const userProfile = { intent, vibes, interests, sliders }
    const compat = calcCompatibility(userProfile, matchUser)
    return {
      id: `demo-${i}`,
      username: `${names[i]}_${nums[i]}`,
      intent: matchUser.intent,
      vibes: matchUser.vibes,
      interests: matchUser.interests,
      trustScore: trusts[i % trusts.length],
      compatibility: compat,
      isDemo: true,
    }
  }).sort((a, b) => b.compatibility - a.compatibility)
}

export default function Matches() {
  const navigate = useNavigate()
  const { user, intent, vibes, interests, sliders, matches, setMatches, setActiveMatch, addNotification } = useStore()
  const [searching, setSearching] = useState(true)
  const [filterIntent, setFilterIntent] = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!user) return

    const socket = connectSocket(user.id)
    socketRef.current = socket

    // Emit user profile to get matches
    socket.emit('find_matches', {
      userId: user.id,
      username: user.username,
      intent,
      vibes,
      interests,
      sliders,
      trustScore: user.trustScore,
    })

    socket.on('matches_found', (serverMatches) => {
      setSearching(false)
      const enriched = serverMatches.map(m => ({
        ...m,
        compatibility: calcCompatibility({ intent, vibes, interests, sliders }, m)
      })).sort((a, b) => b.compatibility - a.compatibility)
      setMatches(enriched)
    })

    socket.on('new_match', (match) => {
      const enriched = { ...match, compatibility: calcCompatibility({ intent, vibes, interests, sliders }, match) }
      setMatches([...matches, enriched].sort((a, b) => b.compatibility - a.compatibility))
      addNotification({ type: 'match', text: `${match.username} is looking to connect` })
    })

    socket.on('connect_error', () => {
      // Backend not available — use demo data
      setTimeout(() => {
        setSearching(false)
        setMatches(generateDemoMatches(user, intent, vibes, interests, sliders))
      }, 1800)
    })

    // Always fall back to demo data after timeout
    const timeout = setTimeout(() => {
      if (searching) {
        setSearching(false)
        if (matches.length === 0) {
          setMatches(generateDemoMatches(user, intent, vibes, interests, sliders))
        }
      }
    }, 3000)

    return () => {
      clearTimeout(timeout)
      socket.off('matches_found')
      socket.off('new_match')
      socket.off('connect_error')
    }
  }, [user])

  const handleOpenChat = (match) => {
    setActiveMatch(match)
    navigate(`/chat/${match.id}`)
  }

  const filtered = filterIntent
    ? matches.filter(m => m.intent === filterIntent)
    : matches

  const uniqueIntents = [...new Set(matches.map(m => m.intent).filter(Boolean))]

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => navigate('/interests')}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className={styles.topbarCenter}>
          <span className={styles.appLogo}>SoftMatch</span>
        </div>
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
            <motion.div
              className={styles.searchRing}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            <p className={styles.searchText}>finding relevant people…</p>
            <p className={styles.searchSub}>matching by intent, vibe & interests</p>
          </div>
        ) : (
          <>
            <div className={styles.pageHeader}>
              <div>
                <h2 className={styles.pageTitle}>your matches</h2>
                <p className={styles.pageSub}>{filtered.length} people matched your energy</p>
              </div>
              <button className={styles.refreshBtn} onClick={() => {
                setSearching(true)
                setMatches([])
                setTimeout(() => {
                  setSearching(false)
                  setMatches(generateDemoMatches(user, intent, vibes, interests, sliders))
                }, 1500)
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 8a6 6 0 11-2-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M14 3v3h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {uniqueIntents.length > 1 && (
              <div className={styles.filters}>
                <button
                  className={`${styles.filter} ${!filterIntent ? styles.filterActive : ''}`}
                  onClick={() => setFilterIntent(null)}
                >all</button>
                {uniqueIntents.map(i => (
                  <button
                    key={i}
                    className={`${styles.filter} ${filterIntent === i ? styles.filterActive : ''}`}
                    onClick={() => setFilterIntent(i)}
                  >{INTENT_LABELS[i] || i}</button>
                ))}
              </div>
            )}

            <div className={styles.list}>
              <AnimatePresence>
                {filtered.map((match, idx) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    idx={idx}
                    onOpen={() => handleOpenChat(match)}
                  />
                ))}
              </AnimatePresence>

              {filtered.length === 0 && (
                <div className={styles.empty}>
                  <p>no matches for this filter</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MatchCard({ match, idx, onOpen }) {
  const trust = getTrustLabel(match.trustScore || 50)
  const compatColor = getCompatibilityColor(match.compatibility)

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: idx * 0.07, duration: 0.4 }}
      whileHover={{ y: -2 }}
      onClick={onOpen}
    >
      <div className={styles.cardTop}>
        <div className={styles.avatar}>
          {match.username.slice(0, 2).toUpperCase()}
        </div>
        <div className={styles.cardInfo}>
          <div className={styles.cardName}>
            {match.username}
            {match.trustScore >= 60 && (
              <span className={styles.trustBadge} style={{ color: trust.color, borderColor: trust.color + '40', background: trust.color + '12' }}>
                ✓ {trust.label}
              </span>
            )}
          </div>
          <div className={styles.cardIntent}>{INTENT_LABELS[match.intent] || match.intent}</div>
        </div>
        <div className={styles.compatScore} style={{ color: compatColor }}>
          {match.compatibility}%
        </div>
      </div>

      {match.vibes?.length > 0 && (
        <div className={styles.tagRow}>
          {match.vibes.slice(0, 3).map(v => (
            <span key={v} className={styles.vibePill}>{v}</span>
          ))}
        </div>
      )}

      {match.interests?.length > 0 && (
        <div className={styles.tagRow}>
          {match.interests.slice(0, 4).map(i => (
            <span key={i} className={styles.interestPill}>{i}</span>
          ))}
        </div>
      )}

      <div className={styles.cardBottom}>
        <div className={styles.compatBar}>
          <motion.div
            className={styles.compatFill}
            initial={{ width: 0 }}
            animate={{ width: `${match.compatibility}%` }}
            transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            style={{ background: compatColor }}
          />
        </div>
        <span className={styles.startChat}>start chat →</span>
      </div>
    </motion.div>
  )
}
