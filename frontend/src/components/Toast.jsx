export default function Toast({ message, onClose }) {
  if (!message) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--canvas)', color: 'var(--ink)', fontSize: 14, fontWeight: 600, padding: '12px 18px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--ink)', display: 'flex', alignItems: 'center', gap: 12, zIndex: 200, animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      {message}
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--mute)', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
      )}
    </div>
  )
}
