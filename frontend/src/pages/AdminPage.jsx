import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Toast from '../components/Toast'

function Avatar({ user, size = 36 }) {
  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.displayName}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  }
  const initials = (user?.displayName || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: 'var(--primary-pale)',
      color: 'var(--positive-deep)', fontWeight: 700, fontSize: size * 0.36,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{initials}</div>
  )
}

const STAT_META = [
  { key: 'totalUsers',     label: 'Members',   color: 'var(--primary)' },
  { key: 'totalSkills',    label: 'Skills',     color: '#8b5cf6' },
  { key: 'totalSessions',  label: 'Sessions',   color: '#0ea5e9' },
  { key: 'totalExchanges', label: 'Exchanges',  color: '#f59e0b' },
  { key: 'totalProposals', label: 'Proposals',  color: '#10b981' },
  { key: 'totalMessages',  label: 'Messages',   color: '#6366f1' },
]

export default function AdminPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats]     = useState(null)
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState('')
  const [search, setSearch]   = useState('')
  const [busy, setBusy]       = useState(null)

  useEffect(() => {
    if (user?.role !== 'ADMIN') { navigate('/'); return }
    fetchData()
  }, [user])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data.content ?? usersRes.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const act = async (label, fn) => {
    setBusy(label)
    try {
      const msg = await fn()
      showToast(msg)
      await fetchData()
    } catch (e) {
      showToast(e.response?.data?.error || `${label} failed`)
    } finally {
      setBusy(null)
    }
  }

  const ban      = (u) => act(`ban-${u.userId}`,     async () => { await api.patch(`/admin/users/${u.userId}/ban`);          return `${u.displayName} banned` })
  const unban    = (u) => act(`unban-${u.userId}`,   async () => { await api.patch(`/admin/users/${u.userId}/unban`);        return `${u.displayName} reinstated` })
  const promote  = (u) => act(`role-${u.userId}`,    async () => { await api.patch(`/admin/users/${u.userId}/promote`);      return `${u.displayName} is now admin` })
  const demote   = (u) => act(`role-${u.userId}`,    async () => { await api.patch(`/admin/users/${u.userId}/demote`);       return `${u.displayName} demoted` })
  const verify   = (u) => act(`verify-${u.userId}`,  async () => { await api.patch(`/admin/users/${u.userId}/verify-email`); return `${u.displayName}'s email verified` })
  const del      = (u) => {
    if (!confirm(`Delete ${u.displayName}? This cannot be undone.`)) return
    act(`del-${u.userId}`, async () => { await api.delete(`/admin/users/${u.userId}`); return `${u.displayName} deleted` })
  }

  const loginAs = async (u) => {
    if (!confirm(`Log in as ${u.displayName}? This will replace your current session.`)) return
    setBusy(`imp-${u.userId}`)
    try {
      const res = await api.post(`/admin/users/${u.userId}/impersonate`)
      localStorage.setItem('token', res.data.accessToken)
      localStorage.setItem('user', JSON.stringify(res.data))
      updateUser(res.data)
      navigate('/')
    } catch (e) {
      showToast(e.response?.data?.error || 'Impersonation failed')
    } finally {
      setBusy(null)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return users
    return users.filter(u =>
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.city?.toLowerCase().includes(q)
    )
  }, [users, search])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--mute)' }}>Loading…</div>

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: 1100 }}>
      <div className="page-header" style={{ marginBottom: 28 }}>
        <h1>Admin panel</h1>
        <p>Platform management — {users.length} members</p>
      </div>

      {/* Stats grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 36 }}>
          {STAT_META.map(({ key, label, color }) => (
            <div key={key} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '18px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1, letterSpacing: '-1px' }}>
                {stats[key] ?? 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--mute)', marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', flex: 1 }}>Members</span>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--mute)', pointerEvents: 'none' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, city…"
              style={{
                paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                fontSize: '0.84rem', background: 'var(--bg)', color: 'var(--text)',
                outline: 'none', width: 220,
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['User', 'Email', 'City', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                    color: 'var(--mute)', borderBottom: '1px solid var(--border)',
                    whiteSpace: 'nowrap', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const isSelf = u.userId === user?.userId
                const isLoading = (key) => busy === `${key}-${u.userId}`
                return (
                  <tr key={u.userId} style={{ borderBottom: '1px solid var(--border)', opacity: u.disabled ? 0.55 : 1 }}>
                    {/* User */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar user={u} size={34} />
                        <span style={{ fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{u.displayName}</span>
                        {isSelf && <span style={{ fontSize: '0.7rem', color: 'var(--positive-deep)', fontWeight: 700 }}>you</span>}
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: '12px 14px', color: 'var(--mute)', maxWidth: 200 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.email}
                      </span>
                    </td>

                    {/* City */}
                    <td style={{ padding: '12px 14px', color: 'var(--mute)', whiteSpace: 'nowrap' }}>
                      {u.city || <span style={{ opacity: 0.4 }}>—</span>}
                    </td>

                    {/* Role */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        padding: '2px 9px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                        background: u.role === 'ADMIN' ? '#fef3c7' : 'var(--canvas-soft)',
                        color: u.role === 'ADMIN' ? '#b45309' : 'var(--body)',
                        border: u.role === 'ADMIN' ? '1px solid #fcd34d' : '1px solid var(--border)',
                      }}>
                        {u.role === 'ADMIN' ? 'Admin' : 'Member'}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {u.emailVerified ? (
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: 'var(--primary-pale)', color: 'var(--positive-deep)', border: '1px solid rgba(16,185,129,0.3)' }}>
                            Verified
                          </span>
                        ) : (
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: '#fef9c3', color: '#a16207', border: '1px solid #fde047' }}>
                            Unverified
                          </span>
                        )}
                        {u.disabled && (
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
                            Banned
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Joined */}
                    <td style={{ padding: '12px 14px', color: 'var(--mute)', whiteSpace: 'nowrap' }}>
                      {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* View profile */}
                        <button
                          onClick={() => navigate(`/user/${u.userId}`)}
                          className="btn btn-sm btn-outline"
                          style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                        >
                          View
                        </button>

                        {/* Login as */}
                        {!isSelf && !u.disabled && (
                          <button
                            onClick={() => loginAs(u)}
                            disabled={isLoading('imp')}
                            style={{
                              fontSize: '0.75rem', padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                              background: 'var(--canvas-soft)', color: 'var(--body)',
                              border: '1px solid var(--border)', fontFamily: 'inherit', fontWeight: 600,
                            }}
                          >
                            {isLoading('imp') ? '…' : 'Login as'}
                          </button>
                        )}

                        {/* Verify email */}
                        {!u.emailVerified && (
                          <button
                            onClick={() => verify(u)}
                            disabled={isLoading('verify')}
                            style={{
                              fontSize: '0.75rem', padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                              background: '#fef9c3', color: '#a16207',
                              border: '1px solid #fde047', fontFamily: 'inherit', fontWeight: 600,
                            }}
                          >
                            {isLoading('verify') ? '…' : 'Verify'}
                          </button>
                        )}

                        {/* Promote / Demote */}
                        {!isSelf && u.role !== 'ADMIN' && (
                          <button
                            onClick={() => promote(u)}
                            disabled={isLoading('role')}
                            style={{
                              fontSize: '0.75rem', padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                              background: '#fef3c7', color: '#b45309',
                              border: '1px solid #fcd34d', fontFamily: 'inherit', fontWeight: 600,
                            }}
                          >
                            {isLoading('role') ? '…' : 'Promote'}
                          </button>
                        )}
                        {!isSelf && u.role === 'ADMIN' && (
                          <button
                            onClick={() => demote(u)}
                            disabled={isLoading('role')}
                            style={{
                              fontSize: '0.75rem', padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                              background: 'var(--canvas-soft)', color: 'var(--mute)',
                              border: '1px solid var(--border)', fontFamily: 'inherit', fontWeight: 600,
                            }}
                          >
                            {isLoading('role') ? '…' : 'Demote'}
                          </button>
                        )}

                        {/* Ban / Unban */}
                        {!isSelf && !u.disabled && (
                          <button
                            onClick={() => ban(u)}
                            disabled={isLoading('ban')}
                            style={{
                              fontSize: '0.75rem', padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                              color: 'var(--negative)', background: 'none',
                              border: '1px solid rgba(239,68,68,0.35)', fontFamily: 'inherit', fontWeight: 600,
                            }}
                          >
                            {isLoading('ban') ? '…' : 'Ban'}
                          </button>
                        )}
                        {!isSelf && u.disabled && (
                          <button
                            onClick={() => unban(u)}
                            disabled={isLoading('unban')}
                            style={{
                              fontSize: '0.75rem', padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                              color: 'var(--positive-deep)', background: 'none',
                              border: '1px solid rgba(16,185,129,0.35)', fontFamily: 'inherit', fontWeight: 600,
                            }}
                          >
                            {isLoading('unban') ? '…' : 'Unban'}
                          </button>
                        )}

                        {/* Delete */}
                        {!isSelf && (
                          <button
                            onClick={() => del(u)}
                            disabled={isLoading('del')}
                            style={{
                              fontSize: '0.75rem', padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                              color: '#b91c1c', background: '#fef2f2',
                              border: '1px solid #fca5a5', fontFamily: 'inherit', fontWeight: 600,
                            }}
                          >
                            {isLoading('del') ? '…' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '32px 14px', textAlign: 'center', color: 'var(--mute)', fontSize: '0.88rem' }}>
                    No users match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
