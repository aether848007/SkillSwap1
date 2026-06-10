import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useWebSocket } from '../hooks/useWebSocket'
import LanguageSwitcher from './LanguageSwitcher'
import api from '../api/axios'

const ICONS = {
  discover: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  matches: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  exchanges: <><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
  messages: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  admin: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
}

const NavIcon = ({ name }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
)

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
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

  const navItems = [
    { to: '/',          label: t('nav.discover'),  icon: 'discover' },
    { to: '/matches',   label: t('nav.matches'),   icon: 'matches' },
    { to: '/exchanges', label: t('nav.exchanges'), icon: 'exchanges' },
    { to: '/messages',  label: t('nav.messages'),  icon: 'messages' },
  ]
  if (isAdmin) navItems.push({ to: '/admin', label: t('nav.admin'), icon: 'admin' })

  return (
    <>
      <nav className="navbar" aria-label="Primary">
        <Link to="/" className="navbar-brand">
          <img src="/logo.svg" alt="SkillSwap" width="32" height="32" style={{ borderRadius: 6 }} />
          SkillSwap
        </Link>
        <div className="navbar-links">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`${isActive(item.to)}${item.to === '/admin' ? ' nav-admin' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="navbar-user">
          {/* Notification bell */}
          <div ref={bellRef} style={{ position: 'relative' }}>
            <button
              onClick={openNotifs}
              aria-label={t('nav.notifications')}
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
              <div style={{ position: 'absolute', right: 0, top: '110%', width: 'min(320px, calc(100vw - 24px))', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 32px rgba(14,15,12,0.12)', zIndex: 200, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{t('nav.notifications')}</span>
                  {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 12, color: 'var(--positive-deep)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{t('nav.markAllRead')}</button>}
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifs.length === 0 ? (
                    <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--mute)', textAlign: 'center' }}>{t('nav.noNotifications')}</div>
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

          <LanguageSwitcher style={{ marginRight: 4 }} />
          <span className="navbar-username" style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{user?.displayName}</span>
          <Link to="/profile" aria-label={t('nav.profile')}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
            ) : (
              <div className="navbar-avatar">{user?.displayName?.[0]?.toUpperCase()}</div>
            )}
          </Link>
          <button className="btn btn-ghost btn-sm navbar-logout" onClick={logout}>{t('common.logout')}</button>
        </div>
      </nav>

      {/* Bottom navigation — mobile only (toggled via CSS) */}
      <nav className="bottom-nav" aria-label="Sections">
        {navItems.map(item => (
          <Link key={item.to} to={item.to} className={isActive(item.to)} aria-label={item.label}>
            <NavIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
