import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import SkillCard from '../components/SkillCard'

const CATEGORIES = ['All', 'PROGRAMMING', 'DESIGN', 'LANGUAGE', 'MUSIC', 'BUSINESS', 'COOKING', 'PHOTOGRAPHY', 'FITNESS']

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSkills()
  }, [category])

  const fetchSkills = async (query) => {
    setLoading(true)
    try {
      const params = {}
      if (query) params.query = query
      else if (category !== 'All') params.category = category
      const res = await api.get('/search', { params })
      setSkills(res.data.content ?? res.data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      fetchSkills(search)
    } else {
      fetchSkills()
    }
  }

  return (
    <div>
      <div className="hero">
        <h1>Exchange Skills, Not Money</h1>
        <p>Find peers with skills you want to learn, and offer your expertise in return. No fees, no subscriptions — just knowledge sharing.</p>
        <form onSubmit={handleSearch}>
          <div className="search-bar" style={{ margin: '0 auto' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              placeholder="Find a skill to learn..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </div>
        </form>
      </div>

      <div className="container">
        <div className="chip-bar" style={{ marginBottom: 24, justifyContent: 'center' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`chip ${category === cat ? 'active' : ''}`}
              onClick={() => { setCategory(cat); setSearch('') }}
            >
              {cat === 'All' ? 'All Skills' : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading skills...</div>
        ) : skills.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <h3>No skills found</h3>
            <p>Try a different search term or category</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {skills.length} skill{skills.length !== 1 ? 's' : ''} available
            </div>
            <div className="skills-grid">
              {skills.map(skill => (
                <SkillCard key={skill.skillId} skill={skill} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
