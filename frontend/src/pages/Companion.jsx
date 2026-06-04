import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import useStore from '../store/useStore'
import {
  getOpener, extractSignals, companionReply, QUICK_PROMPTS,
} from '../utils/aiCompanion'
import styles from './Companion.module.css'

const THINK_DELAY = 900

export default function Companion() {
  const navigate = useNavigate()
  const {
    initUser,
    companionMessages, addCompanionMessage,
    companionSignals, mergeCompanionSignals, applyCompanionSignals,
  } = useStore()

  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef(null)
  const turnRef = useRef(companionMessages.length)

  useEffect(() => {
    initUser()
    // Drop Soft's opener the very first time
    if (companionMessages.length === 0) {
      addCompanionMessage({
        id: uuidv4(), text: getOpener(), isMe: false, timestamp: Date.now(),
      })
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [companionMessages, thinking])

  const send = (raw) => {
    const text = (raw ?? input).trim()
    if (!text) return

    addCompanionMessage({ id: uuidv4(), text, isMe: true, timestamp: Date.now() })
    setInput('')

    // Learn from this message
    const signals = extractSignals(text)
    mergeCompanionSignals(signals)

    // Reply (offline brain — swap for fetchCompanionReply to use a real LLM)
    turnRef.current += 1
    setThinking(true)
    setTimeout(() => {
      setThinking(false)
      addCompanionMessage({
        id: uuidv4(),
        text: companionReply(text, signals, turnRef.current),
        isMe: false,
        timestamp: Date.now(),
      })
    }, THINK_DELAY + Math.random() * 600)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const total =
    companionSignals.interests.length +
    companionSignals.vibes.length +
    companionSignals.moods.length

  const handleUseInsights = () => {
    applyCompanionSignals()
    navigate('/interests')
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.botAvatar}>
            <motion.span
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >🌸</motion.span>
          </div>
          <div>
            <div className={styles.headerName}>Soft</div>
            <div className={styles.headerMeta}>your AI warm-up · learns as you talk</div>
          </div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* what Soft has learned */}
      <AnimatePresence>
        {total > 0 && (
          <motion.div
            className={styles.insightBar}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <span className={styles.insightLabel}>Soft is learning</span>
            <div className={styles.chips}>
              {companionSignals.moods.map(m => (
                <span key={m} className={`${styles.chip} ${styles.moodChip}`}>{m}</span>
              ))}
              {companionSignals.vibes.map(v => (
                <span key={v} className={`${styles.chip} ${styles.vibeChip}`}>{v}</span>
              ))}
              {companionSignals.interests.map(i => (
                <span key={i} className={styles.chip}>{i}</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.messages}>
        <AnimatePresence initial={false}>
          {companionMessages.map(msg => (
            <motion.div
              key={msg.id}
              className={`${styles.msgRow} ${msg.isMe ? styles.me : styles.them}`}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              {!msg.isMe && <div className={styles.msgAvatar}>🌸</div>}
              <div className={`${styles.bubble} ${msg.isMe ? styles.bubbleMe : styles.bubbleThem}`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {thinking && (
            <motion.div
              className={`${styles.msgRow} ${styles.them}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <div className={styles.msgAvatar}>🌸</div>
              <div className={styles.typing}>
                <span /><span /><span />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* quick prompts only before the user has said much */}
        {companionMessages.filter(m => m.isMe).length < 2 && !thinking && (
          <div className={styles.quickRow}>
            {QUICK_PROMPTS.map(q => (
              <button key={q} className={styles.quick} onClick={() => send(q)}>{q}</button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {total > 0 && (
        <motion.button
          className={styles.useBtn}
          onClick={handleUseInsights}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          use what Soft learned & find my people →
        </motion.button>
      )}

      <div className={styles.inputBar}>
        <textarea
          className={styles.input}
          placeholder="talk to Soft… (no pressure)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
        />
        <button
          className={`${styles.sendBtn} ${input.trim() ? styles.sendActive : ''}`}
          onClick={() => send()}
          disabled={!input.trim()}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 9l14-6-6 14-2-6-6-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
