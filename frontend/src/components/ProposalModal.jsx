import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Toast from './Toast'

/**
 * Propose a reciprocal exchange. The proposer picks one concrete skill they teach
 * and one concrete skill the target teaches. On accept the backend spawns an Exchange.
 *
 * Props:
 *  - targetUserId, targetUserName  — who the proposal goes to
 *  - suggestedTeachTitle           — optional: pre-select the proposer's skill by title
 *  - suggestedLearnTitle           — optional: pre-select the target's skill by title
 *  - onClose()
 */
export default function ProposalModal({ targetUserId, targetUserName, suggestedTeachTitle, suggestedLearnTitle, onClose }) {
  const navigate = useNavigate()
  const [myOffered, setMyOffered] = useState([])
  const [theirOffered, setTheirOffered] = useState([])
  const [offeredSkillId, setOfferedSkillId] = useState('')
  const [requestedSkillId, setRequestedSkillId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/skills/my').catch(() => ({ data: [] })),
      api.get(`/users/${targetUserId}`).catch(() => ({ data: { skills: [] } })),
    ]).then(([mine, theirs]) => {
      const mineOffered = (mine.data || []).filter(s => s.isOffered && s.isActive !== false)
      const theirsOffered = (theirs.data?.skills || []).filter(s => s.isOffered && s.isActive !== false)
      setMyOffered(mineOffered)
      setTheirOffered(theirsOffered)

      const pickByTitle = (list, title) =>
        title ? list.find(s => s.title?.toLowerCase() === title.toLowerCase()) : null
      setOfferedSkillId((pickByTitle(mineOffered, suggestedTeachTitle) || mineOffered[0])?.skillId || '')
      setRequestedSkillId((pickByTitle(theirsOffered, suggestedLearnTitle) || theirsOffered[0])?.skillId || '')
    }).finally(() => setLoading(false))
  }, [targetUserId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!offeredSkillId || !requestedSkillId) {
      setError('Pick one skill to teach and one to learn.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/proposals', {
        toUserId: targetUserId,
        offeredSkillId,
        requestedSkillId,
        message: message.trim() || null,
      })
      setToast('Proposal sent!')
      setTimeout(onClose, 1100)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send proposal')
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <h2>Propose an exchange with {targetUserName}</h2>

          {loading ? (
            <p style={{ color: 'var(--mute)' }}>Loading skills…</p>
          ) : myOffered.length === 0 ? (
            <div>
              <p style={{ color: 'var(--body)', fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>
                You need at least one skill you can teach before proposing an exchange.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={onClose}>Close</button>
                <button className="btn btn-primary" onClick={() => navigate('/profile')}>Add a skill</button>
              </div>
            </div>
          ) : theirOffered.length === 0 ? (
            <div>
              <p style={{ color: 'var(--body)', fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>
                {targetUserName} has no skills listed to teach yet — nothing to swap for right now.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={onClose}>Close</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">You will teach</label>
                <select className="form-select" value={offeredSkillId}
                  onChange={e => setOfferedSkillId(e.target.value)}>
                  {myOffered.map(s => (
                    <option key={s.skillId} value={s.skillId}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div style={{ textAlign: 'center', color: 'var(--positive-deep)', fontSize: 20, fontWeight: 900, margin: '4px 0 12px' }}>
                ⇄
              </div>

              <div className="form-group">
                <label className="form-label">You will learn</label>
                <select className="form-select" value={requestedSkillId}
                  onChange={e => setRequestedSkillId(e.target.value)}>
                  {theirOffered.map(s => (
                    <option key={s.skillId} value={s.skillId}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Message (optional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  maxLength={500}
                  placeholder={`Hi ${targetUserName?.split(' ')[0] || ''}, I'd love to swap skills with you!`}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
                <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 4, textAlign: 'right' }}>
                  {message.length}/500
                </div>
              </div>

              {error && <div className="error-msg">{error}</div>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send proposal'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <Toast message={toast} />
    </>
  )
}
