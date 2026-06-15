import { io } from 'socket.io-client'

// Real-time server URL. In production set VITE_API_URL to your Cloud Run URL
// (Socket.IO and REST share the same origin). In dev it falls back to the
// Vite proxy on the same origin.
const SOCKET_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || ''

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
