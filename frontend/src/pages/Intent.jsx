import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import styles from './Intent.module.css'

const INTENTS = [
  { id: 'deep_talk', icon: '◎', label: 'Deep Talk', desc: 'meaningful, real conversation' },
  { id: 'vent_support', icon: '♡', label: 'Vent / Support', desc: 'someone to listen' },
  { id: 'startup', icon: '⚡', label: 'Startup / Build', desc: 'founders, builders, dreamers' },
  { id: 'study', icon: '◈', label: 'Study Partner', desc: 'focus together, grow together' },
  { id: 'random_fun', icon: '∿', label: 'Random / Fun', desc: 'chill late-night energy' },
  { id: 'philosophy', icon: '∞', label: 'Philosophy', desc: 'question everything' },
  { id: 'career', icon: '↗', label: 'Career Talk', desc: 'advice, direction, experience' },
  { id: 'gaming', icon: '⊡', label: 'Gaming', desc: 'find your squad' },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } }
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function Intent() {
  const navigate = useNavigate()
  const { intent, setIntent } = useStore()

  const handleSelect = (id) => {
    setIntent(id)
  }

  const handleNext = () => {
    if (intent) navigate('/interests')
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.stepBadge}>step 1 of 2</div>
          <h1 className={styles.title}>what do you need<br /><em>right now?</em></h1>
          <p className={styles.sub}>we match you based on this moment, not just who you are</p>
        </motion.div>

        <motion.div
          className={styles.grid}
          variants={container}
          initial="hidden"
          animate="show"
        >
          {INTENTS.map(opt => (
            <motion.button
              key={opt.id}
              variants={item}
              className={`${styles.card} ${intent === opt.id ? styles.selected : ''}`}
              onClick={() => handleSelect(opt.id)}
              whileTap={{ scale: 0.96 }}
            >
              <span className={styles.icon}>{opt.icon}</span>
              <span className={styles.label}>{opt.label}</span>
              <span className={styles.desc}>{opt.desc}</span>
              {intent === opt.id && (
                <motion.div
                  className={styles.check}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >✓</motion.div>
              )}
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          className={styles.footer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            className={`${styles.nextBtn} ${!intent ? styles.disabled : ''}`}
            onClick={handleNext}
            disabled={!intent}
          >
            next — tell us your vibe
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className={styles.skipBtn} onClick={() => navigate('/interests')}>
            skip this step
          </button>
        </motion.div>
      </div>
    </div>
  )
}
