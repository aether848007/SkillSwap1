import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import ProposalModal from '../components/ProposalModal'

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

function ScoreBadge({ score }) {
  const color = score >= 80 ? 'var(--positive-deep)' : score >= 50 ? '#b45309' : 'var(--mute)'
  const bg = score >= 80 ? 'var(--primary-pale)' : score >= 50 ? '#fef3c7' : 'var(--bg)'
  return (
    <span style={{
      background: bg, color, borderRadius: 20,
      fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px',
    }}>
      {score}% match
    </span>
  )
}

function SkillChip({ label, variant = 'offer' }) {
  return (
    <span style={{
      background: variant === 'offer' ? 'var(--primary-pale)' : 'var(--bg)',
      color: variant === 'offer' ? 'var(--positive-deep)' : 'var(--text-secondary)',
      border: variant === 'offer' ? 'none' : '1px solid var(--border)',
      borderRadius: 20, fontSize: '0.78rem', fontWeight: 500, padding: '2px 9px',
    }}>
      {label}
    </span>
  )
}

function MatchCard({ match, onPropose }) {
  const navigate = useNavigate()
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
      padding: '20px', display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar user={match} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{match.displayName}</div>
          {match.city && <div style={{ fontSize: '0.8rem', color: 'var(--mute)' }}>{match.city}</div>}
        </div>
        <ScoreBadge score={match.matchScore} />
      </div>

      {/* They teach me */}
      {match.theyTeachMe?.length > 0 && (
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            They can teach you
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {match.theyTeachMe.map(s => <SkillChip key={s} label={s} variant="offer" />)}
          </div>
        </div>
      )}

      {/* I teach them */}
      {match.iTeachThem?.length > 0 && (
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            You can teach them
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {match.iTeachThem.map(s => <SkillChip key={s} label={s} variant="want" />)}
          </div>
        </div>
      )}

      {/* Stats + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--mute)' }}>
          {match.averageRating > 0 ? `★ ${match.averageRating.toFixed(1)}` : 'New'}{' '}
          · {match.totalSessions} session{match.totalSessions !== 1 ? 's' : ''}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => navigate(`/user/${match.userId}`)}
          >
            View profile
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onPropose(match)}
          >
            Propose exchange
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MatchesPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [proposing, setProposing] = useState(null)

  useEffect(() => {
    api.get('/matches')
      .then(r => setMatches(r.data))
      .catch(e => {
        console.error('Failed to load matches:', e)
        setError(e.response?.data?.error || 'Failed to load matches')
      })
      .finally(() => setLoading(false))
  }, [])

  const mySkills = user?.skills || []
  const hasOffered = mySkills.some(s => s.isOffered)
  const hasWanted  = mySkills.some(s => !s.isOffered)

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: 760 }}>
      <div className="page-header" style={{ marginBottom: 28 }}>
        <h1>Your matches</h1>
        <p>People you can trade skills with — ranked by compatibility</p>
      </div>

      {!loading && (!hasOffered || !hasWanted) && (
        <div style={{
          background: 'var(--primary-pale)', borderRadius: 'var(--radius-sm)',
          padding: '16px 20px', marginBottom: 24, color: 'var(--positive-deep)', fontSize: '0.9rem',
        }}>
          <strong>Tip:</strong> Add skills you can teach <em>and</em> skills you want to learn in your{' '}
          <a href="/profile" style={{ color: 'var(--positive-deep)', fontWeight: 600 }}>profile</a>{' '}
          to see more matches.
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
          <h3>No matches yet</h3>
          <p>Add skills you can teach and skills you want to learn — we'll find compatible people for you.</p>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{matches.length}</span> compatible match{matches.length !== 1 ? 'es' : ''} found
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {matches.map(m => (
              <MatchCard key={m.userId} match={m} onPropose={setProposing} />
            ))}
          </div>
        </>
      )}

      {proposing && (
        <ProposalModal
          match={proposing}
          onClose={() => setProposing(null)}
        />
      )}
    </div>
  )
}
