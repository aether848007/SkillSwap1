import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useJsApiLoader, StandaloneSearchBox } from '@react-google-maps/api';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

const MAPS_LIBS = ['places'];

const CATEGORIES = [
  'PROGRAMMING', 'DESIGN', 'LANGUAGE', 'MUSIC',
  'BUSINESS', 'COOKING', 'PHOTOGRAPHY', 'FITNESS', 'OTHER',
];
const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

const LEVEL_STYLES = {
  ADVANCED:     'bg-purple-100 text-purple-700',
  INTERMEDIATE: 'bg-blue-100 text-blue-700',
  BEGINNER:     'bg-green-100 text-green-700',
};

const DEFAULT_SKILL_FORM = {
  title: '', category: 'PROGRAMMING', proficiencyLevel: 'BEGINNER',
  description: '', isOffered: true,
};

export default function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile]     = useState(null);
  const [skills, setSkills]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState('');

  const [editForm, setEditForm]   = useState({ displayName: '', bio: '', city: '', latitude: null, longitude: null });
  const [skillForm, setSkillForm] = useState(DEFAULT_SKILL_FORM);

  const searchBoxRef  = useRef(null);
  const fileInputRef  = useRef(null);

  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: MAPS_LIBS,
  });

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
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Loading profile…
      </div>
    );
  }

  const initials = profile?.displayName?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* ── Profile card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()} title="Click to change avatar">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-700 flex items-center justify-center text-white text-2xl font-bold select-none">
                  {initials}
                </div>
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>Edit</span>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const form = new FormData()
                form.append('file', file)
                try {
                  const res = await api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
                  setProfile(p => ({ ...p, avatarUrl: res.data.avatarUrl }))
                  showToast('Avatar updated')
                } catch { showToast('Failed to upload avatar') }
              }}
            />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{profile?.displayName}</h1>
              <p className="text-sm text-gray-400">{profile?.email}</p>
              {profile?.city && (
                <p className="text-sm text-gray-500 mt-0.5">📍 {profile.city}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => setEditing((v) => !v)}
            className="shrink-0 text-sm px-4 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {profile?.bio && !editing && (
          <p className="mt-4 text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
        )}

        {editing && (
          <form onSubmit={handleUpdateProfile} className="mt-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Display name</label>
              <input
                type="text"
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                maxLength={100}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={3}
                maxLength={1000}
                placeholder="Tell others what you can teach or want to learn…"
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
              {mapsLoaded ? (
                <StandaloneSearchBox
                  onLoad={ref => (searchBoxRef.current = ref)}
                  onPlacesChanged={() => {
                    const places = searchBoxRef.current?.getPlaces();
                    if (!places || places.length === 0) return;
                    const place = places[0];
                    const lat = place.geometry?.location?.lat();
                    const lng = place.geometry?.location?.lng();
                    setEditForm(f => ({
                      ...f,
                      city: place.formatted_address || place.name || f.city,
                      latitude: lat ?? f.latitude,
                      longitude: lng ?? f.longitude,
                    }));
                  }}
                >
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    placeholder="City, Country"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </StandaloneSearchBox>
              ) : (
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  placeholder="City, Country"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        )}
      </div>

      {/* ── Skills card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            My Skills
            <span className="ml-2 text-sm font-normal text-gray-400">({skills.length})</span>
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add skill
          </button>
        </div>

        {skills.length === 0 ? (
          <p className="text-sm text-center text-gray-400 py-10">
            No skills yet — add something you can teach!
          </p>
        ) : (
          <ul className="space-y-2">
            {skills.map((skill) => (
              <li
                key={skill.skillId}
                className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-xl"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">{skill.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_STYLES[skill.proficiencyLevel] ?? 'bg-gray-100 text-gray-600'}`}>
                      {skill.proficiencyLevel}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {skill.category}
                    </span>
                    {skill.isOffered === false && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                        Seeking
                      </span>
                    )}
                  </div>
                  {skill.description && (
                    <p className="text-xs text-gray-500 leading-snug">{skill.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteSkill(skill.skillId)}
                  className="shrink-0 text-gray-300 hover:text-red-400 transition-colors text-base leading-none mt-0.5"
                  title="Remove skill"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Add skill modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900">Add a skill</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Skill name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={skillForm.title}
                  onChange={(e) => setSkillForm({ ...skillForm, title: e.target.value })}
                  placeholder="e.g. Python, Guitar, Photography"
                  maxLength={100}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={skillForm.category}
                    onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Level <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={skillForm.proficiencyLevel}
                    onChange={(e) => setSkillForm({ ...skillForm, proficiencyLevel: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  value={skillForm.description}
                  onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                  rows={2}
                  placeholder="Brief description…"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={skillForm.isOffered}
                  onChange={(e) => setSkillForm({ ...skillForm, isOffered: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">I'm offering to teach this skill</span>
              </label>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 text-sm px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
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
