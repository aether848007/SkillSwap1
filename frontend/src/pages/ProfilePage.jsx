import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import StarRating from '../components/StarRating';
import { detectCategory } from '../utils/detectCategory';

const CATEGORIES = [
  'PROGRAMMING', 'DESIGN', 'LANGUAGE', 'MUSIC',
  'BUSINESS', 'COOKING', 'PHOTOGRAPHY', 'FITNESS', 'OTHER',
];
const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

const LEVEL_CLASS = {
  ADVANCED:     'badge badge-level-advanced',
  INTERMEDIATE: 'badge badge-level-intermediate',
  BEGINNER:     'badge badge-level-beginner',
};

const toLabel = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

const compressImage = (file, maxSize = 400, quality = 0.82) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (ev) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = Math.round((height * maxSize) / width); width = maxSize }
          else { width = Math.round((width * maxSize) / height); height = maxSize }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Compression failed')), 'image/jpeg', quality)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })

const DEFAULT_SKILL_FORM = {
  title: '', category: 'PROGRAMMING', proficiencyLevel: 'BEGINNER',
  description: '', isOffered: true,
};

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();

  const [profile, setProfile]     = useState(null);
  const [skills, setSkills]       = useState([]);
  const [reviews, setReviews]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState('');

  const [editForm, setEditForm]   = useState({ displayName: '', bio: '', city: '' });
  const [skillForm, setSkillForm] = useState(DEFAULT_SKILL_FORM);
  // Tracks whether the user manually picked a category; if not, we auto-detect from the title.
  const [categoryTouched, setCategoryTouched] = useState(false);

  // Update the title and, unless the user has overridden the category, auto-detect it.
  const handleTitleChange = (value) => {
    setSkillForm((f) => {
      const next = { ...f, title: value };
      if (!categoryTouched) {
        const detected = detectCategory(value);
        if (detected) next.category = detected;
      }
      return next;
    });
  };

  const fileInputRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadData = async () => {
    try {
      const [profileRes, skillsRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/skills/my'),
      ]);
      const p = profileRes.data;
      setProfile(p);
      setEditForm({ displayName: p.displayName || '', bio: p.bio || '', city: p.city || '' });
      setSkills(skillsRes.data);
      // Reviews are fetched separately — the endpoint needs the user id and is best-effort.
      if (p?.userId) {
        api.get(`/users/${p.userId}/reviews`)
          .then(r => setReviews(Array.isArray(r.data) ? r.data : []))
          .catch(() => {});
      }
    } catch {
      showToast(t('profile.loadFail'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/users/me', editForm);
      setProfile(res.data);
      updateUser({ displayName: res.data.displayName, bio: res.data.bio, city: res.data.city });
      setEditing(false);
      showToast(t('profile.profileUpdated'));
    } catch {
      showToast(t('profile.profileUpdateFail'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/skills', skillForm);
      setSkills((prev) => [...prev, res.data]);
      setShowModal(false);
      setSkillForm(DEFAULT_SKILL_FORM);
      setCategoryTouched(false);
      showToast(t('profile.skillAdded'));
    } catch {
      showToast(t('profile.skillAddFail'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (skillId) => {
    try {
      await api.delete(`/skills/${skillId}`);
      setSkills((prev) => prev.filter((s) => s.skillId !== skillId));
    } catch {
      showToast(t('profile.skillDeleteFail'));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 192, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
        {t('profile.loadingProfile')}
      </div>
    );
  }

  const initials = profile?.displayName?.[0]?.toUpperCase() ?? '?';

  return (
    <div style={{ maxWidth: 672, margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Profile card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()} title={t('profile.changePhoto')}>
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.5rem', userSelect: 'none' }}>
                  {initials}
                </div>
              )}
              <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{t('profile.edit')}</span>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                e.target.value = '';
                const localUrl = URL.createObjectURL(file);
                setProfile(p => ({ ...p, avatarUrl: localUrl }));
                try {
                  const compressed = await compressImage(file);
                  const form = new FormData();
                  form.append('file', compressed, 'avatar.jpg');
                  const res = await api.post('/users/me/avatar', form);
                  setProfile(p => ({ ...p, avatarUrl: res.data.avatarUrl }));
                  updateUser({ avatarUrl: res.data.avatarUrl });
                  showToast(t('profile.photoUpdated'));
                } catch {
                  setProfile(p => ({ ...p, avatarUrl: profile?.avatarUrl ?? null }));
                  showToast(t('profile.photoFail'));
                }
              }}
            />
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>{profile?.displayName}</h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{profile?.email}</p>
              {profile?.city && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>📍 {profile.city}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => setEditing((v) => !v)}
            className="btn btn-outline btn-sm"
            style={{ flexShrink: 0 }}
          >
            {editing ? t('profile.cancel') : t('profile.edit')}
          </button>
        </div>

        {/* Stats strip — rating, sessions, reviews */}
        {!editing && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
            marginTop: 20, padding: 16,
            background: 'var(--canvas-soft)', borderRadius: 'var(--radius)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <StarRating score={profile?.averageRating || 0} size={16} />
                <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink)' }}>
                  {profile?.averageRating ? profile.averageRating.toFixed(1) : '—'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {t('profile.averageRating')}
              </div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)', lineHeight: 1 }}>
                {profile?.totalSessions || 0}
              </div>
              <div style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {t('profile.sessions')}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)', lineHeight: 1 }}>
                {reviews.length}
              </div>
              <div style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {t('profile.reviews')}
              </div>
            </div>
          </div>
        )}

        {profile?.bio && !editing && (
          <p style={{ marginTop: 16, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{profile.bio}</p>
        )}

        {editing && (
          <form onSubmit={handleUpdateProfile} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">{t('profile.displayName')}</label>
              <input
                type="text"
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                maxLength={100}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">{t('profile.bio')}</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={3}
                maxLength={1000}
                placeholder={t('profile.bioPlaceholder')}
                className="form-textarea"
              />
            </div>
            <div>
              <label className="form-label">{t('profile.location')}</label>
              <input
                type="text"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                placeholder={t('profile.locationPlaceholder')}
                className="form-input"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start' }}
            >
              {saving ? t('profile.saving') : t('profile.saveChanges')}
            </button>
          </form>
        )}
      </div>

      {/* Skills — split into two distinct sections */}
      {(() => {
        const teachSkills = skills.filter(s => s.isOffered !== false)
        const learnSkills = skills.filter(s => s.isOffered === false)

        const openAdd = (offered) => {
          setSkillForm({ ...DEFAULT_SKILL_FORM, isOffered: offered })
          setCategoryTouched(false)
          setShowModal(true)
        }

        const SkillRow = ({ skill }) => (
          <li style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            gap: 12, padding: '12px 14px', background: 'var(--canvas)',
            borderRadius: 'var(--radius)', border: '1px solid var(--border)',
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{skill.title}</span>
                <span className={LEVEL_CLASS[skill.proficiencyLevel] ?? 'badge'}>{t(`levels.${skill.proficiencyLevel}`)}</span>
                <span className="badge badge-category">{t(`categories.${skill.category}`)}</span>
              </div>
              {skill.description && (
                <p style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.45 }}>{skill.description}</p>
              )}
            </div>
            <button
              onClick={() => handleDeleteSkill(skill.skillId)}
              style={{ flexShrink: 0, color: 'var(--mute)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--negative)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--mute)'}
              title={t('profile.remove')}
            >
              ✕
            </button>
          </li>
        )

        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            {/* I can teach — primary-pale tinted card */}
            <section style={{
              background: 'var(--primary-pale)',
              border: '1px solid var(--primary-neutral)',
              borderRadius: 'var(--radius-xl)',
              padding: 24,
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--primary)', color: 'var(--on-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 900, lineHeight: 1,
                  }} aria-hidden>↗</span>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.3px' }}>
                      {t('profile.iCanTeach')}
                    </h2>
                    <div style={{ fontSize: 13, color: 'var(--body)', marginTop: 2 }}>
                      {t('profile.teachCount', { count: teachSkills.length })}
                    </div>
                  </div>
                </div>
                <button onClick={() => openAdd(true)} className="btn btn-primary btn-sm">{t('profile.addShort')}</button>
              </div>

              {teachSkills.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '32px 16px',
                  background: 'var(--canvas)', borderRadius: 'var(--radius)',
                  border: '1px dashed var(--primary-neutral)',
                  color: 'var(--body)', fontSize: 14,
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{t('profile.nothingHere')}</div>
                  {t('profile.nothingTeachHint')}
                </div>
              ) : (
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none' }}>
                  {teachSkills.map(s => <SkillRow key={s.skillId} skill={s} />)}
                </ul>
              )}
            </section>

            {/* I want to learn — sage canvas-soft card with orange accent */}
            <section style={{
              background: 'var(--canvas-soft)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: 24,
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--accent-orange)', color: 'var(--ink)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 900, lineHeight: 1,
                  }} aria-hidden>↙</span>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.3px' }}>
                      {t('profile.iWantToLearn')}
                    </h2>
                    <div style={{ fontSize: 13, color: 'var(--body)', marginTop: 2 }}>
                      {t('profile.learnCount', { count: learnSkills.length })}
                    </div>
                  </div>
                </div>
                <button onClick={() => openAdd(false)} className="btn btn-outline btn-sm">{t('profile.addShort')}</button>
              </div>

              {learnSkills.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '32px 16px',
                  background: 'var(--canvas)', borderRadius: 'var(--radius)',
                  border: '1px dashed var(--border)',
                  color: 'var(--body)', fontSize: 14,
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{t('profile.nothingHere')}</div>
                  {t('profile.nothingLearnHint')}
                </div>
              ) : (
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none' }}>
                  {learnSkills.map(s => <SkillRow key={s.skillId} skill={s} />)}
                </ul>
              )}
            </section>
          </div>
        )
      })()}

      {/* Add skill modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.4px' }}>
                  {skillForm.isOffered ? t('profile.addSkillTeach') : t('profile.addSkillLearn')}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--body)', marginTop: 4 }}>
                  {skillForm.isOffered ? t('profile.teachHint') : t('profile.learnHint')}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ color: 'var(--mute)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSkill} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">
                  {t('profile.skillName')} <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={skillForm.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={t('search.placeholder')}
                  maxLength={100}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">
                    {t('profile.category')} <span style={{ color: 'var(--danger)' }}>*</span>
                    {!categoryTouched && skillForm.title.trim() && detectCategory(skillForm.title) && (
                      <span style={{ color: 'var(--mute)', fontWeight: 400, fontSize: 12, marginLeft: 6 }}>{t('profile.auto')}</span>
                    )}
                  </label>
                  <select
                    value={skillForm.category}
                    onChange={(e) => { setSkillForm({ ...skillForm, category: e.target.value }); setCategoryTouched(true); }}
                    className="form-select"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">
                    {t('profile.level')} <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <select
                    value={skillForm.proficiencyLevel}
                    onChange={(e) => setSkillForm({ ...skillForm, proficiencyLevel: e.target.value })}
                    className="form-select"
                  >
                    {LEVELS.map((l) => <option key={l} value={l}>{t(`levels.${l}`)}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">{t('profile.description')}</label>
                <textarea
                  value={skillForm.description}
                  onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                  rows={2}
                  placeholder={t('profile.descPlaceholder')}
                  className="form-textarea"
                />
              </div>

              {/* isOffered is determined by which '+ Add' button the user clicked. */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                background: skillForm.isOffered ? 'var(--primary-pale)' : 'var(--canvas-soft)',
                borderRadius: 'var(--radius)',
                fontSize: 13, color: 'var(--ink)', fontWeight: 600,
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: skillForm.isOffered ? 'var(--primary)' : 'var(--accent-orange)',
                  color: 'var(--on-primary)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 900, lineHeight: 1,
                }} aria-hidden>{skillForm.isOffered ? '↗' : '↙'}</span>
                {skillForm.isOffered ? t('profile.addingToTeach') : t('profile.addingToLearn')}
              </div>

              <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  {t('profile.cancel')}
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                  {saving ? t('profile.adding') : t('profile.addSkill')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews section */}
      <section style={{
        background: 'var(--canvas)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: 24,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.3px' }}>
              {t('profile.reviews')}
            </h2>
            <div style={{ fontSize: 13, color: 'var(--body)', marginTop: 4 }}>
              {reviews.length === 0
                ? t('profile.reviewsEmpty')
                : t('profile.reviewsSummary', { count: reviews.length })}
            </div>
          </div>
          {reviews.length > 0 && profile?.averageRating != null && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--ink)', lineHeight: 1, letterSpacing: '-1px' }}>
                {profile.averageRating.toFixed(1)}
              </div>
              <StarRating score={profile.averageRating} size={14} />
            </div>
          )}
        </div>

        {reviews.length === 0 ? null : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none' }}>
            {reviews.map(review => (
              <li key={review.ratingId} style={{
                background: 'var(--canvas-soft)',
                borderRadius: 'var(--radius)',
                padding: '14px 16px',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {review.rater?.avatarUrl ? (
                      <img src={review.rater.avatarUrl} alt={review.rater.displayName}
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--primary)', color: 'var(--on-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 13,
                      }}>
                        {(review.rater?.displayName || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                      {review.rater?.displayName || t('admin.colUser')}
                    </div>
                  </div>
                  <StarRating score={review.score} size={14} />
                </div>
                {review.comment && (
                  <p style={{ fontSize: 14, color: 'var(--body)', lineHeight: 1.45, marginTop: 2 }}>
                    "{review.comment}"
                  </p>
                )}
                <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
}
