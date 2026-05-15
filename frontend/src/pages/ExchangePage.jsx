import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import StarRating from '../components/StarRating'
import Toast from '../components/Toast'

const STATUS_LABEL = {
  DRAFT: 'Not scheduled', REQUESTED: 'Time proposed', CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In progress', COMPLETED: 'Completed — rate it', RATED: 'Done',
  DECLINED: 'Time declined', CANCELLED: 'Cancelled',
}
const STATUS_BADGE = {
  DRAFT: 'badge-completed', REQUESTED: 'badge-requested', CONFIRMED: 'badge-confirmed',
  IN_PROGRESS: 'badge-in_progress', COMPLETED: 'badge-confirmed', RATED: 'badge-rated',
  DECLINED: 'badge-declined', CANCELLED: 'badge-cancelled',
}

function fmt(iso) {
  return iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''
}

function RatingForm({ sessionId, onRated, onToast }) {
  const [score, setScore] = useState(5)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      await api.post(`/sessions/${sessionId}/rating`, { score, comment: comment.trim() || null })
      onToast('Thanks for your rating!')
      onRated()
    } catch (e) {
      onToast(e.response?.data?.error || 'Failed to submit rating')
      setBusy(false)
    }
  }

  return (
    <div style={{ background: 'var(--canvas-soft)', borderRadius: 'var(--radius)', padding: 14, marginTop: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Rate this session</div>
      <StarRating score={score} interactive onChange={setScore} size={24} />
      <textarea
        className="form-textarea"
        rows={2}
        maxLength={500}
        placeholder="Optional comment…"
        value={comment}
        onChange={e => setComment(e.target.value)}
        style={{ marginTop: 8 }}
      />
      <button className="btn btn-primary btn-sm" onClick={submit} disabled={busy} style={{ marginTop: 8 }}>
        {busy ? 'Submitting…' : 'Submit rating'}
      </button>
    </div>
  )
}

function SessionCard({ session, onChanged, onToast }) {
  const isLearner = session.viewerRole === 'learner'
  const [when, setWhen] = useState('')
  const [busy, setBusy] = useState(false)
  const [rating, setRating] = useState(false)

  const status = session.status
  const partner = isLearner ? session.provider : session.learner
  const roleLine = isLearner
    ? `You learn "${session.skill?.title}" from ${partner?.displayName}`
    : `You teach "${session.skill?.title}" to ${partner?.displayName}`

  const act = async (fn, okMsg) => {
    setBusy(true)
    try { await fn(); if (okMsg) onToast(okMsg); onChanged() }
    catch (e) { onToast(e.response?.data?.error || 'Action failed'); setBusy(false) }
  }

  const schedule = () => {
    if (!when) { onToast('Pick a date and time first'); return }
    act(() => api.patch(`/sessions/${session.sessionId}/schedule`, { scheduledAt: when }), 'Time proposed')
  }
  const setStatus = (s, msg) =>
    act(() => api.patch(`/sessions/${session.sessionId}/status`, null, { params: { status: s } }), msg)

  return (
    <div style={{ background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15 }}>{session.skill?.title}</div>
          <div style={{ fontSize: 13, color: 'var(--body)', marginTop: 2 }}>{roleLine}</div>
        </div>
        <span className={`badge ${STATUS_BADGE[status] || 'badge-completed'}`}>{STATUS_LABEL[status] || status}</span>
      </div>

      {session.scheduledAt && (
        <div style={{ fontSize: 13, color: 'var(--ink)', marginTop: 10, fontWeight: 600 }}>
          🗓 {fmt(session.scheduledAt)} · {session.durationMinutes} min
        </div>
      )}

      {/* Learner: propose / reschedule a time */}
      {isLearner && (status === 'DRAFT' || status === 'DECLINED' || status === 'CONFIRMED') && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <input
            type="datetime-local"
            className="form-input"
            value={when}
            onChange={e => setWhen(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <button className="btn btn-sm btn-primary" onClick={schedule} disabled={busy}>
            {status === 'CONFIRMED' ? 'Reschedule' : 'Propose time'}
          </button>
        </div>
      )}

      {/* Provider: respond to a proposed time */}
      {!isLearner && status === 'REQUESTED' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn btn-sm btn-primary" onClick={() => setStatus('CONFIRMED', 'Session confirmed')} disabled={busy}>
            Confirm time
          </button>
          <button className="btn btn-sm btn-outline" onClick={() => setStatus('DECLINED', 'Time declined')} disabled={busy}>
            Decline time
          </button>
        </div>
      )}

      {/* Provider waiting */}
      {!isLearner && status === 'DRAFT' && (
        <div style={{ fontSize: 13, color: 'var(--mute)', marginTop: 12 }}>
          Waiting for {partner?.displayName} to propose a time.
        </div>
      )}
      {isLearner && status === 'REQUESTED' && (
        <div style={{ fontSize: 13, color: 'var(--mute)', marginTop: 12 }}>
          Waiting for {partner?.displayName} to confirm.
        </div>
      )}

      {/* Confirmed: either side can complete or cancel */}
      {status === 'CONFIRMED' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn btn-sm btn-primary" onClick={() => setStatus('COMPLETED', 'Marked complete')} disabled={busy}>
            Mark complete
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => setStatus('CANCELLED', 'Session cancelled')} disabled={busy}>
            Cancel
          </button>
        </div>
      )}

      {/* Completed or rated-but-not-yet-rated-by-viewer: show rating UI */}
      {(status === 'COMPLETED' || (status === 'RATED' && !session.viewerHasRated)) && (
        rating
          ? <RatingForm sessionId={session.sessionId} onRated={onChanged} onToast={onToast} />
          : <button className="btn btn-sm btn-primary" onClick={() => setRating(true)} style={{ marginTop: 12 }}>
              Rate this session
            </button>
      )}

      {status === 'RATED' && session.viewerHasRated && (
        <div style={{ fontSize: 13, color: 'var(--positive-deep)', marginTop: 12, fontWeight: 600 }}>
          ✓ Session complete and rated
        </div>
      )}
    </div>
  )
}

