import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import ProposalModal from '../components/ProposalModal'
import Toast from '../components/Toast'

function Avatar({ user, size = 44 }) {
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.displayName}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  const initials = (user?.displayName || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: 'var(--primary-pale)',
      color: 'var(--positive-deep)', fontWeight: 700, fontSize: size * 0.36,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function SkillChip({ label, highlight = false }) {
  return (
    <span style={{
      background: highlight ? 'var(--primary-pale)' : 'var(--canvas-soft)',
      color: highlight ? 'var(--positive-deep)' : 'var(--body)',
      border: highlight ? '1px solid rgba(16,185,129,0.35)' : '1px solid var(--border)',
      borderRadius: 20, fontSize: '0.78rem', fontWeight: highlight ? 600 : 400, padding: '2px 10px',
    }}>
      {label}
    </span>
  )
}

function SkillSection({ label, skills, highlighted }) {
  if (!skills?.length) return null
  return (
    <div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {skills.map(s => <SkillChip key={s} label={s} highlight={highlighted?.includes(s)} />)}
      </div>
    </div>
  )
}

function MatchCard({ match, onPropose }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isMutual = match.theyTeachMe?.length > 0 && match.iTeachThem?.length > 0

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
      padding: '20px', display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar user={match} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{match.displayName}</div>
          {match.city && <div style={{ fontSize: '0.8rem', color: 'var(--mute)', marginTop: 1 }}>{match.city}</div>}
        </div>
        {isMutual && (
          <span style={{
            background: 'var(--primary-pale)', color: 'var(--positive-deep)',
            border: '1px solid rgba(16,185,129,0.4)',
            borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px',
            whiteSpace: 'nowrap',
          }}>
            {t('matches.mutual')}
          </span>
        )}
      </div>

      <SkillSection
        label={t('matches.canTeachYou')}
        skills={match.theirOfferedSkills}
        highlighted={match.theyTeachMe}
      />
      <SkillSection
        label={t('matches.wantsToLearn')}
        skills={match.theirWantedSkills}
        highlighted={match.iTeachThem}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--mute)' }}>
          {match.averageRating > 0 ? `★ ${match.averageRating.toFixed(1)}` : t('common.new')}{' '}
          · {t('matches.sessionsCount', { count: match.totalSessions })}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm btn-outline" onClick={() => navigate(`/user/${match.userId}`)}>
            {t('common.viewProfile')}
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => onPropose(match)}>
            {t('matches.proposeExchange')}
          </button>
        </div>
      </div>
    </div>
  )
}

