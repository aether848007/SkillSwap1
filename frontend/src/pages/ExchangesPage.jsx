import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'

const STATUS_STYLE = {
  ACTIVE:    { bg: 'var(--primary-pale)', fg: 'var(--positive-deep)', labelKey: 'statusActive' },
  COMPLETED: { bg: 'var(--canvas-soft)', fg: 'var(--ink)', labelKey: 'statusCompleted' },
  ABANDONED: { bg: 'var(--negative-bg)', fg: 'var(--negative-darkest)', labelKey: 'statusAbandoned' },
}

export default function ExchangesPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
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
        <h1>{t('exchanges.title')}</h1>
        <p>{t('exchanges.subtitle')}</p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--mute)', padding: 20 }}>{t('common.loading')}</div>
      ) : exchanges.length === 0 ? (
        <div className="empty-state">
          <h3>{t('exchanges.emptyTitle')}</h3>
          <p>{t('exchanges.emptyHint')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/matches')} style={{ marginTop: 16 }}>
            {t('exchanges.findMatches')}
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
                    {t('exchanges.with', { name: ex.partner?.displayName })}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--body)', marginTop: 4 }}>
                    {t('exchanges.swapLine')} <strong>{ex.iTeach?.title}</strong> ⇄ {t('exchanges.swapLearn')} <strong>{ex.theyTeach?.title}</strong>
                  </div>
                </div>
                <span className="badge" style={{ background: st.bg, color: st.fg }}>{t(`exchanges.${st.labelKey}`)}</span>
                <span style={{ color: 'var(--mute)', fontSize: 18 }}>→</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
