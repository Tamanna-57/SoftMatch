import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { PROFILE_FIELDS, HOBBIES } from '../utils/attributes'
import styles from './ProfileSetup.module.css'

export default function ProfileSetup() {
  const navigate = useNavigate()
  const {
    user, initUser, accountType,
    profile, updateProfile, toggleProfileMulti, regenerateName,
  } = useStore()

  useEffect(() => { initUser() }, [])

  // single-select: click again to clear
  const pick = (field, value) =>
    updateProfile({ [field]: profile[field] === value ? null : value })

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.stepBadge}>step 1 of 2 · about you</div>
          <h1 className={styles.title}>your <em>profile</em></h1>
          <p className={styles.sub}>
            everything's optional — fill what feels right, skip the rest.
            {accountType === 'temporary' && ' (saved only in this browser)'}
          </p>
        </motion.div>

        {/* Name */}
        <section className={styles.section}>
          <div className={styles.sectionLabel}>name <span className={styles.opt}>optional</span></div>
          <input
            className={styles.input}
            placeholder="leave blank to stay anonymous"
            value={profile.name}
            onChange={e => updateProfile({ name: e.target.value })}
            maxLength={24}
          />
          {!profile.name && (
            <div className={styles.handleHint}>
              you'll show up as <strong>{user?.username}</strong>
              <button className={styles.reroll} onClick={regenerateName}>↻ new name</button>
            </div>
          )}
        </section>

        {/* Age */}
        <section className={styles.section}>
          <div className={styles.sectionLabel}>age <span className={styles.opt}>optional</span></div>
          <input
            type="number" min="18" max="99"
            className={`${styles.input} ${styles.ageInput}`}
            placeholder="18+"
            value={profile.age ?? ''}
            onChange={e => updateProfile({ age: e.target.value ? Number(e.target.value) : null })}
          />
        </section>

        {/* Single-choice fields */}
        {PROFILE_FIELDS.map(f => (
          <section key={f.key} className={styles.section}>
            <div className={styles.sectionLabel}>
              <span className={styles.fIcon}>{f.icon}</span> {f.label}
              <span className={styles.opt}>optional</span>
            </div>
            <div className={styles.chipRow}>
              {f.options.map(opt => (
                <button
                  key={opt}
                  className={`${styles.chip} ${profile[f.key] === opt ? styles.chipOn : ''}`}
                  onClick={() => pick(f.key, opt)}
                >{opt}</button>
              ))}
            </div>
          </section>
        ))}

        {/* Hobbies (multi) */}
        <section className={styles.section}>
          <div className={styles.sectionLabel}>
            <span className={styles.fIcon}>✶</span> hobbies
            <span className={styles.opt}>pick any</span>
          </div>
          <div className={styles.chipRow}>
            {HOBBIES.map(h => (
              <button
                key={h}
                className={`${styles.chip} ${profile.hobbies.includes(h) ? styles.chipOn : ''}`}
                onClick={() => toggleProfileMulti('hobbies', h)}
              >{h}</button>
            ))}
          </div>
        </section>

        {/* Bio */}
        <section className={styles.section}>
          <div className={styles.sectionLabel}>one line about you <span className={styles.opt}>optional</span></div>
          <textarea
            className={styles.textarea}
            placeholder="a sentence that sounds like you…"
            value={profile.bio}
            onChange={e => updateProfile({ bio: e.target.value })}
            maxLength={120}
            rows={2}
          />
        </section>

        <div className={styles.footer}>
          <button className={styles.nextBtn} onClick={() => navigate('/preferences')}>
            next — who you're looking for
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
