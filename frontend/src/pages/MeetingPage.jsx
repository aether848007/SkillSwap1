import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Capacitor } from '@capacitor/core'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

// Lazily inject the Jitsi IFrame API script once; resolves when JitsiMeetExternalAPI is ready.
function loadJitsiScript(domain) {
  if (window.JitsiMeetExternalAPI) return Promise.resolve()
  const existing = document.getElementById('jitsi-external-api')
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve)
      existing.addEventListener('error', reject)
    })
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.id = 'jitsi-external-api'
    s.src = `https://${domain}/external_api.js`
    s.async = true
    s.onload = resolve
    s.onerror = reject
    document.body.appendChild(s)
  })
}

export default function MeetingPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [error, setError] = useState('')
  const containerRef = useRef(null)
  const apiRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function start() {
      let meeting
      try {
        const res = await api.get(`/sessions/${sessionId}/meeting`)
        meeting = res.data // { roomName, domain }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || t('meeting.error'))
        return
      }
      if (cancelled) return

      const { roomName, domain } = meeting
      const displayName = user?.displayName || ''

      // On the native Android app, getUserMedia is blocked inside the Capacitor WebView, so open
      // the room in a Chrome Custom Tab where camera/mic permissions are handled by the browser.
      if (Capacitor.isNativePlatform()) {
        try {
          const { Browser } = await import('@capacitor/browser')
          const url = `https://${domain}/${roomName}#userInfo.displayName=%22${encodeURIComponent(displayName)}%22`
          await Browser.open({ url, presentationStyle: 'fullscreen' })
        } catch {
          if (!cancelled) setError(t('meeting.error'))
          return
        }
        // We've handed off to the external browser; return to the prior screen.
        navigate(-1)
        return
      }

      // Web: embed the Jitsi room in an iframe via the external API.
      try {
        await loadJitsiScript(domain)
      } catch {
        if (!cancelled) setError(t('meeting.error'))
        return
      }
      if (cancelled || !containerRef.current) return

      // eslint-disable-next-line no-undef
      const jitsi = new window.JitsiMeetExternalAPI(domain, {
        roomName,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        userInfo: { displayName },
        configOverwrite: { prejoinPageEnabled: true },
      })
      apiRef.current = jitsi
      jitsi.addEventListener('readyToClose', () => navigate(-1))
    }

    start()
    return () => {
      cancelled = true
      try { apiRef.current?.dispose() } catch {}
      apiRef.current = null
    }
  }, [sessionId])

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 32, maxWidth: 560, textAlign: 'center' }}>
        <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>{t('meeting.leave')}</button>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 64px)', background: '#040404' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {!apiRef.current && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#fff', fontSize: 15,
        }}>
          {t('meeting.loading')}
        </div>
      )}
    </div>
  )
}
