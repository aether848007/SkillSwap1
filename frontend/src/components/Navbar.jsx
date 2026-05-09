import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const isActive = (path) => location.pathname === path ? 'active' : ''

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
      </div>
      <div className="navbar-user">
        <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{user?.displayName}</span>
        <Link to="/profile">
          <div className="navbar-avatar">{user?.displayName?.[0]?.toUpperCase()}</div>
        </Link>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
      </div>
    </nav>
  )
}
