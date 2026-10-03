import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore the session on page load.
  useEffect(() => {
    let mounted = true
    if (!getToken()) {
      setLoading(false)
      return undefined
    }
    api.me()
      .then(({ user: current }) => {
        if (mounted) setUser(current)
      })
      .catch(() => {
        setToken(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const login = useCallback(async (email, password) => {
    const { token, user: current } = await api.login({ email, password })
    setToken(token)
    setUser(current)
    return current
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { token, user: current } = await api.register({ name, email, password })
    setToken(token)
    setUser(current)
    return current
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      // ignore — clear locally regardless
    }
    setToken(null)
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (name) => {
    const { user: current } = await api.updateProfile({ name })
    setUser(current)
    return current
  }, [])

  return <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}