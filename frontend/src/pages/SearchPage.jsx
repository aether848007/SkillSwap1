import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from '@react-google-maps/api'
import api from '../api/axios'
import SkillCard from '../components/SkillCard'

const CATEGORIES = ['All', 'PROGRAMMING', 'DESIGN', 'LANGUAGE', 'MUSIC', 'BUSINESS', 'COOKING', 'PHOTOGRAPHY', 'FITNESS']
const MAP_LIBS = ['places']
const MAP_STYLE = { width: '100%', height: '520px' }
const DEFAULT_CENTER = { lat: 51.505, lng: -0.09 }

const toLabel = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''

export default function SearchPage() {
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('rating')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
  const [locating, setLocating] = useState(false)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 20

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: MAP_LIBS,
  })

  useEffect(() => { setPage(0); fetchSkills(undefined, 0, true) }, [category])

  const fetchSkills = async (q, p = 0, reset = false) => {
    setLoading(true)
    try {
      const params = { page: p, size: PAGE_SIZE }
      if (q) params.query = q
      else if (category !== 'All') params.category = category
      const res = await api.get('/search', { params })
      let data = res.data.content ?? res.data
      const tot  = res.data.total ?? data.length
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
      const params = { lat, lng, radiusKm: 25 }
      if (query) params.query = query
      const res = await api.get('/search/nearby', { params })
      setSkills(res.data)
      setMapCenter({ lat, lng })
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleNearMe = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false)
        fetchNearby(coords.latitude, coords.longitude)
      },
      () => setLocating(false)
    )
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
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
              onClick={() => { setCategory(cat); setQuery('') }}>
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Searching...</div>
      ) : view === 'map' ? (
        isLoaded ? (
          <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <GoogleMap mapContainerStyle={MAP_STYLE} center={mapCenter} zoom={mapSkills.length ? 10 : 4}>
              {mapSkills.map(skill => (
                <Marker
                  key={skill.skillId}
                  position={{ lat: skill.providerLat, lng: skill.providerLng }}
                  onClick={() => setSelected(skill)}
                  title={skill.title}
                />
              ))}
              {selected && (
                <InfoWindow
                  position={{ lat: selected.providerLat, lng: selected.providerLng }}
                  onCloseClick={() => setSelected(null)}
                >
                  <div style={{ maxWidth: 200, fontFamily: 'var(--font)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{selected.title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                      {selected.providerName} · {selected.providerCity}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                      {selected.providerRating ? `★ ${selected.providerRating.toFixed(1)}` : 'New'} · {toLabel(selected.category)}
                    </div>
                    <button
                      onClick={() => navigate(`/user/${selected.providerUserId}`)}
                      style={{ fontSize: '0.78rem', color: 'var(--primary)', cursor: 'pointer', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', fontFamily: 'inherit' }}
                    >
                      View profile →
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
            {mapSkills.length === 0 && (
              <div style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg)' }}>
                No providers with location data. Providers must set their city in their profile to appear on the map.
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            Loading map... Make sure VITE_GOOGLE_MAPS_API_KEY is set in your .env file.
          </div>
        )
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
