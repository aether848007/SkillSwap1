import { useEffect, useRef, useCallback } from 'react'

// In Capacitor the app is served from https://localhost, so window.location.host
// points at the app shell, not the backend. Prefer an absolute base from env;
// fall back to same-origin for the plain web build (which uses the Vite proxy).
// SockJS negotiates its own transport, so it wants an http(s):// URL, not ws://.
const WS_BASE = import.meta.env.VITE_WS_BASE_URL ||
  `${window.location.protocol === 'https:' ? 'https' : 'http'}://${window.location.host}`
const WS_URL = `${WS_BASE}/ws`

export function useWebSocket({ onMessage, onNotification, conversationId } = {}) {
  const clientRef = useRef(null)
  const onMessageRef = useRef(onMessage)
  const onNotificationRef = useRef(onNotification)

  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])
  useEffect(() => { onNotificationRef.current = onNotification }, [onNotification])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    let client = null

    const connect = async () => {
      try {
        const [{ Client }, SockJSModule] = await Promise.all([
          import('@stomp/stompjs'),
          import('sockjs-client'),
        ])
        const SockJS = SockJSModule.default ?? SockJSModule

        client = new Client({
          webSocketFactory: () => new SockJS(WS_URL),
          connectHeaders: { Authorization: `Bearer ${token}` },
          reconnectDelay: 5000,
          onConnect: () => {
            try {
              const storedUser = localStorage.getItem('user')
              if (storedUser) {
                const userId = JSON.parse(storedUser).userId
                client.subscribe(`/topic/notifications/${userId}`, (frame) => {
                  try { onNotificationRef.current?.(JSON.parse(frame.body)) } catch {}
                })
              }
            } catch {}
          },
          onStompError: () => {},
          onDisconnect: () => {},
        })

        client.activate()
        clientRef.current = client
      } catch {
        // WebSocket unavailable — app continues without real-time updates
      }
    }

    connect()

    return () => {
      try { client?.deactivate() } catch {}
      clientRef.current = null
    }
  }, [])

  // Subscribe/unsubscribe to active conversation
  useEffect(() => {
    const client = clientRef.current
    if (!client?.connected || !conversationId) return

    let sub = null
    try {
      sub = client.subscribe(`/topic/conversation/${conversationId}`, (frame) => {
        try { onMessageRef.current?.(JSON.parse(frame.body)) } catch {}
      })
    } catch {}

    return () => { try { sub?.unsubscribe() } catch {} }
  }, [conversationId])

  const sendMessage = useCallback((destination, body) => {
    try {
      const client = clientRef.current
      if (client?.connected) client.publish({ destination, body: JSON.stringify(body) })
    } catch {}
  }, [])

  return { sendMessage }
}
