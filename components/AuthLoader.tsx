'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import SignIn from './SignIn'

interface AuthLoaderProps {
  children: React.ReactNode
}

// Pages that require authentication
const AUTH_REQUIRED_PAGES = ['/upload', '/my-pawpaws']

export default function AuthLoader({ children }: AuthLoaderProps) {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  // Show loading while checking session
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-bold" style={{ color: '#FFB500' }}>
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐾</div>
          <p style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
            Loading your PawPaw experience… 🐕
          </p>
        </div>
      </div>
    )
  }

  // Check if current page requires authentication
  const requiresAuth = AUTH_REQUIRED_PAGES.some(page => pathname?.startsWith(page))

  // Show sign-in form if page requires auth and user is not authenticated
  if (requiresAuth && !user) {
    return <SignIn />
  }

  // Allow access to home page and other public pages without authentication
  return <>{children}</>
}

