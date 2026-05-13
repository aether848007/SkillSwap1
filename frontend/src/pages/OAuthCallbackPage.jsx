import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const { googleLogin } = useAuth()
  const navigate = useNavigate()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error || !code) {
      navigate('/login')
      return
    }

    called.current = true
    googleLogin(code)
      .then(() => navigate('/'))
      .catch(() => navigate('/login'))
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12, animation: 'spin 1s linear infinite' }} aria-hidden="true">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <p style={{ fontSize: '0.94rem' }}>Signing in with Google...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
