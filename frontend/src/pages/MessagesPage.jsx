import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useWebSocket } from '../hooks/useWebSocket'

export default function MessagesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv]       = useState(null)
  const [messages, setMessages]           = useState([])
  const [newMsg, setNewMsg]               = useState('')
  const [loading, setLoading]             = useState(true)
  const chatEndRef   = useRef(null)
  const activeConvId = useRef(null)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations')
      const convIds = res.data
      if (!Array.isArray(convIds) || convIds.length === 0) {
        setConversations([])
        return
      }
      const convs = []
      for (const convId of convIds) {
        try {
          const msgRes = await api.get(`/messages/conversation/${convId}`)
          const msgs = Array.isArray(msgRes.data) ? msgRes.data : []
          if (msgs.length > 0) {
            const last = msgs[msgs.length - 1]
            const other = last.sender?.userId === user?.userId ? last.receiver : last.sender
            convs.push({ convId, otherUser: other, lastMessage: last.content, lastTime: last.sentAt })
          }
        } catch { /* skip broken conv */ }
      }
      setConversations(convs)
      if (convs.length > 0 && !activeConvId.current) {
        const first = convs[0]
        setActiveConv(first)
        activeConvId.current = first.convId
      }
    } catch { /* ignore if backend down */ }
    setLoading(false)
  }, [user])

  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return
    try {
      const res = await api.get(`/messages/conversation/${convId}`)
      setMessages(Array.isArray(res.data) ? res.data : [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  useEffect(() => {
    activeConvId.current = activeConv?.convId ?? null
    if (activeConv?.convId) {
      fetchMessages(activeConv.convId)
      // Mark as read when opening a conversation
      api.patch(`/messages/conversation/${activeConv.convId}/read`).catch(() => {})
    }
  }, [activeConv?.convId, fetchMessages])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time messages via WebSocket
  useWebSocket({
    conversationId: activeConv?.convId,
    onMessage: (msg) => {
      if (msg.conversationId === activeConvId.current) {
        setMessages(prev => {
          const exists = prev.some(m => m.messageId === msg.messageId)
          return exists ? prev : [...prev, msg]
        })
        // Mark the incoming message as read immediately
        api.patch(`/messages/conversation/${msg.conversationId}/read`).catch(() => {})
      }
    },
  })

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMsg.trim() || !activeConv) return
    const content = newMsg
    setNewMsg('')
    try {
      const res = await api.post('/messages', { receiverId: activeConv.otherUser?.userId, content })
      setMessages(prev => {
        const exists = prev.some(m => m.messageId === res.data.messageId)
        return exists ? prev : [...prev, res.data]
      })
    } catch { /* ignore */ }
  }

  const formatTime = (dt) => {
    if (!dt) return ''
    return new Date(dt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  const ReadTick = ({ msg }) => {
    if (msg.sender?.userId !== user?.userId) return null
    const read = !!msg.readAt
    return (
      <span style={{ marginLeft: 4, fontSize: '0.65rem', opacity: 0.8 }} title={read ? 'Read' : 'Sent'}>
        {read
          ? <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 5 4 8 9 2"/><polyline points="5 5 8 8 13 2"/></svg>
          : <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 5 4 8 9 2"/></svg>
        }
      </span>
    )
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading messages...</div>

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="page-header">
        <h1>Messages</h1>
      </div>

      {conversations.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <h3>No messages yet</h3>
          <p>Start a conversation by messaging someone from their profile</p>
        </div>
      ) : (
        <div className="messages-layout">
          <div className="conv-list">
            {conversations.map(conv => (
              <div
                key={conv.convId}
                className={`conv-item ${activeConv?.convId === conv.convId ? 'active' : ''}`}
                onClick={() => setActiveConv(conv)}
              >
                <div className="avatar">{conv.otherUser?.displayName?.[0]?.toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{conv.otherUser?.displayName}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.lastMessage}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatTime(conv.lastTime)}</div>
              </div>
            ))}
          </div>

          <div className="chat-area">
            {activeConv ? (
              <>
                <div className="chat-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'var(--on-primary)', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {activeConv.otherUser?.displayName?.[0]?.toUpperCase()}
                    </div>
                    {activeConv.otherUser?.displayName}
                  </div>
                </div>
                <div className="chat-messages">
                  {messages.map((msg, i) => {
                    const isSent = msg.sender?.userId === user?.userId
                    return (
                      <div
                        key={msg.messageId ?? i}
                        className={`message-bubble ${isSent ? 'message-sent' : 'message-received'}`}
                      >
                        {msg.content}
                        <div style={{ fontSize: '0.7rem', opacity: 0.75, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: isSent ? 'flex-end' : 'flex-start', gap: 2 }}>
                          {formatTime(msg.sentAt)}
                          <ReadTick msg={msg} />
                        </div>
                      </div>
                    )
                  })}
                  <div ref={chatEndRef} />
                </div>
                <form className="chat-input" onSubmit={handleSend}>
                  <input
                    className="form-input"
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    placeholder="Type a message..."
                  />
                  <button type="submit" className="btn btn-primary">Send</button>
                </form>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                Select a conversation
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
