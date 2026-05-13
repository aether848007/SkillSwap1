import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

function TopMatchesPreview({ matches }) {
  const navigate = useNavigate()
  if (matches.length === 0) return null
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Top matches</h2>
        <Link to="/matches" style={{ fontSize: '0.83rem', color: 'var(--positive-deep)', fontWeight: 600 }}>See all →</Link>
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {matches.map(m => {
          const initials = (m.displayName || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          const score = m.matchScore
          const scoreColor = score >= 80 ? 'var(--positive-deep)' : score >= 50 ? '#b45309' : 'var(--mute)'
          const scoreBg = score >= 80 ? 'var(--primary-pale)' : score >= 50 ? '#fef3c7' : 'var(--bg)'
          return (
            <button
              key={m.userId}
              onClick={() => navigate(`/user/${m.userId}`)}
              style={{
                background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', padding: '14px 16px',
                border: 'none', cursor: 'pointer', textAlign: 'left', minWidth: 160, flexShrink: 0,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {m.avatarUrl
                  ? <img src={m.avatarUrl} alt={m.displayName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                  : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-pale)', color: 'var(--positive-deep)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials}</div>
                }
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>{m.displayName?.split(' ')[0]}</div>
              </div>
              <span style={{ background: scoreBg, color: scoreColor, borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', alignSelf: 'flex-start' }}>
                {score}% match
              </span>
              {m.theyTeachMe?.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Teaches: {m.theyTeachMe.slice(0, 2).join(', ')}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(dt) {
  const d = new Date(dt)
  const date = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return `${date} at ${time}`
}

function Avatar({ user, size = 36 }) {
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
      color: 'var(--positive-deep)', fontWeight: 700, fontSize: size * 0.38,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

const STATUS_CLASS = {
  REQUESTED: 'badge-requested',
  CONFIRMED: 'badge-confirmed',
  COMPLETED: 'badge-completed',
  IN_PROGRESS: 'badge-confirmed',
  CANCELLED: 'badge-cancelled',
  DECLINED: 'badge-cancelled',
  RATED: 'badge-completed',
}
const STATUS_LABEL = {
  REQUESTED: 'Requested',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In progress',
  CANCELLED: 'Cancelled',
  DECLINED: 'Declined',
  RATED: 'Rated',
}

function SessionRow({ session, userId, onClick }) {
  const isLearner = session.learner?.userId === userId
  const other = isLearner ? session.provider : session.learner
  const role = isLearner ? 'Learning from' : 'Teaching'
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        padding: '10px 0', borderBottom: '1px solid var(--border)',
      }}
    >
      <Avatar user={other} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
          {other?.displayName ?? 'Unknown'}
          <span className={`badge ${STATUS_CLASS[session.status] || ''}`} style={{ fontWeight: 600 }}>
            {STATUS_LABEL[session.status] || session.status}
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {role}: {session.skill?.title ?? 'Session'}
          {session.scheduledAt && <span style={{ marginLeft: 8 }}>· {formatDate(session.scheduledAt)}</span>}
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--mute)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  )
}

function StatCard({ value, label }) {
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
      padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <span style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

function Section({ title, badge, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h2>
        {badge != null && badge > 0 && (
          <span style={{
            background: 'var(--primary)', color: 'var(--on-primary)',
            borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
            padding: '1px 7px', lineHeight: '18px',
          }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', padding: '4px 16px' }}>
        {children}
      </div>
    </div>
  )
}

function EmptyRow({ text, linkTo, linkLabel }) {
  return (
    <div style={{ padding: '14px 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
      {text}{' '}
      {linkTo && <Link to={linkTo} style={{ color: 'var(--positive-deep)', fontWeight: 600 }}>{linkLabel}</Link>}
    </div>
  )
}

function ActionCard({ title, sub, href }) {
  return (
    <Link to={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', padding: '18px 20px',
        transition: 'background 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-pale)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
      >
        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)', marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{sub}</div>
      </div>
    </Link>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [convCount, setConvCount] = useState(0)
  const [topMatches, setTopMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/sessions').then(r => setSessions(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
      api.get('/messages/conversations').then(r => setConvCount(Array.isArray(r.data) ? r.data.length : 0)).catch(() => {}),
      api.get('/matches').then(r => setTopMatches(Array.isArray(r.data) ? r.data.slice(0, 3) : [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const pending = sessions.filter(s =>
    s.status === 'REQUESTED' && s.provider?.userId === user?.userId
  )

  const upcoming = sessions
    .filter(s => s.status === 'CONFIRMED' && new Date(s.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .slice(0, 3)

  const mySkills = user?.skills || []
  const offering = mySkills.filter(s => s.isOffered)
  const wanting = mySkills.filter(s => !s.isOffered)

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: 680 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, marginBottom: 4 }}>
          {greeting()}, {user?.displayName?.split(' ')[0] ?? 'there'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
          Here's what's happening with your exchanges.
        </p>
      </div>

      {/* Top matches preview */}
      {!loading && <TopMatchesPreview matches={topMatches} />}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 32 }}>
        <StatCard value={user?.totalSessions ?? 0} label="Sessions" />
        <StatCard value={user?.averageRating ? user.averageRating.toFixed(1) : '—'} label="Rating" />
        <StatCard value={mySkills.length} label="Skills" />
      </div>

      {/* Pending requests */}
      {!loading && pending.length > 0 && (
        <Section title="Action needed" badge={pending.length}>
          {pending.map(s => (
            <SessionRow key={s.sessionId} session={s} userId={user?.userId} onClick={() => navigate('/sessions')} />
          ))}
          <div style={{ padding: '10px 0' }}>
            <Link to="/sessions" style={{ fontSize: '0.83rem', color: 'var(--positive-deep)', fontWeight: 600 }}>
              View all sessions →
            </Link>
          </div>
        </Section>
      )}

      {/* Upcoming sessions */}
      <Section title="Upcoming sessions">
        {loading ? (
          <EmptyRow text="Loading..." />
        ) : upcoming.length === 0 ? (
          <EmptyRow text="No upcoming sessions." linkTo="/search" linkLabel="Discover skills to get started" />
        ) : (
          <>
            {upcoming.map(s => (
              <SessionRow key={s.sessionId} session={s} userId={user?.userId} onClick={() => navigate('/sessions')} />
            ))}
            <div style={{ padding: '10px 0' }}>
              <Link to="/sessions" style={{ fontSize: '0.83rem', color: 'var(--positive-deep)', fontWeight: 600 }}>
                View all sessions →
              </Link>
            </div>
          </>
        )}
      </Section>

      {/* Skills snapshot */}
      {mySkills.length > 0 && (
        <Section title="Your skills">
          {offering.length > 0 && (
            <div style={{ padding: '10px 0', borderBottom: wanting.length > 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Offering
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {offering.map(s => (
                  <span key={s.skillId} style={{
                    background: 'var(--primary-pale)', color: 'var(--positive-deep)',
                    borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                    padding: '3px 10px',
                  }}>
                    {s.title}
                  </span>
                ))}
              </div>
            </div>
          )}
          {wanting.length > 0 && (
            <div style={{ padding: '10px 0' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Wanting to learn
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {wanting.map(s => (
                  <span key={s.skillId} style={{
                    background: 'var(--bg)', color: 'var(--text-secondary)',
                    border: '1px solid var(--border)', borderRadius: 20,
                    fontSize: '0.8rem', fontWeight: 500, padding: '3px 10px',
                  }}>
                    {s.title}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div style={{ padding: '8px 0' }}>
            <Link to="/profile" style={{ fontSize: '0.83rem', color: 'var(--positive-deep)', fontWeight: 600 }}>
              Manage skills →
            </Link>
          </div>
        </Section>
      )}

      {mySkills.length === 0 && !loading && (
        <Section title="Your skills">
          <EmptyRow text="You haven't added any skills yet." linkTo="/profile" linkLabel="Add skills to your profile" />
        </Section>
      )}

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <ActionCard
          title="Discover skills"
          sub="Browse what the community is offering"
          href="/search"
        />
        <ActionCard
          title={convCount > 0 ? `Messages (${convCount})` : 'Messages'}
          sub="Continue your conversations"
          href="/messages"
        />
      </div>

    </div>
  )
}
