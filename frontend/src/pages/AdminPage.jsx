import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Toast from '../components/Toast'

export default function AdminPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [stats, setStats]     = useState(null)
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState('')

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

  const banUser = async (id, name) => {
    if (!confirm(`Reset ${name}'s role to Learner?`)) return
    try {
      await api.patch(`/admin/users/${id}/ban`)
      showToast(`${name}'s role reset`)
      fetchData()
    } catch { showToast('Failed to update role') }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="page-header">
        <h1>Admin panel</h1>
        <p>Platform management</p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Members',  value: stats.totalUsers },
            { label: 'Skills',   value: stats.totalSkills },
            { label: 'Sessions', value: stats.totalSessions },
            { label: 'Ratings',  value: stats.totalRatings },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Users table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.95rem' }}>
          All members
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['Name', 'Email', 'Role', 'Joined', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.userId} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{u.displayName}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                      background: u.role === 'ADMIN' ? '#fef3c7' : 'var(--bg)',
                      color: u.role === 'ADMIN' ? '#b45309' : 'var(--text-secondary)',
                    }}>
                      {u.role === 'ADMIN' ? 'Admin' : 'Member'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                    {new Date(u.createdAt).toLocaleDateString(undefined)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {u.role !== 'ADMIN' && u.userId !== user?.userId && (
                      <button
                        onClick={() => banUser(u.userId, u.displayName)}
                        style={{ fontSize: '0.78rem', color: 'var(--danger)', background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Reset role
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
