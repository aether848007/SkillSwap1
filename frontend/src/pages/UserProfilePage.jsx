import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import StarRating from '../components/StarRating'

const toLabel = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''

export default function UserProfilePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [tab, setTab] = useState('skills')
  const [showSession, setShowSession] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [sessionForm, setSessionForm] = useState({ skillId: '', scheduledAt: '', durationMinutes: 60, notes: '' })
  const [msgContent, setMsgContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [sessionError, setSessionError] = useState('')
  const [messageError, setMessageError] = useState('')

  useEffect(() => {
    fetchProfile()
    fetchReviews()
  }, [id])

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${id}`)
      setProfile(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/users/${id}/reviews`)
      setReviews(res.data)
    } catch (e) { console.error(e) }
  }

  const requestSession = async (e) => {
    e.preventDefault()
    setSessionError('')
    try {
      await api.post('/sessions', {
        providerId: id,
        skillId: sessionForm.skillId,
        scheduledAt: sessionForm.scheduledAt,
        durationMinutes: sessionForm.durationMinutes,
        notes: sessionForm.notes
      })
      setShowSession(false)
      setSuccess('Session request sent! They will receive a notification and can confirm from their Sessions tab.')
      setTimeout(() => setSuccess(''), 6000)
    } catch (e) {
      setSessionError("Couldn't send your request — check your connection and try again.")
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    setMessageError('')
    try {
      await api.post('/messages', { receiverId: id, content: msgContent })
      setShowMessage(false)
      setMsgContent('')
      setSuccess("Message sent! They'll receive a notification and can reply from the Messages tab.")
      setTimeout(() => setSuccess(''), 6000)
    } catch (e) {
      setMessageError("Message couldn't be sent — check your connection and try again.")
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
  if (!profile) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>User not found</div>

  const offeredSkills = (profile.skills || []).filter(s => s.isOffered)
  const soughtSkills = (profile.skills || []).filter(s => !s.isOffered)
  const isOwnProfile = user?.userId === id

  const getDefaultTime = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(15, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  }

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      {success && (
        <div style={{ background: '#d1fae5', color: '#047857', padding: '12px 20px', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span>{success}</span>
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#047857', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>
      )}

      <div className="profile-header">
        <div className="profile-avatar" style={{ padding: 0, overflow: 'hidden' }}>
          {profile.avatarUrl
            ? <img src={profile.avatarUrl} alt={profile.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : profile.displayName?.[0]?.toUpperCase()}
        </div>
        <div className="profile-info" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2>{profile.displayName}</h2>
            {(profile.totalSessions || 0) >= 5 && (profile.averageRating || 0) >= 4.0 && (
              <span
                title="Verified: 5+ completed sessions with a rating of 4.0 or above"
                style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, cursor: 'help' }}
              >
                ✓ Verified
              </span>
            )}
          </div>
          <div className="city">
            {profile.city} • Member since {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </div>
          <div style={{ marginTop: 8, fontSize: '0.92rem', color: 'var(--text-secondary)' }}>{profile.bio}</div>
          <div className="profile-stats">
            <div className="stat">
              <div className="stat-value">{profile.totalSessions || 0}</div>
              <div className="stat-label">Sessions</div>
            </div>
            <div className="stat">
              <div className="stat-value">
                {profile.averageRating ? `★ ${profile.averageRating.toFixed(1)}` : 'New'}
              </div>
              <div className="stat-label">Rating</div>
            </div>
            <div className="stat">
              <div className="stat-value">{offeredSkills.length}</div>
              <div className="stat-label">Skills</div>
            </div>
          </div>
        </div>
        {!isOwnProfile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => { setShowSession(true); setSessionForm({ ...sessionForm, scheduledAt: getDefaultTime() }) }}>
              Request Session
            </button>
            <button className="btn btn-outline" onClick={() => setShowMessage(true)}>
              Message
            </button>
          </div>
        )}
      </div>

      <div className="tabs">
        <div className={`tab ${tab === 'skills' ? 'active' : ''}`} onClick={() => setTab('skills')}>
          Skills Offered ({offeredSkills.length})
        </div>
        <div className={`tab ${tab === 'seeking' ? 'active' : ''}`} onClick={() => setTab('seeking')}>
          Looking For ({soughtSkills.length})
        </div>
        <div className={`tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
          Reviews ({reviews.length})
        </div>
      </div>

      {tab === 'skills' && (
        <div className="skills-grid">
          {offeredSkills.map(skill => (
            <div key={skill.skillId} className="card fade-in">
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{skill.title}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span className="badge badge-category">{toLabel(skill.category)}</span>
                <span className="badge badge-level">{toLabel(skill.proficiencyLevel)}</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{skill.description}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'seeking' && (
        <div className="skills-grid">
          {soughtSkills.map(skill => (
            <div key={skill.skillId} className="card fade-in">
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{skill.title}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span className="badge badge-category">{toLabel(skill.category)}</span>
                <span className="badge badge-level">{toLabel(skill.proficiencyLevel)}</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{skill.description}</div>
            </div>
          ))}
          {soughtSkills.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>No learning goals listed yet</div>}
        </div>
      )}

      {tab === 'reviews' && (
        <div>
          {reviews.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', padding: 20 }}>No reviews yet</div>
          ) : (
            reviews.map(review => (
              <div key={review.ratingId} className="card fade-in" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>{review.rater?.displayName || 'User'}</div>
                  <StarRating score={review.score} />
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>{review.comment}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                  {new Date(review.createdAt).toLocaleDateString(undefined)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Session Request Modal */}
      {showSession && (
        <div className="modal-overlay" onClick={() => { setShowSession(false); setSessionError('') }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Request a Session with {profile.displayName}</h2>
            <form onSubmit={requestSession}>
              <div className="form-group">
                <label className="form-label">Select a Skill</label>
                <select className="form-select" required value={sessionForm.skillId}
                  onChange={e => setSessionForm({ ...sessionForm, skillId: e.target.value })}>
                  <option value="">Choose a skill to learn…</option>
                  {offeredSkills.map(s => <option key={s.skillId} value={s.skillId}>{s.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input className="form-input" type="datetime-local" required value={sessionForm.scheduledAt}
                  onChange={e => setSessionForm({ ...sessionForm, scheduledAt: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <select className="form-select" value={sessionForm.durationMinutes}
                  onChange={e => setSessionForm({ ...sessionForm, durationMinutes: parseInt(e.target.value) })}>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">What do you want to learn?</label>
                <textarea className="form-textarea" value={sessionForm.notes}
                  onChange={e => setSessionForm({ ...sessionForm, notes: e.target.value })}
                  placeholder="Describe what you'd like to focus on…" />
              </div>
              {sessionError && <div className="error-msg">{sessionError}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowSession(false); setSessionError('') }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessage && (
        <div className="modal-overlay" onClick={() => { setShowMessage(false); setMessageError('') }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Message {profile.displayName}</h2>
            <form onSubmit={sendMessage}>
              <div className="form-group">
                <label className="form-label">Your message</label>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Just introduce yourself — a sentence or two is plenty. They'll reply from the Messages tab.
                </p>
                <textarea className="form-textarea" value={msgContent} onChange={e => setMsgContent(e.target.value)}
                  placeholder={`Hi ${profile.displayName}! I saw you offer…`} rows={4} required />
              </div>
              {messageError && <div className="error-msg">{messageError}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowMessage(false); setMessageError('') }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Send</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
