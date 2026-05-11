export default function StarRating({ score = 0, max = 5, size = 16, interactive = false, onChange }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          onClick={() => interactive && onChange?.(i + 1)}
          style={{
            fontSize: size,
            color: i < Math.round(score) ? '#f59e0b' : '#d1d5db',
            cursor: interactive ? 'pointer' : 'default',
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </span>
  )
}
