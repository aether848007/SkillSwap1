import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

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
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState('');

  const [editForm, setEditForm]   = useState({ displayName: '', bio: '', city: '', latitude: null, longitude: null });
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
      setEditForm({ displayName: p.displayName || '', bio: p.bio || '', city: p.city || '', latitude: p.latitude || null, longitude: p.longitude || null });
      setSkills(skillsRes.data);
    } catch {
      showToast('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const geocodeCity = async (cityName) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data.length > 0) return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
    } catch {}
    return null;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let form = { ...editForm };
      if (form.city && (!form.latitude || !form.longitude)) {
        const geo = await geocodeCity(form.city);
        if (geo) {
          form = { ...form, ...geo };
          setEditForm(f => ({ ...f, ...geo }));
        }
      }
      const res = await api.put('/users/me', form);
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
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value, latitude: null, longitude: null })}
                placeholder="City, Country"
                className="form-input"
              />
              <div style={{ fontSize: '0.78rem', color: 'var(--mute)', marginTop: 4 }}>
                Coordinates are set automatically when you save.
              </div>
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

      {/* Skills card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
            My Skills
            <span style={{ marginLeft: 8, fontSize: '0.88rem', fontWeight: 400, color: 'var(--text-secondary)' }}>({skills.length})</span>
          </h2>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
            + Add skill
          </button>
        </div>

        {skills.length === 0 ? (
          <p style={{ fontSize: '0.9rem', textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
            No skills yet — add something you can teach!
          </p>
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none' }}>
            {skills.map((skill) => (
              <li
                key={skill.skillId}
                style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {skill.title}
                    </span>
                    <span className={LEVEL_CLASS[skill.proficiencyLevel] ?? 'badge'}>
                      {toLabel(skill.proficiencyLevel)}
                    </span>
                    <span className="badge badge-category">
                      {toLabel(skill.category)}
                    </span>
                    {skill.isOffered === false && (
                      <span className="badge" style={{ background: '#fff7ed', color: '#c2410c' }}>Seeking</span>
                    )}
                  </div>
                  {skill.description && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{skill.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteSkill(skill.skillId)}
                  style={{ flexShrink: 0, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, marginTop: 2, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  title="Remove skill"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add skill modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Add a skill</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}
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

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={skillForm.isOffered}
                  onChange={(e) => setSkillForm({ ...skillForm, isOffered: e.target.checked })}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>I'm offering to teach this skill</span>
              </label>

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

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
}
