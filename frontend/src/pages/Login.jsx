import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { api } from '../utils/api'
import styles from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const { user, initUser, applyServerAuth, profile } = useStore()
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { setError('please fill all fields'); return }
    setLoading(true)
    setError('')
    initUser()

    try {
      const cur = useStore.getState().user
      let result
      if (mode === 'signup') {
        result = await api.signup({
          email, password,
          userId: cur.id,
          username: profile.name || cur.username,
        })
      } else {
        result = await api.login({ email, password })
      }
      applyServerAuth(result)
      // returning users with a saved profile go straight to matches
      const onboarded = useStore.getState().onboardingComplete
      navigate(onboarded ? '/matches' : '/setup')
    } catch (e) {
      setError(e.message || 'something went wrong')
    } finally {
      setLoading(false)
    }
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

          <button className={styles.skipBtn} onClick={() => {
            useStore.getState().setAccountType('temporary')
            navigate('/setup')
          }}>
            continue without account →
          </button>
        </motion.div>
      </div>
    </div>
  )
}
