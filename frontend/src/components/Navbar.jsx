import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const isActive = (path) => location.pathname === path ? 'active' : ''

  const [unread, setUnread]         = useState(0)
  const [notifs, setNotifs]         = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const bellRef = useRef(null)

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const close = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotifs(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const fetchUnread = async () => {
    try {
      const res = await api.get('/notifications/unread-count')
      setUnread(res.data.count || 0)
    } catch {}
  }

  const openNotifs = async () => {
    if (!showNotifs) {
      try {
        const res = await api.get('/notifications')
        setNotifs(res.data)
      } catch {}
    }
    setShowNotifs(v => !v)
  }

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setUnread(0)
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch {}
  }

  const isAdmin = user?.role === 'ADMIN'

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="#1F4E79"/>
          <path d="M8 16C8 11.58 11.58 8 16 8s8 3.58 8 8-3.58 8-8 8" stroke="#00C9A7" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M24 16c0 4.42-3.58 8-8 8s-8-3.58-8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="16" cy="16" r="3" fill="#00C9A7"/>
        </svg>
        SkillSwap
      </Link>
      <div className="navbar-links">
        <Link to="/" className={isActive('/')}>Home</Link>
        <Link to="/search" className={isActive('/search')}>Discover</Link>
        <Link to="/sessions" className={isActive('/sessions')}>Sessions</Link>
        <Link to="/messages" className={isActive('/messages')}>Messages</Link>
        {isAdmin && <Link to="/admin" className={isActive('/admin')} style={{ color: 'var(--accent)' }}>Admin</Link>}
      </div>
      <div className="navbar-user">
        {/* Notification bell */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            onClick={openNotifs}
            style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '4px 6px', fontSize: 18, color: 'var(--text-secondary)' }}
            title="Notifications"
          >
            🔔
            {unread > 0 && (
              <span style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', borderRadius: '50%', fontSize: 10, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotifs && (
            <div style={{ position: 'absolute', right: 0, top: '110%', width: 320, background: '#fff', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>No notifications</div>
                ) : notifs.map(n => (
                  <div key={n.notificationId} style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', background: n.isRead ? '#fff' : '#eff6ff', fontSize: 13 }}>
                    <div style={{ color: n.isRead ? 'var(--text-secondary)' : 'var(--text)' }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{user?.displayName}</span>
        <Link to="/profile">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
          ) : (
            <div className="navbar-avatar">{user?.displayName?.[0]?.toUpperCase()}</div>
          )}
        </Link>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
      </div>
    </nav>
  )
}
