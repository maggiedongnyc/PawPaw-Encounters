'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | undefined

    // Set a timeout to ensure loading completes even if Supabase hangs
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization timeout - proceeding without auth')
        setLoading(false)
      }
    }, 5000) // 5 second timeout

    // Check for existing session and auto-sign-in if logged in within 24 hours
    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error getting session:', sessionError)
        }

        if (mounted) {
          if (timeoutId) clearTimeout(timeoutId)
          
          // Check if session exists and user logged in within 24 hours
          if (session?.user) {
            const lastSignIn = session.user.last_sign_in_at
            if (lastSignIn) {
              const lastSignInTime = new Date(lastSignIn).getTime()
              const now = Date.now()
              const hoursSinceLastSignIn = (now - lastSignInTime) / (1000 * 60 * 60)
              
              // If logged in within 24 hours, automatically sign in
              if (hoursSinceLastSignIn < 24) {
                console.log('User logged in within 24 hours, auto-signing in')
                setUser(session.user)
              } else {
                // Session expired, sign out
                console.log('Session expired (more than 24 hours), signing out')
                await supabase.auth.signOut()
                setUser(null)
              }
            } else {
              // No last_sign_in_at, use session anyway
              setUser(session.user)
            }
          }
          setLoading(false)
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
        if (mounted) {
          if (timeoutId) clearTimeout(timeoutId)
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (mounted) {
          if (timeoutId) clearTimeout(timeoutId)
          
          if (session?.user) {
            // Check if user logged in within 24 hours
            const lastSignIn = session.user.last_sign_in_at
            if (lastSignIn) {
              const lastSignInTime = new Date(lastSignIn).getTime()
              const now = Date.now()
              const hoursSinceLastSignIn = (now - lastSignInTime) / (1000 * 60 * 60)
              
              // If logged in within 24 hours, automatically sign in
              if (hoursSinceLastSignIn < 24) {
                console.log('User logged in within 24 hours, auto-signing in')
                setUser(session.user)
              } else {
                // Session expired, sign out
                console.log('Session expired (more than 24 hours), signing out')
                await supabase.auth.signOut()
                setUser(null)
              }
            } else {
              // No last_sign_in_at, use session anyway
              setUser(session.user)
            }
          } else {
            setUser(null)
          }
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}