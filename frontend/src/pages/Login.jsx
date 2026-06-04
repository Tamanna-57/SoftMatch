import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import styles from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const { user, setLoggedIn, updateUser } = useStore()
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { setError('please fill all fields'); return }
    setLoading(true)
    setError('')

    // Simulate auth (replace with real API call)
    setTimeout(() => {
      setLoading(false)
      setLoggedIn(true)
      updateUser({ email, isLoggedIn: true })
      navigate('/matches')
    }, 900)
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button className={styles.backLink} onClick={() => navigate('/')}>
            ← back
          </button>
          <div className={styles.logoArea}>
            <span className={styles.logo}>SoftMatch</span>
          </div>
          <h1 className={styles.title}>
            {mode === 'login' ? 'welcome back' : 'keep your identity'}
          </h1>
          <p className={styles.sub}>
            {mode === 'login'
              ? 'log in to restore your anonymous profile'
              : 'create an account to save your identity across devices'
            }
          </p>
        </motion.div>

        {user && (
          <motion.div
            className={styles.identityBadge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className={styles.identityAvatar}>{user.username?.slice(0, 2)}</div>
            <div>
              <div className={styles.identityName}>{user.username}</div>
              <div className={styles.identityNote}>your current identity will be preserved</div>
            </div>
          </motion.div>
        )}

        <motion.div
          className={styles.form}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className={styles.field}>
            <label className={styles.label}>email</label>
            <input
              type="email"
              className={styles.input}
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>password</label>
            <input
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'just a moment…' : mode === 'login' ? 'log in' : 'create account'}
          </button>

          <button
            className={styles.toggleBtn}
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? "don't have an account? sign up" : 'already have one? log in'}
          </button>

          <button className={styles.skipBtn} onClick={() => navigate('/intent')}>
            continue without account →
          </button>
        </motion.div>
      </div>
    </div>
  )
}