function IncomingProposalCard({ proposal, onAccept, onDecline, busy }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  // A received proposal: the sender offers `offeredSkill` (they teach you) and
  // wants `requestedSkill` (you teach them).
  const theyTeachYou = proposal.offeredSkill?.title
  const youTeachThem = proposal.requestedSkill?.title
  return (
    <div style={{
      background: 'var(--canvas)', border: '1px solid var(--ink)', borderRadius: 'var(--radius-xl)',
      padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar user={proposal.otherUser} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.98rem', color: 'var(--text)' }}>
            {t('matches.wantsToSwap', { name: proposal.otherUser?.displayName })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--mute)', fontWeight: 500 }}>
            {new Date(proposal.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      {proposal.message && (
        <div style={{
          background: 'var(--canvas-soft)', borderRadius: 'var(--radius)',
          padding: '12px 16px', fontSize: 14, color: 'var(--ink)', lineHeight: 1.5,
        }}>
          "{proposal.message}"
        </div>
      )}

      {theyTeachYou && (
        <div>
          <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
            {t('matches.theyCanTeachYou')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            <SkillChip label={theyTeachYou} variant="offer" />
          </div>
        </div>
      )}

      {youTeachThem && (
        <div>
          <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
            {t('matches.youCanTeachThem')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            <SkillChip label={youTeachThem} variant="want" />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button className="btn btn-sm btn-outline" onClick={() => navigate(`/user/${proposal.otherUser?.userId}`)} disabled={busy}>
          {t('common.viewProfile')}
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-sm btn-ghost" onClick={() => onDecline(proposal.proposalId)} disabled={busy}>
          {t('sessions.decline')}
        </button>
        <button className="btn btn-sm btn-primary" onClick={() => onAccept(proposal.proposalId)} disabled={busy}>
          {t('sessions.accept')}
        </button>
      </div>
    </div>
  )
}

export default function MatchesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [matches, setMatches] = useState([])
  const [incoming, setIncoming] = useState([])
  const [mySkills, setMySkills] = useState(null) // null = not loaded yet (hide tip until known)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [proposing, setProposing] = useState(null)
  const [actionBusy, setActionBusy] = useState(null)
  const [toast, setToast] = useState('')
  const [cityOnly, setCityOnly] = useState(false)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800) }

  const loadIncoming = () => {
    api.get('/proposals')
      .then(r => setIncoming((r.data || []).filter(p => p.direction === 'received' && p.status === 'PENDING')))
      .catch(() => {})
  }

  useEffect(() => {
    Promise.all([
      api.get('/matches').then(r => setMatches(r.data)).catch(e => {
        console.error('Failed to load matches:', e)
        setError(e.response?.data?.error || t('matches.failLoad'))
      }),
      api.get('/proposals').then(r => {
        setIncoming((r.data || []).filter(p => p.direction === 'received' && p.status === 'PENDING'))
      }).catch(() => {}),
      // Fresh skills (the cached auth user object can be stale) — drives the "add skills" tip.
      api.get('/skills/my').then(r => setMySkills(r.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const handleAccept = async (id) => {
    setActionBusy(id)
    try {
      const res = await api.patch(`/proposals/${id}/accept`)
      setIncoming(prev => prev.filter(p => p.proposalId !== id))
      showToast(t('matches.accepted'))
      if (res.data?.exchangeId) {
        setTimeout(() => navigate(`/exchange/${res.data.exchangeId}`), 700)
      }
    } catch (e) {
      showToast(e.response?.data?.error || t('matches.failAccept'))
    } finally {
      setActionBusy(null)
    }
  }

  const handleDecline = async (id) => {
    // Optional, friendly reason the proposer will see. Blank/cancel still declines.
    const reason = window.prompt(t('matches.declinePrompt')) || ''
    setActionBusy(id)
    try {
      await api.patch(`/proposals/${id}/decline`, reason.trim() ? { reason: reason.trim() } : {})
      setIncoming(prev => prev.filter(p => p.proposalId !== id))
      showToast(t('matches.declined'))
    } catch (e) {
      showToast(e.response?.data?.error || t('matches.failDecline'))
    } finally {
      setActionBusy(null)
    }
  }

  // Only show the "add skills" tip once skills have actually loaded and one side is missing.
  const hasOffered = mySkills === null || mySkills.some(s => s.isOffered)
  const hasWanted  = mySkills === null || mySkills.some(s => !s.isOffered)

  const visibleMatches = cityOnly && user?.city
    ? matches.filter(m => m.city && m.city.toLowerCase() === user.city.toLowerCase())
    : matches

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: 760 }}>
      <div className="page-header" style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1>{t('matches.title')}</h1>
          <p>{t('matches.subtitle')}</p>
        </div>
        <button
          type="button"
          className={`btn btn-sm ${cityOnly ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setCityOnly(v => !v)}
          disabled={!user?.city}
          title={user?.city ? t('matches.cityTitle', { city: user.city }) : t('matches.cityHint')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 4 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {user?.city ? t('matches.cityOnly', { city: user.city }) : t('search.myCity')}
        </button>
      </div>

      {!loading && incoming.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
              {t('matches.incoming')}
            </h2>
            <span style={{
              background: 'var(--primary-pale)', color: 'var(--positive-deep)', borderRadius: 9999,
              fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}>
              {incoming.length}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {incoming.map(p => (
              <IncomingProposalCard
                key={p.proposalId}
                proposal={p}
                onAccept={handleAccept}
                onDecline={handleDecline}
                busy={actionBusy === p.proposalId}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && (!hasOffered || !hasWanted) && (
        <div style={{
          background: 'var(--primary-pale)', borderRadius: 'var(--radius-sm)',
          padding: '16px 20px', marginBottom: 24, color: 'var(--positive-deep)', fontSize: '0.9rem',
        }}>
          <strong>{t('matches.tip')}</strong> {t('matches.tipText')}
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '14px 18px', marginBottom: 20, color: '#b91c1c', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', padding: 20, height: 200, opacity: 0.5 }} />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <h3>{t('matches.emptyTitle')}</h3>
          <p>{t('matches.emptyHint')}</p>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            {t('matches.countFound', { count: visibleMatches.length })}
            {cityOnly && <span style={{ color: 'var(--mute)' }}>{t('matches.inCity', { city: user?.city })}</span>}
          </div>
          {visibleMatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--mute)', fontSize: '0.9rem' }}>
              {t('matches.noneInCity', { city: user?.city })}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
              {visibleMatches.map(m => (
                <MatchCard key={m.userId} match={m} onPropose={setProposing} />
              ))}
            </div>
          )}
        </>
      )}

      {proposing && (
        <ProposalModal
          targetUserId={proposing.userId}
          targetUserName={proposing.displayName}
          suggestedTeachTitle={proposing.iTeachThem?.[0]}
          suggestedLearnTitle={proposing.theyTeachMe?.[0]}
          onClose={() => { setProposing(null); loadIncoming() }}
        />
      )}
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
