import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import styles from './Toast.module.css'

export default function Toast() {
  const { notifications, clearNotification } = useStore()

  useEffect(() => {
    notifications.forEach(n => {
      const timer = setTimeout(() => clearNotification(n.id), 4000)
      return () => clearTimeout(timer)
    })
  }, [notifications])

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {notifications.slice(0, 3).map(n => (
          <motion.div
            key={n.id}
            className={`${styles.toast} ${styles[n.type] || ''}`}
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            onClick={() => clearNotification(n.id)}
          >
            <span className={styles.toastText}>{n.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
