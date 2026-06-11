import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { detectCategory } from '../utils/detectCategory'

const CATEGORIES = ['PROGRAMMING', 'DESIGN', 'LANGUAGE', 'MUSIC', 'BUSINESS', 'COOKING', 'PHOTOGRAPHY', 'FITNESS', 'OTHER']
const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']

const EMPTY_SKILL = { title: '', category: 'PROGRAMMING', proficiencyLevel: 'BEGINNER' }

const updateSkill = (list, setList, idx, field, value) => {
  setList(list.map((s, i) => {
    if (i !== idx) return s
    const next = { ...s, [field]: value }
    // Auto-detect category from the title unless the user has manually chosen one.
    if (field === 'title' && !s.categoryTouched) {
      const detected = detectCategory(value)
      if (detected) next.category = detected
    }
    if (field === 'category') next.categoryTouched = true
    return next
  }))
}

const addSkill = (list, setList) => {
  if (list.length < 3) setList([...list, { ...EMPTY_SKILL }])
}

const removeSkill = (list, setList, idx) => {
  if (list.length > 1) setList(list.filter((_, i) => i !== idx))
}

// Module-level component: defining this inside OnboardingPage would give it a new identity on
// every keystroke, remounting the inputs and closing the mobile keyboard after each character.
function SkillForm({ list, setList, t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {list.map((skill, idx) => (
        <div key={idx} style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              className="form-input"
              placeholder={t('onboarding.skillPlaceholder')}
              value={skill.title}
              onChange={e => updateSkill(list, setList, idx, 'title', e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="form-input" value={skill.category} onChange={e => updateSkill(list, setList, idx, 'category', e.target.value)} style={{ flex: 1 }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
              </select>
              <select className="form-input" value={skill.proficiencyLevel} onChange={e => updateSkill(list, setList, idx, 'proficiencyLevel', e.target.value)} style={{ flex: 1 }}>
                {LEVELS.map(l => <option key={l} value={l}>{t(`levels.${l}`)}</option>)}
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
          {t('onboarding.addAnother')}
        </button>
      )}
    </div>
  )
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { updateUser } = useAuth()
  const [step, setStep] = useState(1)
  const [offeredSkills, setOfferedSkills] = useState([{ ...EMPTY_SKILL }])
  const [wantedSkills, setWantedSkills]   = useState([{ ...EMPTY_SKILL }])
  const [saving, setSaving] = useState(false)

  const skip = () => {
    localStorage.setItem('onboardingSkipped', '1')
    updateUser({ needsOnboarding: false })
    navigate('/')
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
      updateUser({ ...meRes.data, needsOnboarding: false })
      localStorage.setItem('onboardingSkipped', '1')
      navigate('/matches')
    } catch {
      setSaving(false)
    }
  }

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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: 6 }}>{t('onboarding.teachTitle')}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
              {t('onboarding.teachSubtitle')}
            </p>
            <SkillForm list={offeredSkills} setList={setOfferedSkills} t={t} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={skip}>{t('onboarding.skipForNow')}</button>
              <button
                className="btn btn-primary"
                onClick={() => setStep(2)}
                disabled={offeredSkills.every(s => !s.title.trim())}
              >
                {t('onboarding.next')}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: 6 }}>{t('onboarding.learnTitle')}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
              {t('onboarding.learnSubtitle')}
            </p>
            <SkillForm list={wantedSkills} setList={setWantedSkills} t={t} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>{t('common.back')}</button>
              <button
                className="btn btn-primary"
                onClick={saveAndFinish}
                disabled={saving || wantedSkills.every(s => !s.title.trim())}
              >
                {saving ? t('onboarding.saving') : t('onboarding.seeMatches')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
