import { useState, useEffect } from 'react'
import api from '../api/axios'
import SkillCard from '../components/SkillCard'

const CATEGORIES = ['All', 'PROGRAMMING', 'DESIGN', 'LANGUAGE', 'MUSIC', 'BUSINESS', 'COOKING', 'PHOTOGRAPHY', 'FITNESS']

export default function SearchPage() {
  const [skills, setSkills] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('rating')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchSkills() }, [category])

  const fetchSkills = async (q) => {
    setLoading(true)
    try {
      const params = {}
      if (q) params.query = q
      else if (category !== 'All') params.category = category
      const res = await api.get('/search', { params })
      let data = res.data
      if (sort === 'rating') data.sort((a, b) => (b.providerRating || 0) - (a.providerRating || 0))
      setSkills(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchSkills(query)
  }

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
        <select className="form-select" style={{ width: 'auto' }} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="rating">Sort by Rating</option>
          <option value="newest">Sort by Newest</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Searching...</div>
      ) : skills.length === 0 ? (
        <div className="empty-state">
          <h3>No skills found for this search</h3>
          <p>Try: JavaScript, Web Design, Photography...</p>
        </div>
      ) : (
        <div className="skills-grid">
          {skills.map(skill => <SkillCard key={skill.skillId} skill={skill} />)}
        </div>
      )}
    </div>
  )
}
