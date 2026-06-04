import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import useStore from '../store/useStore'
import { getSocket } from '../utils/socket'
import { getTrustLabel, INTENT_LABELS } from '../utils/matching'
import styles from './Chat.module.css'

const TYPING_DELAY = 1400

export default function Chat() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { user, activeMatch, conversations, addMessage, addNotification } = useStore()
  const [input, setInput] = useState('')
  const [typingIndicator, setTypingIndicator] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reported, setReported] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimeout = useRef(null)

  const messages = conversations[matchId] || []
  const match = activeMatch

  useEffect(() => {
    if (!user || !match) return
    const socket = getSocket()

    socket.on('connect', () => setConnectionStatus('connected'))
    socket.on('disconnect', () => setConnectionStatus('disconnected'))
    socket.on('connect_error', () => setConnectionStatus('demo'))

    socket.emit('join_room', { roomId: matchId, userId: user.id, username: user.username })

    socket.on('message', (msg) => {
      if (msg.senderId !== user.id) {
        addMessage(matchId, { ...msg, isMe: false })
        setTypingIndicator(false)
      }
    })

    socket.on('typing', ({ userId }) => {
      if (userId !== user.id) {
        setTypingIndicator(true)
        clearTimeout(typingTimeout.current)
        typingTimeout.current = setTimeout(() => setTypingIndicator(false), 2500)
      }
    })

    socket.on('user_left', () => {
      addNotification({ type: 'info', text: `${match.username} has left the conversation` })
      setConnectionStatus('disconnected')
    })

    // If demo mode, simulate replies
    if (match.isDemo || connectionStatus === 'demo') {
      setConnectionStatus('demo')
    }

    return () => {
      socket.off('message')
      socket.off('typing')
      socket.off('user_left')
      clearTimeout(typingTimeout.current)
    }
  }, [matchId, user, match])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingIndicator])

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return

    const msg = {
      id: uuidv4(),
      text,
      senderId: user.id,
      senderName: user.username,
      isMe: true,
      timestamp: Date.now(),
    }

    addMessage(matchId, msg)
    setInput('')

    if (connectionStatus !== 'demo') {
      const socket = getSocket()
      socket.emit('message', { roomId: matchId, ...msg })
    } else {
      // Simulate reply in demo mode
      simulateDemoReply(text)
    }
  }

  const simulateDemoReply = (userText) => {
    const demoReplies = [
      "that's actually a really interesting take",
      "i've been thinking about the same thing lately",
      "yeah, what made you start thinking about this?",
      "honestly, same. it's strange how common this feeling is",
      "i feel like most people don't talk about this enough",
      "what's your take on how it ends up?",
      "that reminds me of something i read recently",
      "hm. give me a second to think about that",
      "i think you're onto something there",
      "wait, how did you arrive at that conclusion?",
    ]
    const reply = demoReplies[Math.floor(Math.random() * demoReplies.length)]

    setTypingIndicator(true)
    setTimeout(() => {
      setTypingIndicator(false)
      addMessage(matchId, {
        id: uuidv4(),
        text: reply,
        senderId: match.id,
        senderName: match.username,
        isMe: false,
        timestamp: Date.now(),
      })
    }, TYPING_DELAY + Math.random() * 800)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    } else {
      if (connectionStatus !== 'demo') {
        const socket = getSocket()
        socket.emit('typing', { roomId: matchId, userId: user.id })
      }
    }
  }

  const handleReport = () => {
    setReported(true)
    addNotification({ type: 'success', text: 'Report submitted. Thank you for keeping SoftMatch safe.' })
    setTimeout(() => setShowReport(false), 1000)
  }

  if (!match) {
    return (
      <div className={styles.notFound}>
        <p>conversation not found</p>
        <button onClick={() => navigate('/matches')}>back to matches</button>
      </div>
    )
  }

  const trust = getTrustLabel(match.trustScore || 50)
  const timeLabel = (ts) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/matches')}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.headerAvatar}>{match.username.slice(0, 2).toUpperCase()}</div>
          <div>
            <div className={styles.headerName}>{match.username}</div>
            <div className={styles.headerMeta}>
              {INTENT_LABELS[match.intent] || match.intent}
              {' · '}
              <span style={{ color: trust.color }}>{trust.label}</span>
              {connectionStatus === 'demo' && <span className={styles.demoBadge}> · demo</span>}
            </div>
          </div>
        </div>
        <button className={styles.menuBtn} onClick={() => setShowReport(!showReport)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="4" r="1.2" fill="currentColor"/>
            <circle cx="9" cy="9" r="1.2" fill="currentColor"/>
            <circle cx="9" cy="14" r="1.2" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* Report menu */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            className={styles.reportMenu}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <button className={styles.reportItem} onClick={handleReport}>
              {reported ? '✓ reported' : '⚑ report user'}
            </button>
            <button className={styles.reportItem} onClick={() => { setShowReport(false); navigate('/matches') }}>
              ✕ end conversation
            </button>
            <button className={styles.reportItem + ' ' + styles.blockItem} onClick={() => { navigate('/matches') }}>
              ⊘ block user
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compatibility banner */}
      <div className={styles.compatBanner}>
        <span>{match.compatibility}% match</span>
        <span className={styles.compatDot}>·</span>
        <span>{match.vibes?.slice(0, 2).join(', ')}</span>
        <span className={styles.compatDot}>·</span>
        <span>{match.interests?.slice(0, 2).join(', ')}</span>
      </div>

      {/* Messages */}
      <div className={styles.messages} onClick={() => setShowReport(false)}>
        {messages.length === 0 && (
          <motion.div
            className={styles.emptyChat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={styles.emptyChatIcon}>◎</div>
            <p className={styles.emptyChatTitle}>you matched with {match.username}</p>
            <p className={styles.emptyChatSub}>
              {match.compatibility}% compatible · say something real
            </p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              className={`${styles.msgRow} ${msg.isMe ? styles.msgRowMe : styles.msgRowThem}`}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              {!msg.isMe && (
                <div className={styles.msgAvatar}>{match.username.slice(0, 2).toUpperCase()}</div>
              )}
              <div className={`${styles.bubble} ${msg.isMe ? styles.bubbleMe : styles.bubbleThem}`}>
                <span>{msg.text}</span>
                <span className={styles.msgTime}>{timeLabel(msg.timestamp)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {typingIndicator && (
            <motion.div
              className={styles.msgRow + ' ' + styles.msgRowThem}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.msgAvatar}>{match.username.slice(0, 2).toUpperCase()}</div>
              <div className={styles.typingBubble}>
                <span className={styles.dot1} />
                <span className={styles.dot2} />
                <span className={styles.dot3} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={styles.inputBar}>
        <textarea
          ref={inputRef}
          className={styles.input}
          placeholder="say something real…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className={`${styles.sendBtn} ${input.trim() ? styles.sendActive : ''}`}
          onClick={sendMessage}
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
