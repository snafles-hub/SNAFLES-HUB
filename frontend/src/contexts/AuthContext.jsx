import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const bootstrap = async () => {
      try {
        await authAPI.ensureCsrfToken()
      } catch (error) {
        console.warn('Failed to prefetch CSRF token', error)
      }

      try {
        const response = await authAPI.getCurrentUser()
        if (isMounted) {
          setUser(response.user)
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.info('No active session detected', error?.message || error)
        }
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    bootstrap()
    return () => { isMounted = false }
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password })
      setUser(response.user)
      
      return { success: true, user: response.user }
    } catch (error) {
      return { success: false, message: error.message || 'Login failed. Please try again.' }
    }
  }

  // Vendor authentication
  const loginVendor = async (email, password) => {
    try {
      const response = await authAPI.vendorLogin({ email, password })
      setUser(response.user)
      return { success: true, user: response.user }
    } catch (error) {
      return { success: false, message: error.message || 'Vendor login failed. Please try again.' }
    }
  }

  const registerVendor = async (vendorData) => {
    try {
      const response = await authAPI.vendorRegister(vendorData)
      setUser(response.user)
      return { success: true, user: response.user }
    } catch (error) {
      return { success: false, message: error.message || 'Vendor registration failed. Please try again.' }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      setUser(response.user)
      
      return { success: true, user: response.user }
    } catch (error) {
      return { success: false, message: error.message || 'Registration failed. Please try again.' }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
      try {
        await authAPI.ensureCsrfToken()
      } catch (_) {
        // ignore
      }
    }
  }

  // Google OAuth removed: only site-based email/password auth

  const updateProfile = async (updatedData) => {
    try {
      const response = await authAPI.updateProfile(updatedData)
      setUser(response.user)
      return { success: true, user: response.user }
    } catch (error) {
      return { success: false, message: error.message || 'Profile update failed' }
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    loginVendor,
    registerVendor
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
