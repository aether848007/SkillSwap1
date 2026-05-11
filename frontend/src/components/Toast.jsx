export default function Toast({ message, onClose }) {
  if (!message) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#111827', color: '#fff', fontSize: 13, padding: '10px 18px', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 12, zIndex: 200 }}>
      {message}
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14 }}>✕</button>
      )}
    </div>
  )
}
