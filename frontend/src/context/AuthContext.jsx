import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext()
const AUTH_EVENT = 'ydiFyedk-auth-change'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const syncUser = () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      api.get('/auth/me/')
        .then((res) => {
          if (mounted) setUser(res.data)
        })
        .catch(() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          if (mounted) setUser(null)
        })
        .finally(() => {
          if (mounted) setLoading(false)
        })
    }

    syncUser()
    window.addEventListener('storage', syncUser)
    window.addEventListener(AUTH_EVENT, syncUser)

    return () => {
      mounted = false
      window.removeEventListener('storage', syncUser)
      window.removeEventListener(AUTH_EVENT, syncUser)
    }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login/', { email, password })
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    const me = await api.get('/auth/me/')
    setUser(me.data)
    window.dispatchEvent(new Event(AUTH_EVENT))
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    window.dispatchEvent(new Event(AUTH_EVENT))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
