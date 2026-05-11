import { useState, useEffect, useCallback, useRef } from 'react'
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
        <h1>Discover Skills</h1>
        <p>Search from {skills.length} available skills across all categories</p>
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
        <div className="search-bar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search skills, e.g. Python, Design, Guitar..." value={query} onChange={e => setQuery(e.target.value)} />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </div>
      </form>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div className="chip-bar">
          {CATEGORIES.map(cat => (
            <button key={cat} className={`chip ${category === cat ? 'active' : ''}`}
              onClick={() => { setCategory(cat); setQuery('') }}>
              {cat === 'All' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onClick={handleNearMe}
            disabled={locating}
          >
            {locating ? '…' : '📍 Near me'}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${view === 'list' ? 'btn-primary' : ''}`}
            style={view !== 'list' ? { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' } : {}}
            onClick={() => setView('list')}
          >
            ☰ List
          </button>
          <button
            type="button"
            className={`btn btn-sm ${view === 'map' ? 'btn-primary' : ''}`}
            style={view !== 'map' ? { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' } : {}}
            onClick={() => setView('map')}
          >
            🗺 Map
          </button>
          <select className="form-select" style={{ width: 'auto' }} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="rating">Sort by Rating</option>
            <option value="newest">Sort by Newest</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Searching...</div>
      ) : view === 'map' ? (
        isLoaded ? (
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <GoogleMap
              mapContainerStyle={MAP_STYLE}
              center={mapCenter}
              zoom={mapSkills.length ? 10 : 4}
            >
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
                  <div style={{ maxWidth: 200 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{selected.title}</div>
                    <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>
                      {selected.providerName} · {selected.providerCity}
                    </div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                      ★ {selected.providerRating?.toFixed(1) || '—'} · {selected.category}
                    </div>
                    <button
                      onClick={() => navigate(`/user/${selected.providerUserId}`)}
                      style={{ fontSize: 12, color: '#1F4E79', cursor: 'pointer', background: 'none', border: 'none', padding: 0, textDecoration: 'underline' }}
                    >
                      View profile →
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
            {mapSkills.length === 0 && (
              <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg)' }}>
                No providers with location data found. Providers must set their location in their profile to appear on the map.
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            Loading map… Make sure VITE_GOOGLE_MAPS_API_KEY is set in your .env file.
          </div>
        )
      ) : skills.length === 0 ? (
        <div className="empty-state">
          <h3>No skills found for this search</h3>
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
                {loading ? 'Loading…' : `Load more (${skills.length} / ${total})`}
              </button>
            </div>
          )}
          {skills.length === 0 && (
            <div className="empty-state">
              <h3>No skills found for this search</h3>
              <p>Try: JavaScript, Web Design, Photography...</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
