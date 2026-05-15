import { useState, useEffect, useMemo } from 'react'
import api from '../api/axios'
import SkillCard from '../components/SkillCard'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = ['All', 'PROGRAMMING', 'DESIGN', 'LANGUAGE', 'MUSIC', 'BUSINESS', 'COOKING', 'PHOTOGRAPHY', 'FITNESS']

const toLabel = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''

export default function SearchPage() {
  const { user } = useAuth()
  const [skills, setSkills] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('rating')
  const [loading, setLoading] = useState(false)
  const [cityOnly, setCityOnly] = useState(false)
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
      const data = res.data.content ?? res.data
      const tot = res.data.total ?? data.length
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

  const fetchByCity = async (city) => {
    setLoading(true)
    try {
      const res = await api.get('/search/by-city', { params: { city } })
      setSkills(res.data)
      setTotal(res.data.length)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCityOnly(false)
    setPage(0)
    fetchSkills(query || undefined, 0, true)
  }

  const toggleCityFilter = () => {
    if (!user?.city) return
    if (cityOnly) {
      setCityOnly(false)
      setPage(0)
      fetchSkills(query || undefined, 0, true)
    } else {
      setCityOnly(true)
      fetchByCity(user.city)
    }
  }

  const sortedSkills = useMemo(() => {
    const copy = [...skills]
    if (sort === 'rating') {
      copy.sort((a, b) => (b.providerRating || 0) - (a.providerRating || 0))
    } else if (sort === 'newest') {
      copy.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return tb - ta
      })
    }
    return copy
  }, [skills, sort])

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
            <button key={cat} className={`chip ${category === cat && !cityOnly ? 'active' : ''}`}
              onClick={() => { setCategory(cat); setQuery(''); setCityOnly(false) }}>
              {cat === 'All' ? 'All' : toLabel(cat)}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {user?.city && (
            <button
              type="button"
              className={`btn btn-sm ${cityOnly ? 'btn-primary' : 'btn-outline'}`}
              onClick={toggleCityFilter}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {user.city}
            </button>
          )}

          <select className="form-select" style={{ width: 'auto' }} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="rating">Top rated</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Searching...</div>
      ) : skills.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <h3>No skills found</h3>
          <p>{cityOnly ? `No skills offered in ${user?.city} yet.` : 'Try: JavaScript, Web Design, Photography...'}</p>
        </div>
      ) : (
        <>
          <div className="skills-grid">
            {sortedSkills.map(skill => <SkillCard key={skill.skillId} skill={skill} />)}
          </div>
          {!cityOnly && skills.length < total && (
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
