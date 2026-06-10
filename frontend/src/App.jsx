import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useNativeApp } from './hooks/useNativeApp'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import SearchPage from './pages/SearchPage'
import MatchesPage from './pages/MatchesPage'
import SessionsPage from './pages/SessionsPage'
import ExchangesPage from './pages/ExchangesPage'
import ExchangePage from './pages/ExchangePage'
import MessagesPage from './pages/MessagesPage'
import ProfilePage from './pages/ProfilePage'
import UserProfilePage from './pages/UserProfilePage'
import AdminPage from './pages/AdminPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import OnboardingPage from './pages/OnboardingPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
  if (!user) return <Navigate to="/login" />
  if (user.needsOnboarding && window.location.pathname !== '/onboarding') return <Navigate to="/onboarding" />
  return children
}

export default function App() {
  const { user } = useAuth()
  useNativeApp()

  return (
    <div className="app">
      {user && <Navbar />}
      <div className="main-content">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/search" element={<Navigate to="/" replace />} />
          <Route path="/matches" element={<ProtectedRoute><MatchesPage /></ProtectedRoute>} />
          <Route path="/exchanges" element={<ProtectedRoute><ExchangesPage /></ProtectedRoute>} />
          <Route path="/exchange/:id" element={<ProtectedRoute><ExchangePage /></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/user/:id" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  )
}
