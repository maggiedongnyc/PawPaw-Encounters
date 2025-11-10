'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import SignIn from '@/components/SignIn'

export default function SignInPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is already signed in, redirect to home
    if (user) {
      router.push('/')
    }
  }, [user, router])

  // If user is signed in, don't show sign-in form (will redirect)
  if (user) {
    return null
  }

  return <SignIn />
}

