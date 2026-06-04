import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { getTrustLabel, INTENT_LABELS } from '../utils/matching'
import styles from './Profile.module.css'

export default function Profile() {
  const navigate = useNavigate()
  const { user, intent, vibes, interests, sliders, resetOnboarding, updateUser } = useStore()
  const trust = getTrustLabel(user?.trustScore || 50)

  const handleResetOnboarding = () => {
    resetOnboarding()
    navigate('/intent')
  }

  const trustPct = user?.trustScore || 50

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => navigate('/matches')}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className={styles.topbarTitle}>your identity</span>
        <div style={{ width: 36 }} />
      </div>

      <div className={styles.content}>
        <motion.div
          className={styles.identityCard}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.avatarLg}>
            {user?.username?.slice(0, 2).toUpperCase()}
          </div>
          <h1 className={styles.username}>{user?.username}</h1>
          <div className={styles.anonymousBadge}>
            <span className={styles.anonDot} />
            fully anonymous
          </div>
        </motion.div>

        <motion.div
          className={styles.trustCard}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className={styles.trustHeader}>
            <div>
              <div className={styles.cardLabel}>trust score</div>
              <div className={styles.trustScore} style={{ color: trust.color }}>{trustPct}</div>
            </div>
            <div className={styles.trustRight}>
              <span className={styles.trustBadge} style={{ color: trust.color, borderColor: trust.color + '40', background: trust.color + '14' }}>
                {trust.label}
              </span>
              <p className={styles.trustDesc}>earned through respectful conversations</p>
            </div>
          </div>
          <div className={styles.trustBarBg}>
            <motion.div
              className={styles.trustBarFill}
              style={{ background: trust.color }}
              initial={{ width: 0 }}
              animate={{ width: `${trustPct}%` }}
              transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className={styles.sectionLabel}>current intent</div>
          <div className={styles.intentPill}>
            {intent ? INTENT_LABELS[intent] || intent : 'not set'}
          </div>
        </motion.div>

        {vibes.length > 0 && (
          <motion.div
            className={styles.section}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={styles.sectionLabel}>your vibe</div>
            <div className={styles.tagRow}>
              {vibes.map(v => <span key={v} className={styles.vibePill}>{v}</span>)}
            </div>
          </motion.div>
        )}

        {interests.length > 0 && (
          <motion.div
            className={styles.section}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className={styles.sectionLabel}>interests</div>
            <div className={styles.tagRow}>
              {interests.map(i => <span key={i} className={styles.interestPill}>{i}</span>)}
            </div>
          </motion.div>
        )}

        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className={styles.sectionLabel}>energy</div>
          <div className={styles.sliderDisplay}>
            <div className={styles.sdRow}>
              <span>depth of conversation</span>
              <span className={styles.sdVal}>{sliders.deepTalks}/10</span>
            </div>
            <div className={styles.sdRow}>
              <span>ambition</span>
              <span className={styles.sdVal}>{sliders.ambition}/10</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className={styles.actions}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button className={styles.editBtn} onClick={handleResetOnboarding}>
            update my profile
          </button>
          <button className={styles.dangerBtn} onClick={() => {
            if (confirm('This will reset your anonymous identity. Are you sure?')) {
              useStore.getState().updateUser({ username: `Reset_${Math.floor(Math.random() * 1000)}` })
            }
          }}>
            reset identity
          </button>
        </motion.div>

        <motion.div
          className={styles.disclaimer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          <p>your real identity is never stored or shared.</p>
          <p>this data lives in your browser's local storage.</p>
        </motion.div>
      </div>
    </div>
  )
}
