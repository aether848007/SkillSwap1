import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function MessagesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const chatEndRef = useRef(null)

  useEffect(() => { fetchConversations() }, [])

  useEffect(() => {
    if (activeConv) fetchMessages(activeConv.convId)
  }, [activeConv])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations')
      // For each conv ID, get the messages to build a preview
      const convs = []
      for (const convId of res.data) {
        const msgRes = await api.get(`/messages/conversation/${convId}`)
        const msgs = msgRes.data
        if (msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1]
          const otherUser = lastMsg.sender?.userId === user?.userId ? lastMsg.receiver : lastMsg.sender
          convs.push({
            convId,
            otherUser,
            lastMessage: lastMsg.content,
            lastTime: lastMsg.sentAt,
            messages: msgs
          })
        }
      }
      setConversations(convs)
      if (convs.length > 0 && !activeConv) setActiveConv(convs[0])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const fetchMessages = async (convId) => {
    try {
      const res = await api.get(`/messages/conversation/${convId}`)
      setMessages(res.data)
    } catch (e) { console.error(e) }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMsg.trim() || !activeConv) return
    try {
      await api.post('/messages', {
        receiverId: activeConv.otherUser?.userId,
        content: newMsg
      })
      setNewMsg('')
      fetchMessages(activeConv.convId)
    } catch (e) { console.error(e) }
  }

  const formatTime = (dt) => {
    if (!dt) return ''
    const d = new Date(dt)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading messages...</div>

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="page-header">
        <h1>Messages</h1>
      </div>

      {conversations.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <h3>No messages yet</h3>
          <p>Start a conversation by messaging a skill provider from their profile</p>
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
                    <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>{activeConv.otherUser?.displayName?.[0]?.toUpperCase()}</div>
                    {activeConv.otherUser?.displayName}
                  </div>
                </div>
                <div className="chat-messages">
                  {messages.map(msg => (
                    <div key={msg.messageId}
                      className={`message-bubble ${msg.sender?.userId === user?.userId ? 'message-sent' : 'message-received'}`}
                    >
                      {msg.content}
                      <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 4 }}>{formatTime(msg.sentAt)}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form className="chat-input" onSubmit={sendMessage}>
                  <input className="form-input" value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." />
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
