import { useNavigate } from 'react-router-dom'
import StarRating from './StarRating'

export default function SkillCard({ skill }) {
  const navigate = useNavigate()

  return (
    <div className="card card-skill fade-in" onClick={() => navigate(`/user/${skill.providerUserId}`)}>
      <div className="card-header">
        {skill.providerAvatar ? (
          <img src={skill.providerAvatar} alt={skill.providerName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div className="avatar">{skill.providerName?.[0]?.toUpperCase()}</div>
        )}
        <div className="provider-info">
          <div className="provider-name">{skill.providerName}</div>
          <div className="provider-city">{skill.providerCity}</div>
        </div>
        <div className="rating" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <StarRating score={skill.providerRating || 0} size={13} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{skill.providerRating?.toFixed(1) || '—'}</span>
        </div>
      </div>
      <div className="skill-title">{skill.title}</div>
      <div className="skill-desc">{skill.description}</div>
      <div className="card-footer">
        <span className="badge badge-category">{skill.category}</span>
        <span className="badge badge-level">{skill.proficiencyLevel}</span>
      </div>
    </div>
  )
}
