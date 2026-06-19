import { io } from 'socket.io-client'
import { API_BASE } from './config'

// Real-time server URL — shares the backend base with the REST client
// (resolved in ./config). Empty string means "same origin" (dev proxy).
const SOCKET_URL = API_BASE

let socket = null

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    })
  }
  return socket
}

export const connectSocket = (userId) => {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
    s.once('connect', () => s.emit('register', { userId }))
  } else {
    s.emit('register', { userId })
  }
  return s
}

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect()
  }
}

export default getSocket
