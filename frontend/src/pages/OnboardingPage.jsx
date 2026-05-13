import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const CATEGORIES = ['PROGRAMMING', 'DESIGN', 'LANGUAGE', 'MUSIC', 'BUSINESS', 'COOKING', 'PHOTOGRAPHY', 'FITNESS', 'OTHER']
const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
const toLabel = s => s.charAt(0) + s.slice(1).toLowerCase()

const EMPTY_SKILL = { title: '', category: 'PROGRAMMING', proficiencyLevel: 'BEGINNER' }

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const [step, setStep] = useState(1)
  const [offeredSkills, setOfferedSkills] = useState([{ ...EMPTY_SKILL }])
  const [wantedSkills, setWantedSkills]   = useState([{ ...EMPTY_SKILL }])
  const [saving, setSaving] = useState(false)

  const skip = () => {
    localStorage.setItem('onboardingSkipped', '1')
    navigate('/')
  }

  const updateSkill = (list, setList, idx, field, value) => {
    setList(list.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  const addSkill = (list, setList) => {
    if (list.length < 3) setList([...list, { ...EMPTY_SKILL }])
  }

  const removeSkill = (list, setList, idx) => {
    if (list.length > 1) setList(list.filter((_, i) => i !== idx))
  }

  const saveAndFinish = async () => {
    setSaving(true)
    try {
      const valid = (skills, isOffered) => skills.filter(s => s.title.trim()).map(s => ({
        title: s.title.trim(), category: s.category, proficiencyLevel: s.proficiencyLevel,
        isOffered, description: '',
      }))
      const toSave = [...valid(offeredSkills, true), ...valid(wantedSkills, false)]
      await Promise.all(toSave.map(s => api.post('/users/skills', s)))
      const meRes = await api.get('/users/me')
      updateUser(meRes.data)
      localStorage.setItem('onboardingSkipped', '1')
      navigate('/matches')
    } catch {
      setSaving(false)
    }
  }

  const SkillForm = ({ list, setList }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {list.map((skill, idx) => (
        <div key={idx} style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              className="form-input"
              placeholder="Skill name, e.g. Python, Guitar, Spanish..."
              value={skill.title}
              onChange={e => updateSkill(list, setList, idx, 'title', e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="form-input" value={skill.category} onChange={e => updateSkill(list, setList, idx, 'category', e.target.value)} style={{ flex: 1 }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{toLabel(c)}</option>)}
              </select>
              <select className="form-input" value={skill.proficiencyLevel} onChange={e => updateSkill(list, setList, idx, 'proficiencyLevel', e.target.value)} style={{ flex: 1 }}>
                {LEVELS.map(l => <option key={l} value={l}>{toLabel(l)}</option>)}
              </select>
            </div>
          </div>
          {list.length > 1 && (
            <button type="button" onClick={() => removeSkill(list, setList, idx)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', fontSize: 18, lineHeight: 1, padding: '2px 4px', marginTop: 6 }}>
              ×
            </button>
          )}
        </div>
      ))}
      {list.length < 3 && (
        <button type="button" onClick={() => addSkill(list, setList)}
          style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit' }}>
          + Add another
        </button>
      )}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '36px 32px', maxWidth: 500, width: '100%', boxShadow: '0 8px 40px rgba(14,15,12,0.1)' }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {[1, 2].map(i => (
            <div key={i} style={{ height: 4, flex: 1, borderRadius: 4, background: i <= step ? 'var(--primary)' : 'var(--border)', transition: 'background 0.2s' }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: 6 }}>What can you teach?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
              Add up to 3 skills you're comfortable teaching others.
            </p>
            <SkillForm list={offeredSkills} setList={setOfferedSkills} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={skip}>Skip for now</button>
              <button
                className="btn btn-primary"
                onClick={() => setStep(2)}
                disabled={offeredSkills.every(s => !s.title.trim())}
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: 6 }}>What do you want to learn?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
              Add up to 3 skills you'd love someone to teach you.
            </p>
            <SkillForm list={wantedSkills} setList={setWantedSkills} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>Back</button>
              <button
                className="btn btn-primary"
                onClick={saveAndFinish}
                disabled={saving || wantedSkills.every(s => !s.title.trim())}
              >
                {saving ? 'Saving…' : 'See my matches'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
