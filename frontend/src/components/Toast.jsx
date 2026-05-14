export default function Toast({ message, onClose }) {
  if (!message) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: '0.3px', padding: '12px 20px', borderRadius: 'var(--radius-sm)', boxShadow: '0 4px 0 var(--primary-shadow)', display: 'flex', alignItems: 'center', gap: 12, zIndex: 200, animation: 'pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
      {message}
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14 }}>✕</button>
      )}
    </div>
  )
}
