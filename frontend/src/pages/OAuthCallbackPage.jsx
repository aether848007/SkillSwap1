import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const { googleLogin } = useAuth()
  const navigate = useNavigate()
  const called = useRef(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (called.current) return
    const code = searchParams.get('code')
    const googleError = searchParams.get('error')

    if (googleError) {
      setErr(`Google returned: ${googleError}. Make sure ${window.location.origin}/auth/callback is in your Google Cloud authorized redirect URIs.`)
      return
    }
    if (!code) {
      setErr('No authorization code returned by Google.')
      return
    }

    called.current = true
    googleLogin(code)
      .then(() => navigate('/'))
      .catch((e) => {
        const msg = e.response?.data?.error || e.response?.data?.message || e.message || 'Token exchange failed'
        setErr(`Backend rejected the Google code: ${msg}. Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set on the backend.`)
      })
  }, [])

  if (err) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
        <div style={{ maxWidth: 480, textAlign: 'center', background: 'var(--canvas)', borderRadius: 'var(--radius-xl)', padding: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)', marginBottom: 12, letterSpacing: '-0.4px' }}>
            Google sign-in failed
          </h2>
          <p style={{ fontSize: 14, color: 'var(--body)', lineHeight: 1.5, marginBottom: 24 }}>{err}</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Back to sign in</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', color: 'var(--body)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12, animation: 'spin 1s linear infinite' }} aria-hidden="true">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <p style={{ fontSize: 14 }}>Signing in with Google…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
