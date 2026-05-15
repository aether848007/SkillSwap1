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

  const persistSession = (data) => {
    localStorage.setItem('token', data.accessToken)
    localStorage.setItem('user', JSON.stringify(data))
    setUser({ ...data, needsOnboarding: needsOnboarding(data) })
  }

  /** Returns an OTP challenge: { challengeId, email, intent, expiresInSeconds, resendCooldownSeconds } */
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    return res.data
  }

  /** Returns an OTP challenge. Same shape as login. */
  const register = async (data) => {
    const res = await api.post('/auth/signup', data)
    return res.data
  }

  /** Finalises the challenge with a code. On success, persists session + returns user. */
  const verifyOtp = async (challengeId, code) => {
    const res = await api.post('/auth/verify-otp', { challengeId, code })
    persistSession(res.data)
    return res.data
  }

  /** Requests a fresh OTP for the same challenge. Server enforces a 60s cooldown. */
  const resendOtp = async (challengeId) => {
    const res = await api.post('/auth/resend-otp', { challengeId })
    return res.data
  }

  /** Google OAuth callback — still mints a token directly since Google has already verified. */
  const googleLogin = async (code) => {
    const redirectUri = window.location.origin + '/auth/callback'
    const res = await api.post('/auth/google', { code, redirectUri })
    persistSession(res.data)
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
    <AuthContext.Provider value={{
      user, loading,
      login, register, verifyOtp, resendOtp,
      googleLogin, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