export default function ExchangePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [exchange, setExchange] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2800) }

  const load = useCallback(() => {
    api.get(`/exchanges/${id}`)
      .then(r => setExchange(r.data))
      .catch(e => setError(e.response?.data?.error || 'Could not load this exchange'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  const abandon = async () => {
    if (!window.confirm('Close this exchange? This cannot be undone.')) return
    try {
      await api.patch(`/exchanges/${id}/abandon`)
      showToast('Exchange closed')
      setTimeout(() => navigate('/exchanges'), 800)
    } catch (e) {
      showToast(e.response?.data?.error || 'Failed to close')
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--mute)' }}>Loading exchange…</div>
  if (error) return (
    <div className="container" style={{ paddingTop: 32, maxWidth: 640 }}>
      <div className="error-msg">{error}</div>
      <button className="btn btn-outline" onClick={() => navigate('/exchanges')}>Back to exchanges</button>
    </div>
  )

  const done = exchange.status === 'COMPLETED'
  const abandoned = exchange.status === 'ABANDONED'

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 720 }}>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h1>Skill exchange</h1>
        <p>
          With {exchange.partner?.displayName} ·{' '}
          <span style={{ fontWeight: 700, color: done ? 'var(--positive-deep)' : abandoned ? 'var(--negative)' : 'var(--ink)' }}>
            {exchange.status}
          </span>
        </p>
      </div>

      <div style={{
        display: 'flex', gap: 12, marginBottom: 24, padding: 16,
        background: 'var(--primary-pale)', borderRadius: 'var(--radius-lg)',
        fontSize: 14, fontWeight: 600, color: 'var(--positive-deep)',
        alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
      }}>
        <span>You teach {exchange.iTeach?.title}</span>
        <span style={{ fontSize: 18 }}>⇄</span>
        <span>You learn {exchange.theyTeach?.title}</span>
      </div>

      <h2 className="section-title">Sessions</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {(exchange.sessions || []).map(s => (
          <SessionCard key={s.sessionId} session={s} onChanged={load} onToast={showToast} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button className="btn btn-outline" onClick={() => navigate(`/messages`)}>
          Message {exchange.partner?.displayName}
        </button>
        {exchange.status === 'ACTIVE' && (
          <button className="btn btn-ghost" onClick={abandon} style={{ color: 'var(--negative)' }}>
            Abandon exchange
          </button>
        )}
      </div>

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
