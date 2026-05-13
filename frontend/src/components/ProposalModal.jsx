import { useState } from 'react'
import api from '../api/axios'
import Toast from './Toast'

export default function ProposalModal({ match, onClose }) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/match-requests', {
        toUserId: match.userId,
        theyTeachMe: match.theyTeachMe,
        iTeachThem: match.iTeachThem,
        message: message.trim() || null,
      })
      showToast('Exchange proposed!')
      setTimeout(onClose, 1200)
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send proposal')
      setSubmitting(false)
    }
  }

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(14,15,12,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={onClose}
      >
        <div
          style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '28px', maxWidth: 460, width: '100%', boxShadow: '0 24px 64px rgba(14,15,12,0.2)' }}
          onClick={e => e.stopPropagation()}
        >
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 6, color: 'var(--text)' }}>
            Propose exchange with {match.displayName}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
            Send a friendly proposal — they'll get a notification to accept or decline.
          </p>

          {match.theyTeachMe?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                They teach you
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {match.theyTeachMe.map(s => (
                  <span key={s} style={{ background: 'var(--primary-pale)', color: 'var(--positive-deep)', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, padding: '3px 10px' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {match.iTeachThem?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                You teach them
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {match.iTeachThem.map(s => (
                  <span key={s} style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500, padding: '3px 10px' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Personal message (optional)</label>
              <textarea
                className="form-input"
                rows={3}
                maxLength={500}
                placeholder={`Hey ${match.displayName?.split(' ')[0]}, I'd love to swap skills with you!`}
                value={message}
                onChange={e => setMessage(e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--mute)', marginTop: 4, textAlign: 'right' }}>{message.length}/500</div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send proposal'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Toast message={toast} />
    </>
  )
}
