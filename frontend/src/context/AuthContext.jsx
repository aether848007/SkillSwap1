import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  const needsOnboarding = (userData) => {
    const skipped = localStorage.getItem('onboardingSkipped')
    return !skipped && (!userData.skills || userData.skills.length === 0)
  }

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.accessToken)
    localStorage.setItem('user', JSON.stringify(res.data))
    setUser({ ...res.data, needsOnboarding: needsOnboarding(res.data) })
    return res.data
  }

  const register = async (data) => {
    const res = await api.post('/auth/register', data)
    localStorage.setItem('token', res.data.accessToken)
    localStorage.setItem('user', JSON.stringify(res.data))
    setUser({ ...res.data, needsOnboarding: needsOnboarding(res.data) })
    return res.data
  }

  const googleLogin = async (code) => {
    const redirectUri = window.location.origin + '/auth/callback'
    const res = await api.post('/auth/google', { code, redirectUri })
    localStorage.setItem('token', res.data.accessToken)
    localStorage.setItem('user', JSON.stringify(res.data))
    setUser({ ...res.data, needsOnboarding: needsOnboarding(res.data) })
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateUser = (partial) => {
    setUser(prev => {
      const updated = { ...prev, ...partial }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
