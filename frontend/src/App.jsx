import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Welcome from './pages/Welcome'
import ProfileSetup from './pages/ProfileSetup'
import Preferences from './pages/Preferences'
import Matches from './pages/Matches'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Toast from './components/Toast'
import './styles/globals.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<ProfileSetup />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/chat/:matchId" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </BrowserRouter>
  )
}
