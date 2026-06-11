import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import StarRating from '../components/StarRating'
import ProposalModal from '../components/ProposalModal'

export default function UserProfilePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [tab, setTab] = useState('skills')
  const [showPropose, setShowPropose] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [msgContent, setMsgContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [messageError, setMessageError] = useState('')
  const [blockBusy, setBlockBusy] = useState(false)

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

  const toggleBlock = async () => {
    setBlockBusy(true)
    try {
      if (profile.isBlocked) {
        await api.delete(`/users/${id}/block`)
        setProfile(p => ({ ...p, isBlocked: false }))
        setSuccess(t('userProfile.unblocked', { name: profile.displayName }))
      } else {
        await api.post(`/users/${id}/block`)
        setProfile(p => ({ ...p, isBlocked: true }))
        setSuccess(t('userProfile.blocked', { name: profile.displayName }))
      }
      setTimeout(() => setSuccess(''), 5000)
    } catch (e) {
      setMessageError(t('userProfile.blockFail'))
    }
    setBlockBusy(false)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    setMessageError('')
    try {
      await api.post('/messages', { receiverId: id, content: msgContent })
      setShowMessage(false)
      setMsgContent('')
      setSuccess(t('userProfile.messageSent'))
      setTimeout(() => setSuccess(''), 6000)
    } catch (e) {
      setMessageError(t('userProfile.messageFail'))
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>{t('common.loading')}</div>
  if (!profile) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>{t('userProfile.notFound')}</div>

  const offeredSkills = (profile.skills || []).filter(s => s.isOffered)
  const soughtSkills = (profile.skills || []).filter(s => !s.isOffered)
  const isOwnProfile = user?.userId === id

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
                title={t('userProfile.verifiedTitle')}
                style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, cursor: 'help' }}
              >
                {t('userProfile.verified')}
              </span>
            )}
          </div>
          <div className="city">
            {t('userProfile.memberSince', { city: profile.city, date: new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) })}
          </div>
          <div style={{ marginTop: 8, fontSize: '0.92rem', color: 'var(--text-secondary)' }}>{profile.bio}</div>
          <div className="profile-stats">
            <div className="stat">
              <div className="stat-value">{profile.totalSessions || 0}</div>
              <div className="stat-label">{t('userProfile.sessions')}</div>
            </div>
            <div className="stat">
              <div className="stat-value">
                {profile.averageRating ? `★ ${profile.averageRating.toFixed(1)}` : t('common.new')}
              </div>
              <div className="stat-label">{t('userProfile.rating')}</div>
            </div>
            <div className="stat">
              <div className="stat-value">{offeredSkills.length}</div>
              <div className="stat-label">{t('userProfile.skills')}</div>
            </div>
          </div>
        </div>
        {!isOwnProfile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {profile.isBlocked ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 180, textAlign: 'center' }}>
                {t('userProfile.youBlocked')}
              </div>
            ) : (
              <>
                <button className="btn btn-primary" onClick={() => setShowPropose(true)}>
                  {t('userProfile.proposeExchange')}
                </button>
                <button className="btn btn-outline" onClick={() => setShowMessage(true)}>
                  {t('userProfile.message')}
                </button>
              </>
            )}
            <button className="btn btn-ghost" onClick={toggleBlock} disabled={blockBusy}
              style={{ color: profile.isBlocked ? 'var(--primary)' : '#a7000d', fontSize: '0.85rem' }}>
              {blockBusy ? '…' : profile.isBlocked ? t('common.unblock') : t('common.block')}
            </button>
          </div>
        )}
      </div>

      <div className="tabs">
        <div className={`tab ${tab === 'skills' ? 'active' : ''}`} onClick={() => setTab('skills')}>
          {t('userProfile.skillsOffered', { count: offeredSkills.length })}
        </div>
        <div className={`tab ${tab === 'seeking' ? 'active' : ''}`} onClick={() => setTab('seeking')}>
          {t('userProfile.lookingFor', { count: soughtSkills.length })}
        </div>
        <div className={`tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
          {t('userProfile.reviews', { count: reviews.length })}
        </div>
      </div>

      {tab === 'skills' && (
        <div className="skills-grid">
          {offeredSkills.map(skill => (
            <div key={skill.skillId} className="card fade-in">
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{skill.title}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span className="badge badge-category">{t(`categories.${skill.category}`)}</span>
                <span className="badge badge-level">{t(`levels.${skill.proficiencyLevel}`)}</span>
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
                <span className="badge badge-category">{t(`categories.${skill.category}`)}</span>
                <span className="badge badge-level">{t(`levels.${skill.proficiencyLevel}`)}</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{skill.description}</div>
            </div>
          ))}
          {soughtSkills.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>{t('userProfile.noGoals')}</div>}
        </div>
      )}

      {tab === 'reviews' && (
        <div>
          {reviews.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', padding: 20 }}>{t('userProfile.noReviews')}</div>
          ) : (
            reviews.map(review => (
              <div key={review.ratingId} className="card fade-in" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>{review.rater?.displayName || t('admin.colUser')}</div>
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

      {/* Propose Exchange */}
      {showPropose && profile && (
        <ProposalModal
          targetUserId={id}
          targetUserName={profile.displayName}
          onClose={() => setShowPropose(false)}
        />
      )}

      {/* Message Modal */}
      {showMessage && (
        <div className="modal-overlay" onClick={() => { setShowMessage(false); setMessageError('') }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{t('userProfile.messageTitle', { name: profile.displayName })}</h2>
            <form onSubmit={sendMessage}>
              <div className="form-group">
                <label className="form-label">{t('userProfile.yourMessage')}</label>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {t('userProfile.messageHint')}
                </p>
                <textarea className="form-textarea" value={msgContent} onChange={e => setMsgContent(e.target.value)}
                  placeholder={t('userProfile.messagePlaceholder', { name: profile.displayName })} rows={4} required />
              </div>
              {messageError && <div className="error-msg">{messageError}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowMessage(false); setMessageError('') }}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('common.send')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
