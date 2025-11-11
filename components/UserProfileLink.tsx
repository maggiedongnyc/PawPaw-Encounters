'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getUserProfile, getDisplayName, getAvatarUrl } from '@/lib/profiles'

interface UserProfileLinkProps {
  userId: string | null | undefined
  showAvatar?: boolean
  className?: string
}

export default function UserProfileLink({ userId, showAvatar = false, className = '' }: UserProfileLinkProps) {
  const [displayName, setDisplayName] = useState<string>('User')
  const [avatarUrl, setAvatarUrl] = useState<string>('🐕')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setDisplayName('Anonymous')
      setLoading(false)
      return
    }

    const loadProfile = async () => {
      try {
        const profile = await getUserProfile(userId)
        if (profile) {
          setDisplayName(getDisplayName(profile, userId))
          setAvatarUrl(getAvatarUrl(profile))
        } else {
          setDisplayName(`User ${userId.slice(0, 8)}`)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        setDisplayName(`User ${userId.slice(0, 8)}`)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [userId])

  if (!userId) {
    return <span className={className}>Anonymous</span>
  }

  if (loading) {
    return <span className={className}>Loading...</span>
  }

  return (
    <Link
      href={`/profile/${userId}`}
      className={`hover:underline transition-colors ${className}`}
      style={{ color: '#5C3D2E' }}
      onMouseEnter={(e) => e.currentTarget.style.color = '#FFB500'}
      onMouseLeave={(e) => e.currentTarget.style.color = '#5C3D2E'}
    >
      {showAvatar && (
        <span className="inline-block mr-1 text-sm">{avatarUrl}</span>
      )}
      {displayName}
    </Link>
  )
}

