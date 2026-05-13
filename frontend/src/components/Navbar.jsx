import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWebSocket } from '../hooks/useWebSocket'
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
  }, [])

  useEffect(() => {
    const close = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotifs(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  // Real-time notification push via WebSocket
  useWebSocket({
    onNotification: (notif) => {
      setUnread(prev => prev + 1)
      setNotifs(prev => [notif, ...prev])
    },
  })

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
        <img src="/logo.svg" alt="SkillSwap" width="32" height="32" style={{ borderRadius: 6 }} />
        SkillSwap
      </Link>
      <div className="navbar-links">
        <Link to="/" className={isActive('/')}>Home</Link>
        <Link to="/matches" className={isActive('/matches')}>Matches</Link>
        <Link to="/search" className={isActive('/search')}>Discover</Link>
        <Link to="/sessions" className={isActive('/sessions')}>Sessions</Link>
        <Link to="/messages" className={isActive('/messages')}>Messages</Link>
        {isAdmin && <Link to="/admin" className={isActive('/admin')} style={{ color: 'var(--positive-deep)' }}>Admin</Link>}
      </div>
      <div className="navbar-user">
        {/* Notification bell */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            onClick={openNotifs}
            aria-label="Notifications"
            style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '4px 6px', color: 'var(--mute)', display: 'flex', alignItems: 'center' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {unread > 0 && (
              <span style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', borderRadius: '50%', fontSize: 10, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotifs && (
            <div style={{ position: 'absolute', right: 0, top: '110%', width: 320, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 32px rgba(14,15,12,0.12)', zIndex: 200, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Notifications</span>
                {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 12, color: 'var(--positive-deep)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Mark all read</button>}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--mute)', textAlign: 'center' }}>No notifications</div>
                ) : notifs.map(n => (
                  <div key={n.notificationId} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: n.isRead ? 'var(--bg-card)' : 'var(--primary-pale)', fontSize: 13 }}>
                    <div style={{ color: n.isRead ? 'var(--text-secondary)' : 'var(--text)', lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 3 }}>{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{user?.displayName}</span>
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
