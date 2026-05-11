import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const STATUS_COLORS = {
  REQUESTED:   'badge-requested',
  CONFIRMED:   'badge-confirmed',
  COMPLETED:   'badge-completed',
  IN_PROGRESS: 'badge-confirmed',
  CANCELLED:   'badge-cancelled',
  DECLINED:    'badge-cancelled',
  RATED:       'badge-completed',
}

export default function SessionsPage() {
  const { user } = useAuth()
  const [sessions, setSessions]     = useState([])
  const [filter, setFilter]         = useState('all')
  const [loading, setLoading]       = useState(true)
  const [ratingSession, setRating]  = useState(null)
  const [score, setScore]           = useState(5)
  const [comment, setComment]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast]           = useState('')

  useEffect(() => { fetchSessions() }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchSessions = async () => {
    try {
      const res = await api.get('/sessions')
      setSessions(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/sessions/${id}/status?status=${status}`)
      fetchSessions()
    } catch (e) { showToast('Failed to update session') }
  }

  const submitRating = async () => {
    if (!ratingSession) return
    setSubmitting(true)
    try {
      await api.post(`/sessions/${ratingSession.sessionId}/rating`, { score, comment })
      showToast('Rating submitted!')
      setRating(null)
      setScore(5)
      setComment('')
      fetchSessions()
    } catch (e) {
      showToast(e.response?.data?.error || 'Failed to submit rating')
    }
    setSubmitting(false)
  }

  const filtered = filter === 'all' ? sessions
    : sessions.filter(s => s.status === filter.toUpperCase())

  const formatDate = (dt) => {
    if (!dt) return '—'
    const d = new Date(dt)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="page-header">
        <h1>My Sessions</h1>
        <p>Manage your skill exchange sessions</p>
      </div>

      <div className="tabs">
        {['all', 'REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(f => (
          <div key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading sessions...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <h3>No sessions yet</h3>
          <p>Request a session from a skill provider to get started</p>
        </div>
      ) : (
        filtered.map(session => (
          <div key={session.sessionId} className="session-card fade-in">
            <div className="session-info">
              <h3>{session.skill?.title || 'Skill Session'}</h3>
              <div className="session-meta">
                <span>With: {session.learner?.userId === user?.userId ? session.provider?.displayName : session.learner?.displayName}</span>
                <span style={{ margin: '0 8px' }}>•</span>
                <span>{formatDate(session.scheduledAt)}</span>
                <span style={{ margin: '0 8px' }}>•</span>
                <span>{session.durationMinutes} min</span>
              </div>
              {session.notes && <div style={{ marginTop: 4, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{session.notes}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span className={`badge badge-status ${STATUS_COLORS[session.status] || ''}`}>
                {session.status}
              </span>
              {session.status === 'REQUESTED' && session.provider?.userId === user?.userId && (
                <div className="session-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => updateStatus(session.sessionId, 'CONFIRMED')}>Accept</button>
                  <button className="btn btn-outline btn-sm" onClick={() => updateStatus(session.sessionId, 'DECLINED')}>Decline</button>
                </div>
              )}
              {session.status === 'CONFIRMED' && (
                <button className="btn btn-accent btn-sm" onClick={() => updateStatus(session.sessionId, 'COMPLETED')}>Mark Complete</button>
              )}
              {session.status === 'COMPLETED' && (
                <button className="btn btn-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  onClick={() => { setRating(session); setScore(5); setComment('') }}>
                  ★ Rate
                </button>
              )}
            </div>
          </div>
        ))
      )}

      {/* Rating modal */}
      {ratingSession && (
        <div className="fixed inset-0" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
          onClick={e => e.target === e.currentTarget && setRating(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Rate this session</h3>
              <button onClick={() => setRating(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              {ratingSession.skill?.title} with {ratingSession.learner?.userId === user?.userId ? ratingSession.provider?.displayName : ratingSession.learner?.displayName}
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setScore(n)}
                  style={{ fontSize: 32, background: 'none', border: 'none', cursor: 'pointer', color: n <= score ? '#f59e0b' : '#d1d5db', lineHeight: 1 }}>
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Leave a comment (optional)..."
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, resize: 'none', fontFamily: 'inherit' }}
            />

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={() => setRating(null)}
                style={{ flex: 1, padding: '9px 0', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={submitRating} disabled={submitting}
                style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: 13, opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Submitting…' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#111', color: '#fff', padding: '10px 18px', borderRadius: 12, fontSize: 13, zIndex: 100 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
