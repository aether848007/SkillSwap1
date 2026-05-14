import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIconPng from 'leaflet/dist/images/marker-icon.png'
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png'
import api from '../api/axios'
import SkillCard from '../components/SkillCard'
import { useAuth } from '../context/AuthContext'

// Fix Leaflet default marker icons broken by Vite's asset pipeline
const leafletIcon = new L.Icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const CATEGORIES = ['All', 'PROGRAMMING', 'DESIGN', 'LANGUAGE', 'MUSIC', 'BUSINESS', 'COOKING', 'PHOTOGRAPHY', 'FITNESS']
const MAP_STYLE = { width: '100%', height: '520px' }
const DEFAULT_CENTER = [48.0, 66.0] // Kazakhstan center

const toLabel = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''

export default function SearchPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [skills, setSkills] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('rating')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('list')
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
  const [locating, setLocating] = useState(false)
  const [nearMeMsg, setNearMeMsg] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 20

  useEffect(() => { setPage(0); fetchSkills(undefined, 0, true) }, [category])

  const fetchSkills = async (q, p = 0, reset = false) => {
    setLoading(true)
    try {
      const params = { page: p, size: PAGE_SIZE }
      if (q) params.query = q
      else if (category !== 'All') params.category = category
      const res = await api.get('/search', { params })
      let data = res.data.content ?? res.data
      const tot = res.data.total ?? data.length
      if (sort === 'rating') data.sort((a, b) => (b.providerRating || 0) - (a.providerRating || 0))
      setSkills(prev => reset || p === 0 ? data : [...prev, ...data])
      setTotal(tot)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchSkills(query || undefined, next, false)
  }

  const fetchNearby = async (lat, lng) => {
    setLoading(true)
    try {
      const params = { lat, lng, radiusKm: 50 }
      if (query) params.query = query
      const res = await api.get('/search/nearby', { params })
      setSkills(res.data)
      setMapCenter([lat, lng])
      setView('map')
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const fetchByCity = async (city) => {
    setLoading(true)
    try {
      const res = await api.get('/search/by-city', { params: { city } })
      setSkills(res.data)
      const first = res.data.find(s => s.providerLat && s.providerLng)
      if (first) setMapCenter([first.providerLat, first.providerLng])
      setView(res.data.length > 0 ? 'list' : view)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleNearMe = () => {
    setNearMeMsg('')
    if (!navigator.geolocation) {
      if (user?.city) {
        setNearMeMsg(`Showing people in ${user.city}`)
        fetchByCity(user.city)
      }
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false)
        fetchNearby(coords.latitude, coords.longitude)
      },
      () => {
        setLocating(false)
        if (user?.city) {
          setNearMeMsg(`Location access denied — showing people in ${user.city}`)
          fetchByCity(user.city)
        } else {
          setNearMeMsg('Enable location access or set your city in your profile.')
        }
      },
      { timeout: 8000 }
    )
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    setNearMeMsg('')
    fetchSkills(query || undefined, 0, true)
  }

  const mapSkills = skills.filter(s => s.providerLat && s.providerLng)

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="page-header">
        <h1>Discover skills</h1>
        <p>Find a peer to teach you something new</p>
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
        <div className="search-bar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input placeholder="Search skills, e.g. Python, Design, Guitar..." value={query} onChange={e => setQuery(e.target.value)} />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </div>
      </form>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div className="chip-bar" style={{ flex: 1, minWidth: 0 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} className={`chip ${category === cat ? 'active' : ''}`}
              onClick={() => { setCategory(cat); setQuery(''); setNearMeMsg('') }}>
              {cat === 'All' ? 'All' : toLabel(cat)}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={handleNearMe}
            disabled={locating}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {locating ? '…' : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Near me
              </>
            )}
          </button>

          <div className="view-toggle">
            <button type="button" className={`view-toggle-btn${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              List
            </button>
            <button type="button" className={`view-toggle-btn${view === 'map' ? ' active' : ''}`} onClick={() => setView('map')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
              </svg>
              Map
            </button>
          </div>

          <select className="form-select" style={{ width: 'auto' }} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="rating">Top rated</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {nearMeMsg && (
        <div style={{ background: 'var(--primary-pale)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: '0.85rem', color: 'var(--positive-deep)' }}>
          {nearMeMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Searching...</div>
      ) : view === 'map' ? (
        <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <MapContainer center={mapCenter} zoom={mapSkills.length ? 11 : 4} style={MAP_STYLE}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapSkills.map(skill => (
              <Marker
                key={skill.skillId}
                position={[skill.providerLat, skill.providerLng]}
                icon={leafletIcon}
              >
                <Popup>
                  <div style={{ minWidth: 160, fontFamily: 'var(--font)' }}>
                    <div style={{ fontWeight: 700, marginBottom: 3 }}>{skill.title}</div>
                    <div style={{ fontSize: '0.82rem', color: '#555', marginBottom: 3 }}>
                      {skill.providerName} · {skill.providerCity}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#777', marginBottom: 8 }}>
                      {skill.providerRating ? `★ ${skill.providerRating.toFixed(1)}` : 'New'} · {toLabel(skill.category)}
                    </div>
                    <button
                      onClick={() => navigate(`/user/${skill.providerUserId}`)}
                      style={{ fontSize: '0.8rem', color: 'var(--positive-deep)', cursor: 'pointer', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', fontFamily: 'inherit', fontWeight: 600 }}
                    >
                      View profile →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          {mapSkills.length === 0 && (
            <div style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg)' }}>
              No providers with location data in this area. Make sure users have saved their city in their profile.
            </div>
          )}
        </div>
      ) : skills.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <h3>No skills found</h3>
          <p>Try: JavaScript, Web Design, Photography...</p>
        </div>
      ) : (
        <>
          <div className="skills-grid">
            {skills.map(skill => <SkillCard key={skill.skillId} skill={skill} />)}
          </div>
          {skills.length < total && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button className="btn btn-outline" onClick={loadMore} disabled={loading}>
                {loading ? 'Loading…' : `Load more (${skills.length} of ${total})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
