import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthMsg, setOauthMsg] = useState('')
  const { login, register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register({ email, password, displayName, city })
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Something went wrong')
    }
    setLoading(false)
  }

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail)
    setPassword('password123')
    setIsLogin(true)
  }

  const switchTab = (login) => {
    setIsLogin(login)
    setError('')
    setOauthMsg('')
  }

  return (
    <div className="auth-page">

      {/* ── Left brand panel ── */}
      <div className="auth-left">
        <div className="auth-left-brand">
          <img src="/logo.svg" alt="SkillSwap" width="36" height="36" style={{ borderRadius: 8 }} />
          SkillSwap
        </div>

        <div className="auth-left-body">
          <h1 className="auth-left-headline">
            Teach what you know.<br />Learn what you want.
          </h1>
          <p className="auth-left-sub">
            Exchange skills with real peers. No money, no platforms —
            just two people with something the other wants to learn.
          </p>
          <ul className="auth-left-claims">
            <li>Free — skills for skills, nothing else</li>
            <li>Real peers — not tutors or gig workers</li>
            <li>Verified — rated after every session</li>
          </ul>
        </div>

        <div className="auth-left-notes">
          <div className="auth-note auth-note-c">
            <span>Design</span>
            <span className="auth-note-sep">⇄</span>
            <span>Marketing</span>
          </div>
          <div className="auth-note auth-note-b">
            <span>Spanish</span>
            <span className="auth-note-sep">⇄</span>
            <span>Photography</span>
          </div>
          <div className="auth-note auth-note-a">
            <span>Python</span>
            <span className="auth-note-sep">⇄</span>
            <span>Guitar</span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        <div className="auth-mobile-logo">
          <img src="/logo.svg" alt="SkillSwap" width="36" height="36" style={{ borderRadius: 8 }} />
          SkillSwap
        </div>

        <div className="auth-form-wrap">
          {/* Tab toggle */}
          <div className="auth-tabs">
            <button type="button" className={`auth-tab${isLogin ? ' active' : ''}`} onClick={() => switchTab(true)}>
              Sign in
            </button>
            <button type="button" className={`auth-tab${!isLogin ? ' active' : ''}`} onClick={() => switchTab(false)}>
              Create account
            </button>
          </div>

          {error && <div className="error-msg">{error}</div>}

          {oauthMsg && <div className="auth-oauth-msg">{oauthMsg}</div>}

          <div className="oauth-buttons">
            <button className="oauth-btn" type="button" onClick={() => setOauthMsg('Google login requires OAuth configuration. Use email and password below.')}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button className="oauth-btn" type="button" onClick={() => setOauthMsg('GitHub login requires OAuth configuration. Use email and password below.')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#333" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          <div className="auth-divider">or</div>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label className="form-label">Display name</label>
                  <input
                    className="form-input"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    className="form-input"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Astana"
                  />
                </div>
              </>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {import.meta.env.DEV && (
            <div className="auth-demo">
              <div className="auth-demo-title">Demo accounts (click to fill)</div>
              <div className="auth-demo-list">
                <button type="button" onClick={() => fillDemo('asel@mail.com')}>Asel (Provider) — asel@mail.com</button>
                <button type="button" onClick={() => fillDemo('dmitri@mail.com')}>Dmitri (Provider) — dmitri@mail.com</button>
                <button type="button" onClick={() => fillDemo('mira@mail.com')}>Mira (Admin) — mira@mail.com</button>
                <button type="button" onClick={() => fillDemo('alex@mail.com')}>Alex (Provider) — alex@mail.com</button>
              </div>
              <div className="auth-demo-pw">Password for all: password123</div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
