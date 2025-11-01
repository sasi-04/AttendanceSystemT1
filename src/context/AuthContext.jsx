import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const stored = localStorage.getItem('ams_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('ams_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((payload) => {
    setUser(payload)
    localStorage.setItem('ams_user', JSON.stringify(payload))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('ams_user')
    navigate('/login', { replace: true })
  }, [navigate])

  const value = useMemo(() => ({ user, login, logout, isLoading }), [user, login, logout, isLoading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function useRedirectByRole() {
  const navigate = useNavigate()
  return (role) => {
    if (role === 'student') navigate('/student/dashboard', { replace: true })
    else if (role === 'staff') navigate('/staff/dashboard', { replace: true })
    else if (role === 'admin') navigate('/admin/dashboard', { replace: true })
    else navigate('/', { replace: true })
  }
}


















