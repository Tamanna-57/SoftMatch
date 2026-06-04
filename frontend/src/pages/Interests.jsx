import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { VIBE_OPTIONS, INTEREST_OPTIONS } from '../utils/matching'
import styles from './Interests.module.css'

export default function Interests() {
  const navigate = useNavigate()
  const { vibes, interests, sliders, toggleVibe, toggleInterest, setSlider, completeOnboarding } = useStore()

  const handleFind = () => {
    completeOnboarding()
    navigate('/matches')
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={styles.header}
        >
          <div className={styles.stepBadge}>step 2 of 2</div>
          <h1 className={styles.title}>a few things<br /><em>about you</em></h1>
          <p className={styles.sub}>all optional — the more you share, the better your match</p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className={styles.sectionLabel}>your vibe</div>
          <div className={styles.tagGrid}>
            {VIBE_OPTIONS.map((v, i) => (
              <motion.button
                key={v}
                className={`${styles.tag} ${vibes.includes(v) ? styles.tagSelected : ''}`}
                onClick={() => toggleVibe(v)}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                whileTap={{ scale: 0.93 }}
              >
                {v}
              </motion.button>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className={styles.sectionLabel}>into</div>
          <div className={styles.tagGrid}>
            {INTEREST_OPTIONS.map((interest, i) => (
              <motion.button
                key={interest}
                className={`${styles.tag} ${interests.includes(interest) ? styles.tagSelected : ''}`}
                onClick={() => toggleInterest(interest)}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.03 }}
                whileTap={{ scale: 0.93 }}
              >
                {interest}
              </motion.button>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className={styles.sliderSection}
        >
          <div className={styles.sectionLabel}>conversation energy</div>

          <div className={styles.sliderRow}>
            <div className={styles.sliderMeta}>
              <span className={styles.sliderName}>depth of conversation</span>
              <div className={styles.sliderEnds}>
                <span>casual</span>
                <span className={styles.sliderVal}>{sliders.deepTalks}/10</span>
                <span>deep</span>
              </div>
            </div>
            <input
              type="range" min="0" max="10" step="1"
              value={sliders.deepTalks}
              onChange={e => setSlider('deepTalks', Number(e.target.value))}
              className={styles.slider}
            />
          </div>

          <div className={styles.sliderRow}>
            <div className={styles.sliderMeta}>
              <span className={styles.sliderName}>ambition level</span>
              <div className={styles.sliderEnds}>
                <span>chill</span>
                <span className={styles.sliderVal}>{sliders.ambition}/10</span>
                <span>driven</span>
              </div>
            </div>
            <input
              type="range" min="0" max="10" step="1"
              value={sliders.ambition}
              onChange={e => setSlider('ambition', Number(e.target.value))}
              className={styles.slider}
            />
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={styles.footer}
        >
          <button className={styles.findBtn} onClick={handleFind}>
            find my people
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </motion.div>
      </div>
    </div>
  )
}
