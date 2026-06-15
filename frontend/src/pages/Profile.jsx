import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { getRatingLabel } from '../utils/matching'
import { PROFILE_FIELDS, FILTERABLE } from '../utils/attributes'
import styles from './Profile.module.css'

export default function Profile() {
  const navigate = useNavigate()
  const { user, accountType, profile, prefs, clearIdentity } = useStore()
  const display = profile.name || user?.username
  const rating = getRatingLabel(user?.rating || 0, user?.ratingCount || 0)

  const filledFields = PROFILE_FIELDS.filter(f => profile[f.key])
  const activePrefs = FILTERABLE.filter(f => prefs[f.key]?.length)
  const hasAgePref = prefs.ageMin > 18 || prefs.ageMax < 60

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
        <motion.div className={styles.identityCard}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className={styles.avatarLg}>{display?.slice(0, 2).toUpperCase()}</div>
          <h1 className={styles.username}>{display}</h1>
          <div className={styles.anonymousBadge}>
            <span className={styles.anonDot} />
            {accountType === 'permanent' ? 'saved account' : 'anonymous · this device only'}
          </div>
        </motion.div>

        {/* Credibility (member rating) */}
        <motion.div className={styles.trustCard}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className={styles.trustHeader}>
            <div>
              <div className={styles.cardLabel}>your rating</div>
              <div className={styles.trustScore} style={{ color: rating.color }}>
                {user?.ratingCount ? `★ ${user.rating}` : '☆ —'}
              </div>
            </div>
            <div className={styles.trustRight}>
              <span className={styles.trustBadge} style={{ color: rating.color, borderColor: rating.color + '40', background: rating.color + '14' }}>
                {rating.label}
              </span>
              <p className={styles.trustDesc}>
                {user?.ratingCount ? `from ${user.ratingCount} conversations` : 'people you talk to rate you here'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Profile attributes */}
        <motion.div className={styles.section}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className={styles.sectionLabel}>your profile</div>
          {profile.age && <div className={styles.intentPill}>age {profile.age}</div>}
          <div className={styles.tagRow}>
            {filledFields.map(f => (
              <span key={f.key} className={styles.vibePill}>{f.icon} {profile[f.key]}</span>
            ))}
            {filledFields.length === 0 && !profile.age && (
              <span className={styles.trustDesc}>nothing added yet — all optional</span>
            )}
          </div>
          {profile.hobbies?.length > 0 && (
            <div className={styles.tagRow} style={{ marginTop: 8 }}>
              {profile.hobbies.map(h => <span key={h} className={styles.interestPill}>{h}</span>)}
            </div>
          )}
          {profile.bio && <p className={styles.trustDesc} style={{ marginTop: 10 }}>“{profile.bio}”</p>}
        </motion.div>

        {/* Preferences */}
        <motion.div className={styles.section}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
          <div className={styles.sectionLabel}>looking for</div>
          <div className={styles.tagRow}>
            {hasAgePref && <span className={styles.vibePill}>age {prefs.ageMin}–{prefs.ageMax}</span>}
            {activePrefs.map(f => (
              <span key={f.key} className={styles.vibePill}>{f.icon} {prefs[f.key].join(' / ')}</span>
            ))}
            {!hasAgePref && activePrefs.length === 0 && (
              <span className={styles.trustDesc}>open to everyone</span>
            )}
          </div>
        </motion.div>

        <motion.div className={styles.actions}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <button className={styles.editBtn} onClick={() => navigate('/setup')}>edit profile</button>
          <button className={styles.editBtn} onClick={() => navigate('/preferences')}>edit preferences</button>
          {accountType !== 'permanent' && (
            <button className={styles.editBtn} onClick={() => navigate('/login')}>save this identity (create account)</button>
          )}
          <button className={styles.dangerBtn} onClick={() => {
            if (confirm('This wipes your identity, profile and chats from this device. Sure?')) {
              clearIdentity()
              navigate('/')
            }
          }}>
            {accountType === 'permanent' ? 'log out' : 'clear my identity'}
          </button>
        </motion.div>

        <motion.div className={styles.disclaimer}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <p>your real identity is never stored or shared.</p>
          <p>{accountType === 'permanent' ? 'your account keeps this across devices.' : 'this lives only in this browser — clearing it is permanent.'}</p>
        </motion.div>
      </div>
    </div>
  )
}
