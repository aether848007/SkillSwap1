import { useTranslation } from 'react-i18next'

/** Compact EN/RU toggle. Persists choice via i18next localStorage detector. */
export default function LanguageSwitcher({ style }) {
  const { i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || i18n.language || 'en'
  const set = (l) => i18n.changeLanguage(l)

  const btn = (l, label) => (
    <button
      onClick={() => set(l)}
      aria-pressed={lang === l}
      style={{
        background: lang === l ? 'var(--positive-deep)' : 'transparent',
        color: lang === l ? '#fff' : 'var(--text-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 6, padding: '2px 8px', fontSize: '0.78rem', fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ display: 'flex', gap: 4, ...style }}>
      {btn('en', 'EN')}
      {btn('ru', 'RU')}
    </div>
  )
}
