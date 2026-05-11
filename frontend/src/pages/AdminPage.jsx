import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function AdminPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [stats, setStats]   = useState(null)
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast]   = useState('')

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
    if (!confirm(`Reset ${name}'s role to LEARNER?`)) return
    try {
      await api.patch(`/admin/users/${id}/ban`)
      showToast(`${name} role reset`)
      fetchData()
    } catch { showToast('Failed') }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p>Platform management</p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Users',    value: stats.totalUsers },
            { label: 'Skills',   value: stats.totalSkills },
            { label: 'Sessions', value: stats.totalSessions },
            { label: 'Ratings',  value: stats.totalRatings },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Users table */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Users</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Name', 'Email', 'Role', 'Joined', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.userId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 500 }}>{u.displayName}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: u.role === 'ADMIN' ? '#fef3c7' : u.role === 'PROVIDER' ? '#dbeafe' : '#f3f4f6', color: u.role === 'ADMIN' ? '#b45309' : u.role === 'PROVIDER' ? '#1d4ed8' : '#6b7280' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '10px 16px' }}>
                    {u.role !== 'ADMIN' && u.userId !== user?.userId && (
                      <button onClick={() => banUser(u.userId, u.displayName)}
                        style={{ fontSize: 12, color: '#ef4444', background: 'none', border: '1px solid #fca5a5', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
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

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#111', color: '#fff', padding: '10px 18px', borderRadius: 12, fontSize: 13, zIndex: 100 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
