'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import NotificationBell from './NotificationBell'

export default function BottomNavigation() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Don't show on certain pages (upload, signin, etc.)
  const hideOnPages = ['/upload', '/signin']
  const shouldHide = hideOnPages.some(page => pathname?.startsWith(page))
  
  if (shouldHide) {
    return null
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname?.startsWith(path)
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-50 sm:hidden"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/') && pathname !== '/my-pawpaws' && pathname !== '/profile'
              ? 'text-[#FFB500]' 
              : 'text-gray-600'
          }`}
          aria-label="Home"
        >
          <svg 
            className="w-6 h-6 mb-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
            />
          </svg>
          <span className="text-xs font-medium">Home</span>
        </Link>

        {/* Upload */}
        <Link
          href="/upload"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/upload')
              ? 'text-[#FFB500]' 
              : 'text-gray-600'
          }`}
          aria-label="Upload encounter"
        >
          <div className="relative">
            <svg 
              className="w-7 h-7 mb-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
          </div>
          <span className="text-xs font-medium">Upload</span>
        </Link>

        {/* My PawPaws */}
        {user ? (
          <Link
            href="/my-pawpaws"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive('/my-pawpaws')
                ? 'text-[#FFB500]' 
                : 'text-gray-600'
            }`}
            aria-label="My PawPaws"
          >
            <svg 
              className="w-6 h-6 mb-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <span className="text-xs font-medium">My PawPaws</span>
          </Link>
        ) : (
          <Link
            href="/signin"
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 transition-colors"
            aria-label="Sign in"
          >
            <svg 
              className="w-6 h-6 mb-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
            <span className="text-xs font-medium">Sign In</span>
          </Link>
        )}

        {/* Profile */}
        {user ? (
          <Link
            href={`/profile/${user.id}`}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive('/profile')
                ? 'text-[#FFB500]' 
                : 'text-gray-600'
            }`}
            aria-label="Profile"
          >
            <svg 
              className="w-6 h-6 mb-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
            <span className="text-xs font-medium">Profile</span>
          </Link>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 h-full text-gray-400">
            <svg 
              className="w-6 h-6 mb-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
            <span className="text-xs">Profile</span>
          </div>
        )}

        {/* Notifications */}
        {user ? (
          <div className="flex flex-col items-center justify-center flex-1 h-full relative">
            <NotificationBell />
            <span className="text-xs font-medium text-gray-600 mt-1">Alerts</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 h-full text-gray-400">
            <svg 
              className="w-6 h-6 mb-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
              />
            </svg>
            <span className="text-xs">Alerts</span>
          </div>
        )}
      </div>
    </nav>
  )
}

