import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface User {
  id: number
  username: string
  email: string
  role: 'mr' | 'manager' | 'admin'
  name: string
  territory: string
  user_id: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  getAuthHeaders: () => Record<string, string>
}

const AuthContext = createContext<AuthContextType | null>(null)

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('zenapp_token')
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(true)

  // Validate token on mount
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Invalid token')
          return res.json()
        })
        .then(data => {
          setUser(data.user)
          // Sync legacy localStorage fields for backward compat
          localStorage.setItem('userName', data.user.name)
          localStorage.setItem('userEmail', data.user.email || '')
          localStorage.setItem('userId', data.user.user_id)
          localStorage.setItem('userRole', data.user.role)
        })
        .catch(() => {
          setToken(null)
          setUser(null)
          localStorage.removeItem('zenapp_token')
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [token])

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' }
      }

      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('zenapp_token', data.token)
      localStorage.setItem('userName', data.user.name)
      localStorage.setItem('userEmail', data.user.email || '')
      localStorage.setItem('userId', data.user.user_id)
      localStorage.setItem('userRole', data.user.role)
      localStorage.setItem('isAuthenticated', 'true')

      return { success: true }
    } catch {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('zenapp_token')
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
  }

  const getAuthHeaders = (): Record<string, string> => {
    if (!token) return {}
    return { 'Authorization': `Bearer ${token}` }
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      login,
      logout,
      getAuthHeaders
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
