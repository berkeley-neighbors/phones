import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const COOKIE_NAME = 'connect.sid'

const getCookie = (name) => {
  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const sessionCookie = getCookie(COOKIE_NAME)
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(atob(sessionCookie))
        const now = Date.now()
        
        // Check if session is still valid
        if (sessionData.expires > now) {
          setIsAuthenticated(true)
        } else {
          // Session expired, clean up
          deleteCookie(COOKIE_NAME)
        }
      } catch (error) {
        console.error('Invalid session cookie:', error)
        deleteCookie(COOKIE_NAME)
      }
    }
    setLoading(false)
  }, [])

  const login = async (token) => {
    const expectedToken = import.meta.env.VITE_GET_PAST_HERE
    
    if (!expectedToken) {
      throw new Error('Authentication token not configured')
    }
    
    if (token !== expectedToken) {
      throw new Error('Invalid authentication token')
    }
    
    // Create session data
    const sessionData = {
      authenticated: true,
      expires: Date.now() + SESSION_DURATION,
      token: token
    }
    
    // Store in cookie (base64 encoded)
    const encodedSession = btoa(JSON.stringify(sessionData))
    setCookie(COOKIE_NAME, encodedSession, 1)
    
    setIsAuthenticated(true)
    return true
  }

  const logout = () => {
    deleteCookie(COOKIE_NAME)
    setIsAuthenticated(false)
  }

  const value = {
    isAuthenticated,
    loading,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}