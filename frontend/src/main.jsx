import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import useStore from './store/useStore'
import { setAuthToken } from './utils/api'

// Keep the API client's auth header in sync with the persisted token.
setAuthToken(useStore.getState().token)
useStore.subscribe((state) => setAuthToken(state.token))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
