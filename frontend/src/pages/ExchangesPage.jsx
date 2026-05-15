import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const STATUS_STYLE = {
  ACTIVE:    { bg: 'var(--primary-pale)', fg: 'var(--positive-deep)', label: 'Active' },
  COMPLETED: { bg: 'var(--canvas-soft)', fg: 'var(--ink)', label: 'Completed' },
  ABANDONED: { bg: 'var(--negative-bg)', fg: 'var(--negative-darkest)', label: 'Abandoned' },
}

export default function ExchangesPage() {
  const navigate = useNavigate()
  const [exchanges, setExchanges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/exchanges')
      .then(r => setExchanges(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 720 }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1>Your exchanges</h1>
        <p>Every accepted swap and its two teaching sessions</p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--mute)', padding: 20 }}>Loading…</div>
      ) : exchanges.length === 0 ? (
        <div className="empty-state">
          <h3>No exchanges yet</h3>
          <p>Find a match and propose an exchange — once it's accepted it shows up here.</p>
          <button className="btn btn-primary" onClick={() => navigate('/matches')} style={{ marginTop: 16 }}>
            Find matches
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {exchanges.map(ex => {
            const st = STATUS_STYLE[ex.status] || STATUS_STYLE.ACTIVE
            return (
              <button
                key={ex.exchangeId}
                onClick={() => navigate(`/exchange/${ex.exchangeId}`)}
                style={{
                  textAlign: 'left', cursor: 'pointer',
                  background: 'var(--canvas)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: 20,
                  display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'inherit',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15 }}>
                    With {ex.partner?.displayName}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--body)', marginTop: 4 }}>
                    You teach <strong>{ex.iTeach?.title}</strong> ⇄ you learn <strong>{ex.theyTeach?.title}</strong>
                  </div>
                </div>
                <span className="badge" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
                <span style={{ color: 'var(--mute)', fontSize: 18 }}>→</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
