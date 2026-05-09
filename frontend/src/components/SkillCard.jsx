import { useNavigate } from 'react-router-dom'

export default function SkillCard({ skill }) {
  const navigate = useNavigate()

  return (
    <div className="card card-skill fade-in" onClick={() => navigate(`/user/${skill.providerUserId}`)}>
      <div className="card-header">
        <div className="avatar">{skill.providerName?.[0]?.toUpperCase()}</div>
        <div className="provider-info">
          <div className="provider-name">{skill.providerName}</div>
          <div className="provider-city">{skill.providerCity}</div>
        </div>
        <div className="rating">
          <span className="star">★</span>
          {skill.providerRating?.toFixed(1) || '—'}
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
