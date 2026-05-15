import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import StarRating from '../components/StarRating';

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
      showToast('Failed to load profile');
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
      setEditing(false);
      showToast('Profile updated');
    } catch {
      showToast('Failed to update profile');
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
      showToast('Skill added');
    } catch {
      showToast('Failed to add skill');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (skillId) => {
    try {
      await api.delete(`/skills/${skillId}`);
      setSkills((prev) => prev.filter((s) => s.skillId !== skillId));
    } catch {
      showToast('Failed to delete skill');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 192, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
        Loading profile…
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
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()} title="Click to change photo">
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
                <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>Edit</span>
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
                  showToast('Photo updated');
                } catch {
                  setProfile(p => ({ ...p, avatarUrl: profile?.avatarUrl ?? null }));
                  showToast('Failed to upload photo');
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
            {editing ? 'Cancel' : 'Edit'}
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
                Average rating
              </div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)', lineHeight: 1 }}>
                {profile?.totalSessions || 0}
              </div>
              <div style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                Sessions
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)', lineHeight: 1 }}>
                {reviews.length}
              </div>
              <div style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                Review{reviews.length === 1 ? '' : 's'}
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
              <label className="form-label">Display name</label>
              <input
                type="text"
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                maxLength={100}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={3}
                maxLength={1000}
                placeholder="Tell others what you can teach or want to learn…"
                className="form-textarea"
              />
            </div>
            <div>
              <label className="form-label">Location</label>
              <input
                type="text"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                placeholder="City, Country"
                className="form-input"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start' }}
            >
              {saving ? 'Saving…' : 'Save changes'}
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
                <span className={LEVEL_CLASS[skill.proficiencyLevel] ?? 'badge'}>{toLabel(skill.proficiencyLevel)}</span>
                <span className="badge badge-category">{toLabel(skill.category)}</span>
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
              title="Remove"
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
                      I can teach
                    </h2>
                    <div style={{ fontSize: 13, color: 'var(--body)', marginTop: 2 }}>
                      {teachSkills.length} skill{teachSkills.length === 1 ? '' : 's'} you offer to others
                    </div>
                  </div>
                </div>
                <button onClick={() => openAdd(true)} className="btn btn-primary btn-sm">+ Add</button>
              </div>

              {teachSkills.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '32px 16px',
                  background: 'var(--canvas)', borderRadius: 'var(--radius)',
                  border: '1px dashed var(--primary-neutral)',
                  color: 'var(--body)', fontSize: 14,
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Nothing here yet</div>
                  Add something you're confident teaching — that's how matches find you.
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
                      I want to learn
                    </h2>
                    <div style={{ fontSize: 13, color: 'var(--body)', marginTop: 2 }}>
                      {learnSkills.length} skill{learnSkills.length === 1 ? '' : 's'} you're looking for
                    </div>
                  </div>
                </div>
                <button onClick={() => openAdd(false)} className="btn btn-outline btn-sm">+ Add</button>
              </div>

              {learnSkills.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '32px 16px',
                  background: 'var(--canvas)', borderRadius: 'var(--radius)',
                  border: '1px dashed var(--border)',
                  color: 'var(--body)', fontSize: 14,
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Nothing here yet</div>
                  Tell us what you want to learn — we'll match you with people who teach it.
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
                  {skillForm.isOffered ? 'Add a skill you can teach' : 'Add a skill you want to learn'}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--body)', marginTop: 4 }}>
                  {skillForm.isOffered
                    ? "We'll show this to people looking for someone with your skills."
                    : "We'll find people who can teach you in exchange for your skills."}
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
                  Skill name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={skillForm.title}
                  onChange={(e) => setSkillForm({ ...skillForm, title: e.target.value })}
                  placeholder="e.g. Python, Guitar, Photography"
                  maxLength={100}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">
                    Category <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <select
                    value={skillForm.category}
                    onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                    className="form-select"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{toLabel(c)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">
                    Level <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <select
                    value={skillForm.proficiencyLevel}
                    onChange={(e) => setSkillForm({ ...skillForm, proficiencyLevel: e.target.value })}
                    className="form-select"
                  >
                    {LEVELS.map((l) => <option key={l} value={l}>{toLabel(l)}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={skillForm.description}
                  onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                  rows={2}
                  placeholder="Brief description of what you can teach…"
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
                Adding to: {skillForm.isOffered ? "I can teach" : "I want to learn"}
              </div>

              <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                  {saving ? 'Adding…' : 'Add skill'}
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
              Reviews
            </h2>
            <div style={{ fontSize: 13, color: 'var(--body)', marginTop: 4 }}>
              {reviews.length === 0
                ? 'No reviews yet — complete a session and your partner can rate you.'
                : `What ${reviews.length === 1 ? 'one person says' : `${reviews.length} people say`} about working with you`}
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
                      {review.rater?.displayName || 'User'}
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
