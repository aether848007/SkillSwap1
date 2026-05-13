import { useEffect, useRef, useCallback } from 'react'

const WS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/ws'

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
