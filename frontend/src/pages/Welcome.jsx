import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import styles from './Welcome.module.css'

export default function Welcome() {
  const { user, initUser, setPage, setAccountType } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    initUser()
    setPage('welcome')
  }, [])

  // Permanent account → sign up first, then build profile
  const handleCreateProfile = () => navigate('/login')
  // Temporary identity → straight into the (optional) profile, cache only
  const handleAnonymous = () => {
    setAccountType('temporary')
    navigate('/setup')
  }

  const particles = Array.from({ length: 18 }, (_, i) => i)

  return (
    <div className={styles.page}>
      <div className={styles.bg}>
        {particles.map(i => (
          <motion.div
            key={i}
            className={styles.particle}
            style={{
              left: `${(i * 37 + 11) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
              width: `${4 + (i % 5) * 3}px`,
              height: `${4 + (i % 5) * 3}px`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.15, 0.45, 0.15],
            }}
            transition={{
              duration: 3 + (i % 4),
              repeat: Infinity,
              delay: i * 0.25,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.logoArea}>
          <motion.div
            className={styles.logoRing}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <svg viewBox="0 0 60 60" fill="none">
              <circle cx="30" cy="30" r="28" stroke="url(#g1)" strokeWidth="1.5" strokeDasharray="4 6" />
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ff97b6" />
                  <stop offset="1" stopColor="#df2e68" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
          <div className={styles.logoInner}>
            <span className={styles.logoIcon}>♥</span>
          </div>
        </div>

        <motion.h1
          className={styles.headline}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          SoftMatch
        </motion.h1>

        <motion.p
          className={styles.tagline}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          not random strangers.<br />
          <em>relevant</em> strangers.
        </motion.p>

        {user && (
          <motion.div
            className={styles.identityCard}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55, duration: 0.5 }}
          >
            <div className={styles.identityDot} />
            <span className={styles.identityLabel}>your anonymous identity</span>
            <span className={styles.identityName}>{user.username}</span>
          </motion.div>
        )}

        <motion.p
          className={styles.subtext}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          No real name. No photo. No judgment.<br />
          Just conversations with people who actually get you.
        </motion.p>

        <motion.div
          className={styles.actions}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <button className={styles.btnPrimary} onClick={handleCreateProfile}>
            create a profile
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className={styles.btnGhost} onClick={handleAnonymous}>
            just chat anonymously →
          </button>
        </motion.div>

        <motion.p
          className={styles.disclaimer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Anonymous lives only in this browser — clear it and you're gone.<br />
          A profile keeps your identity & rating across devices.
        </motion.p>
      </motion.div>
    </div>
  )
}
