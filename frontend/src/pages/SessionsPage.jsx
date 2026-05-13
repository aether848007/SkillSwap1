import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useWebSocket } from '../hooks/useWebSocket'
import Toast from '../components/Toast'

const STATUS_COLORS = {
  REQUESTED:   'badge-requested',
  CONFIRMED:   'badge-confirmed',
  COMPLETED:   'badge-completed',
  IN_PROGRESS: 'badge-confirmed',
  CANCELLED:   'badge-cancelled',
  DECLINED:    'badge-cancelled',
  RATED:       'badge-completed',
}

const STATUS_LABELS = {
  REQUESTED:   'Requested',
  CONFIRMED:   'Confirmed',
  COMPLETED:   'Completed',
  IN_PROGRESS: 'In progress',
  CANCELLED:   'Cancelled',
  DECLINED:    'Declined',
  RATED:       'Rated',
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

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get('/sessions')
      setSessions(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  useWebSocket({
    onNotification: (notification) => {
      const sessionTypes = ['SESSION_REQUEST', 'SESSION_ACCEPTED', 'SESSION_DECLINED', 'SESSION_COMPLETED']
      if (sessionTypes.includes(notification.type)) fetchSessions()
    },
  })

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/sessions/${id}/status?status=${status}`)
      fetchSessions()
    } catch { showToast('Failed to update session') }
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
    return new Date(dt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="page-header">
        <h1>My sessions</h1>
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
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading sessions...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <h3>No sessions yet</h3>
          <p>Request a session from a skill provider to get started</p>
        </div>
      ) : (
        filtered.map(session => (
          <div key={session.sessionId} className="session-card fade-in">
            <div className="session-info">
              <h3>{session.skill?.title || 'Skill session'}</h3>
              <div className="session-meta">
                <span>With {session.learner?.userId === user?.userId ? session.provider?.displayName : session.learner?.displayName}</span>
                <span style={{ margin: '0 8px' }}>·</span>
                <span>{formatDate(session.scheduledAt)}</span>
                <span style={{ margin: '0 8px' }}>·</span>
                <span>{session.durationMinutes} min</span>
              </div>
              {session.notes && (
                <div style={{ marginTop: 4, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{session.notes}</div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span className={`badge badge-status ${STATUS_COLORS[session.status] || ''}`}>
                {STATUS_LABELS[session.status] || session.status}
              </span>

              {session.status === 'REQUESTED' && session.provider?.userId === user?.userId && (
                <div className="session-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => updateStatus(session.sessionId, 'CONFIRMED')}>Accept</button>
                  <button className="btn btn-outline btn-sm" onClick={() => updateStatus(session.sessionId, 'DECLINED')}>Decline</button>
                </div>
              )}

              {session.status === 'CONFIRMED' && (
                <button className="btn btn-accent btn-sm" onClick={() => updateStatus(session.sessionId, 'COMPLETED')}>
                  Mark complete
                </button>
              )}

              {session.status === 'COMPLETED' && (
                <button className="btn btn-outline btn-sm" onClick={() => { setRating(session); setScore(5); setComment('') }}>
                  Rate session
                </button>
              )}
            </div>
          </div>
        ))
      )}

      {/* Rating modal */}
      {ratingSession && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setRating(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: 0 }}>Rate this session</h2>
              <button
                onClick={() => setRating(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1 }}
              >✕</button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              {ratingSession.skill?.title} with {ratingSession.learner?.userId === user?.userId
                ? ratingSession.provider?.displayName
                : ratingSession.learner?.displayName}
            </p>

            <div style={{ display: 'flex', gap: 4, marginBottom: 20, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  style={{ fontSize: '2.25rem', background: 'none', border: 'none', cursor: 'pointer', color: n <= score ? 'var(--warning)' : 'var(--border)', lineHeight: 1, transition: 'color 0.15s', padding: '0 4px' }}
                >★</button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Comment (optional)</label>
              <textarea
                className="form-textarea"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="What went well? What could be better?"
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setRating(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitRating} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
