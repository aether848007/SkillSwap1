import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [tab, setTab] = useState('offered')
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [newSkill, setNewSkill] = useState({ title: '', category: 'PROGRAMMING', proficiencyLevel: 'INTERMEDIATE', description: '', isOffered: true })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me')
      setProfile(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const addSkill = async (e) => {
    e.preventDefault()
    try {
      await api.post('/users/skills', { ...newSkill, isOffered: tab === 'offered' })
      setShowAddSkill(false)
      setNewSkill({ title: '', category: 'PROGRAMMING', proficiencyLevel: 'INTERMEDIATE', description: '', isOffered: true })
      fetchProfile()
    } catch (e) { console.error(e) }
  }

  const deleteSkill = async (skillId) => {
    try {
      await api.delete(`/users/skills/${skillId}`)
      fetchProfile()
    } catch (e) { console.error(e) }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading profile...</div>
  if (!profile) return <div style={{ padding: 40, textAlign: 'center' }}>Profile not found</div>

  const offeredSkills = (profile.skills || []).filter(s => s.isOffered)
  const soughtSkills = (profile.skills || []).filter(s => !s.isOffered)

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="profile-header">
        <div className="profile-avatar">{profile.displayName?.[0]?.toUpperCase()}</div>
        <div className="profile-info">
          <h2>{profile.displayName}</h2>
          <div className="city">{profile.city} • Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          <div style={{ marginTop: 8, fontSize: '0.92rem', color: 'var(--text-secondary)' }}>{profile.bio}</div>
          <div className="profile-stats">
            <div className="stat">
              <div className="stat-value">{profile.totalSessions || 0}</div>
              <div className="stat-label">Sessions</div>
            </div>
            <div className="stat">
              <div className="stat-value">★ {profile.averageRating?.toFixed(1) || '—'}</div>
              <div className="stat-label">Rating</div>
            </div>
            <div className="stat">
              <div className="stat-value">{offeredSkills.length}</div>
              <div className="stat-label">Skills Offered</div>
            </div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${tab === 'offered' ? 'active' : ''}`} onClick={() => setTab('offered')}>
          Skills Offered ({offeredSkills.length})
        </div>
        <div className={`tab ${tab === 'sought' ? 'active' : ''}`} onClick={() => setTab('sought')}>
          Learning Goals ({soughtSkills.length})
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowAddSkill(true)}>
          + Add {tab === 'offered' ? 'Skill' : 'Learning Goal'}
        </button>
      </div>

      <div className="skills-grid">
        {(tab === 'offered' ? offeredSkills : soughtSkills).map(skill => (
          <div key={skill.skillId} className="card fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{skill.title}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span className="badge badge-category">{skill.category}</span>
                  <span className="badge badge-level">{skill.proficiencyLevel}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{skill.description}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => deleteSkill(skill.skillId)}
                style={{ color: 'var(--danger)', flexShrink: 0 }}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {showAddSkill && (
        <div className="modal-overlay" onClick={() => setShowAddSkill(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add {tab === 'offered' ? 'Skill' : 'Learning Goal'}</h2>
            <form onSubmit={addSkill}>
              <div className="form-group">
                <label className="form-label">Skill Title</label>
                <input className="form-input" value={newSkill.title} onChange={e => setNewSkill({ ...newSkill, title: e.target.value })}
                  placeholder="e.g. Python Programming" required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={newSkill.category} onChange={e => setNewSkill({ ...newSkill, category: e.target.value })}>
                  {['PROGRAMMING','DESIGN','LANGUAGE','MUSIC','BUSINESS','COOKING','PHOTOGRAPHY','FITNESS','OTHER'].map(c =>
                    <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Proficiency Level</label>
                <select className="form-select" value={newSkill.proficiencyLevel} onChange={e => setNewSkill({ ...newSkill, proficiencyLevel: e.target.value })}>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={newSkill.description} onChange={e => setNewSkill({ ...newSkill, description: e.target.value })}
                  placeholder="Describe what you can teach or want to learn..." />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddSkill(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Skill</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
