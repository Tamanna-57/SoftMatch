import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { FILTERABLE } from '../utils/attributes'
import styles from './Preferences.module.css'

export default function Preferences() {
  const navigate = useNavigate()
  const { prefs, setPref, togglePrefMulti, completeOnboarding } = useStore()

  const handleFind = () => {
    completeOnboarding()
    navigate('/matches')
  }

  const activeCount =
    FILTERABLE.reduce((n, f) => n + (prefs[f.key]?.length ? 1 : 0), 0) +
    ((prefs.ageMin > 18 || prefs.ageMax < 99) ? 1 : 0)

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.stepBadge}>step 2 of 2 · what you want</div>
          <h1 className={styles.title}>your <em>match</em></h1>
          <p className={styles.sub}>
            pick only what actually matters to you. anything you leave blank
            means <strong>“don’t care.”</strong> we match both ways — they have
            to fit you <em>and</em> you have to fit them.
          </p>
        </motion.div>

        {/* Age range */}
        <section className={styles.section}>
          <div className={styles.sectionLabel}>age range</div>
          <div className={styles.ageRow}>
            <input
              type="number" min="18" max="99" className={styles.ageInput}
              value={prefs.ageMin}
              onChange={e => setPref('ageMin', Number(e.target.value) || 18)}
            />
            <span className={styles.ageTo}>to</span>
            <input
              type="number" min="18" max="99" className={styles.ageInput}
              value={prefs.ageMax}
              onChange={e => setPref('ageMax', Number(e.target.value) || 99)}
            />
          </div>
        </section>

        {/* One block per filterable field */}
        {FILTERABLE.map(f => {
          const sel = prefs[f.key] || []
          return (
            <section key={f.key} className={styles.section}>
              <div className={styles.sectionLabel}>
                <span className={styles.fIcon}>{f.icon}</span> {f.label}
                {sel.length === 0
                  ? <span className={styles.any}>any</span>
                  : <span className={styles.set}>{sel.length} selected</span>}
              </div>
              <div className={styles.chipRow}>
                {f.options.map(opt => (
                  <button
                    key={opt}
                    className={`${styles.chip} ${sel.includes(opt) ? styles.chipOn : ''}`}
                    onClick={() => togglePrefMulti(f.key, opt)}
                  >{opt}</button>
                ))}
              </div>
            </section>
          )
        })}

        <div className={styles.footer}>
          <p className={styles.summary}>
            {activeCount === 0
              ? 'no filters yet — you’ll meet everyone'
              : `${activeCount} ${activeCount === 1 ? 'filter' : 'filters'} active`}
          </p>
          <button className={styles.findBtn} onClick={handleFind}>
            find my people
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className={styles.backBtn} onClick={() => navigate('/setup')}>← edit profile</button>
        </div>
      </div>
    </div>
  )
}
