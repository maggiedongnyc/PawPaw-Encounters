'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment from the URL (Supabase magic links use hash fragments)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const error = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        // Check for error in hash
        if (error) {
          console.error('Auth error:', error, errorDescription)
          router.push(`/signin?error=${encodeURIComponent(errorDescription || error)}`)
          return
        }

        // If we have tokens in the hash, Supabase should have already handled them
        // via detectSessionInUrl, but we'll verify the session
        if (accessToken || refreshToken) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('Error getting session:', sessionError)
            router.push('/signin?error=session_error')
            return
          }

          if (session) {
            // Successfully authenticated, redirect to home
            router.push('/')
            return
          }
        }

        // Check for code in query params (alternative flow)
        const code = searchParams.get('code')
        if (code) {
          // Exchange code for session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('Error exchanging code:', exchangeError)
            router.push('/signin?error=exchange_error')
            return
          }

          if (data.session) {
            router.push('/')
            return
          }
        }

        // If we get here, no valid auth found, redirect to sign in
        router.push('/signin?error=no_auth')
      } catch (err) {
        console.error('Error in auth callback:', err)
        router.push('/signin?error=callback_error')
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-lg font-medium" style={{ color: '#5C3D2E' }}>
          Signing you in...
        </p>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-lg font-medium" style={{ color: '#5C3D2E' }}>
            Loading...
          </p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

