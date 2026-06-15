import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import useStore from '../store/useStore'
import { connectSocket, getSocket } from '../utils/socket'
import { getRatingLabel } from '../utils/matching'
import { api } from '../utils/api'
import styles from './Chat.module.css'

// Heart rating picker (5 hearts, no comments)
function HeartPicker({ value, hover, setHover, onPick, size = 22 }) {
  return (
    <div className={styles.hearts} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} className={styles.heart} style={{ fontSize: size }}
          onMouseEnter={() => setHover(n)} onClick={() => onPick(n)}>
          <span style={{ color: (hover || value) >= n ? '#df2e68' : '#e9cdd6' }}>♥</span>
        </button>
      ))}
    </div>
  )
}

export default function Chat() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const {
    user, activeMatch, accountType,
    conversations, addMessage, setConversation, addNotification,
    skipMatch, rateMatch, ratingsGiven,
  } = useStore()

  const [input, setInput] = useState('')
  const [typingIndicator, setTypingIndicator] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showRate, setShowRate] = useState(false)
  const [hover, setHover] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const bottomRef = useRef(null)
  const typingTimeout = useRef(null)

  const messages = conversations[matchId] || []
  const match = activeMatch
  const myRating = ratingsGiven[matchId]

  useEffect(() => {
    if (!user || !match) return
    const socket = connectSocket(user.id)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (socket.connected) setConnectionStatus('connected')

    const onConnect = () => {
      setConnectionStatus('connected')
      socket.emit('register', { userId: user.id })
      socket.emit('join_room', { roomId: matchId, userId: user.id, username: user.username })
    }
    const onDisconnect = () => setConnectionStatus('offline')
    const onConnectError = () => setConnectionStatus('offline')

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    if (socket.connected) {
      socket.emit('join_room', { roomId: matchId, userId: user.id, username: user.username })
    }

    // Server sends the persisted conversation history on join.
    socket.on('history', ({ roomId, messages: hist }) => {
      if (roomId !== matchId) return
      setConversation(matchId, hist.map(m => ({
        id: m.id,
        text: m.text,
        senderId: m.senderId,
        senderName: m.senderName,
        isMe: m.senderId === user.id,
        timestamp: new Date(m.createdAt).getTime(),
      })))
    })

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

    return () => {
      socket.emit('leave_room', { roomId: matchId, userId: user.id })
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.off('history'); socket.off('message'); socket.off('typing')
      clearTimeout(typingTimeout.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, user, match])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingIndicator])

  if (!match) {
    return (
      <div className={styles.notFound}>
        <p>conversation not found</p>
        <button onClick={() => navigate('/matches')}>back to matches</button>
      </div>
    )
  }

  const display = match.profile?.name || match.username
  const initials = display.slice(0, 2).toUpperCase()
  const r = getRatingLabel(match.rating, match.ratingCount)
  const meta = [match.profile?.age, match.profile?.city].filter(Boolean).join(' · ')

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return
    const msg = { id: uuidv4(), text, senderId: user.id, senderName: user.username, isMe: true, timestamp: Date.now() }
    addMessage(matchId, msg)
    setInput('')
    getSocket().emit('message', { roomId: matchId, ...msg })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    else if (connectionStatus === 'connected') {
      getSocket().emit('typing', { roomId: matchId, userId: user.id })
    }
  }

  const submitRating = async (stars) => {
    rateMatch(matchId, stars)
    addNotification({ type: 'success', text: `you rated ${display} ${stars}★ — thanks for keeping it kind` })
    try {
      await api.rate({ fromUserId: user.id, toUserId: match.id, stars })
    } catch { /* keep the local rating even if the network call fails */ }
  }

  // Skip: optionally rate, then leave this person and go back to matches
  const handleSkip = () => {
    if (!myRating && messages.length > 0) { setShowRate(true); return }
    skipMatch(match.id)
    navigate('/matches')
  }
  const skipAfterRate = (stars) => {
    if (stars) submitRating(stars)
    setShowRate(false)
    skipMatch(match.id)
    navigate('/matches')
  }

  const handleReport = async () => {
    setShowMenu(false)
    addNotification({ type: 'success', text: 'Report submitted. Thank you for keeping SoftMatch safe.' })
    try {
      await api.report({ reporterId: user.id, reportedId: match.id, reason: 'reported from chat', roomId: matchId })
    } catch { /* non-blocking */ }
  }

  const timeLabel = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

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
          <div className={styles.headerAvatar}>{initials}</div>
          <div>
            <div className={styles.headerName}>{display}</div>
            <div className={styles.headerMeta}>
              {meta && <>{meta} · </>}
              <span style={{ color: r.color }}>{match.ratingCount ? `★ ${match.rating}` : r.label}</span>
              {connectionStatus === 'connecting' && <span className={styles.demoBadge}> · connecting…</span>}
              {connectionStatus === 'offline' && <span className={styles.demoBadge}> · offline</span>}
            </div>
          </div>
        </div>
        <button className={styles.menuBtn} onClick={() => setShowMenu(!showMenu)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="4" r="1.2" fill="currentColor"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="14" r="1.2" fill="currentColor"/>
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {showMenu && (
          <motion.div className={styles.reportMenu}
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <button className={styles.reportItem} onClick={() => { setShowMenu(false); setShowRate(true) }}>★ rate this person</button>
            <button className={styles.reportItem} onClick={handleReport}>⚑ report</button>
            <button className={`${styles.reportItem} ${styles.blockItem}`} onClick={() => { skipMatch(match.id); navigate('/matches') }}>⊘ block & leave</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match banner with skip + rate */}
      <div className={styles.compatBanner}>
        <span className={styles.compatPct}>{match.match?.score ?? '—'}% match</span>
        {match.match?.reasons?.[0] && <span className={styles.compatReason}>· {match.match.reasons[0]}</span>}
        <div className={styles.bannerActions}>
          <button className={styles.rateBtn} onClick={() => setShowRate(true)}>
            {myRating ? `★ ${myRating}` : '☆ rate'}
          </button>
          <button className={styles.skipBtn} onClick={handleSkip}>skip →</button>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages} onClick={() => setShowMenu(false)}>
        {messages.length === 0 && (
          <motion.div className={styles.emptyChat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className={styles.emptyChatIcon}>♥</div>
            <p className={styles.emptyChatTitle}>you matched with {display}</p>
            <p className={styles.emptyChatSub}>{match.match?.score}% both-ways · no swiping, just say hi</p>
          </motion.div>
        )}
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div key={msg.id}
              className={`${styles.msgRow} ${msg.isMe ? styles.msgRowMe : styles.msgRowThem}`}
              initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.25 }}>
              {!msg.isMe && <div className={styles.msgAvatar}>{initials}</div>}
              <div className={`${styles.bubble} ${msg.isMe ? styles.bubbleMe : styles.bubbleThem}`}>
                <span>{msg.text}</span>
                <span className={styles.msgTime}>{timeLabel(msg.timestamp)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <AnimatePresence>
          {typingIndicator && (
            <motion.div className={`${styles.msgRow} ${styles.msgRowThem}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className={styles.msgAvatar}>{initials}</div>
              <div className={styles.typingBubble}><span className={styles.dot1} /><span className={styles.dot2} /><span className={styles.dot3} /></div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Rate overlay */}
      <AnimatePresence>
        {showRate && (
          <motion.div className={styles.rateOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRate(false)}>
            <motion.div className={styles.rateCard} initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <p className={styles.rateTitle}>how was talking to {display}?</p>
              <p className={styles.rateSub}>
                ratings build credibility — no comments, just a vibe.
                {accountType === 'temporary' && ' (kept only on this device)'}
              </p>
              <HeartPicker value={myRating || 0} hover={hover} setHover={setHover} onPick={(n) => submitRating(n)} />
              <div className={styles.rateActions}>
                <button className={styles.rateDone} onClick={() => setShowRate(false)}>done</button>
                <button className={styles.rateSkipLink} onClick={() => skipAfterRate(0)}>skip without rating →</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className={styles.inputBar}>
        <textarea className={styles.input} placeholder="say something real…" value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} rows={1} />
        <button className={`${styles.sendBtn} ${input.trim() ? styles.sendActive : ''}`} onClick={sendMessage} disabled={!input.trim()}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 9l14-6-6 14-2-6-6-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
