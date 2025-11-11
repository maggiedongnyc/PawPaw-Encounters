'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Comments from '@/components/Comments'
import LikeButton from '@/components/LikeButton'
import UserDisplayName from '@/components/UserDisplayName'
import { reverseGeocode } from '@/lib/geocoding'
import toast from 'react-hot-toast'

interface LocationData {
  lat: number
  lng: number
  name?: string
}

interface Encounter {
  id: string
  photo_url: string
  description: string
  location: string | LocationData
  breed?: string | null
  size?: string | null
  mood?: string | null
  likes: number
  created_at: string
  user_id?: string | null
}

export default function EncounterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const encounterId = params.id as string

  const [encounter, setEncounter] = useState<Encounter | null>(null)
  const [loading, setLoading] = useState(true)
  const [neighborhoodName, setNeighborhoodName] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [commentsExpanded, setCommentsExpanded] = useState(false)
  const [commentCount, setCommentCount] = useState(0)

  useEffect(() => {
    if (encounterId) {
      loadEncounter()
      fetchCommentCount()
    }
  }, [encounterId])

  const fetchCommentCount = async () => {
    try {
      const { count, error } = await supabase
        .from('Comments')
        .select('*', { count: 'exact', head: true })
        .eq('encounter_id', encounterId)

      if (error) throw error
      setCommentCount(count || 0)
    } catch (error) {
      console.error('Error fetching comment count:', error)
    }
  }

  const loadEncounter = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('Encounters')
        .select('*')
        .eq('id', encounterId)
        .single()

      if (error) throw error
      if (!data) {
        toast.error('Encounter not found')
        router.push('/')
        return
      }

      setEncounter(data)

      // Get neighborhood name
      const location = parseLocation(data.location)
      if (location && !location.name) {
        try {
          const name = await reverseGeocode(location.lat, location.lng)
          if (name) {
            setNeighborhoodName(name)
          }
        } catch (err) {
          console.error('Error getting neighborhood:', err)
        }
      } else if (location?.name) {
        setNeighborhoodName(location.name)
      }
    } catch (error) {
      console.error('Error loading encounter:', error)
      toast.error('Failed to load encounter')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const parseLocation = (location: string | LocationData): LocationData | null => {
    if (!location) return null
    if (typeof location === 'string') {
      try {
        return JSON.parse(location)
      } catch {
        return null
      }
    }
    return location
  }

  const getLocationName = (): string => {
    if (!encounter) return 'Location not available'
    const location = parseLocation(encounter.location)
    if (!location) return 'Location not available'
    return neighborhoodName || location.name || `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`
  }

  const handleLike = async (newLikesCount: number) => {
    if (!encounter || !user) {
      return
    }

    try {
      setEncounter({ ...encounter, likes: newLikesCount })

      // Check if this is a like (not unlike) by comparing counts
      if (newLikesCount > encounter.likes) {
        // This is a like (count increased), create notification
        if (encounter.user_id && encounter.user_id !== user.id) {
          const { createNotification } = await import('@/lib/notifications')
          await createNotification(encounter.user_id, 'like', {
            encounterId: encounter.id,
            fromUserId: user.id,
          })
        }
      }
    } catch (error) {
      console.error('Error updating like:', error)
    }
  }

  const handleDelete = async () => {
    if (!encounter || !user || encounter.user_id !== user.id) return

    if (!confirm('Are you sure you want to delete this encounter? This action cannot be undone.')) {
      return
    }

    try {
      setIsDeleting(true)
      const { error } = await supabase
        .from('Encounters')
        .delete()
        .eq('id', encounter.id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Encounter deleted')
      router.push('/')
    } catch (error) {
      console.error('Error deleting encounter:', error)
      toast.error('Failed to delete encounter')
      setIsDeleting(false)
    }
  }

  const getTagEmoji = (value: string, type: 'breed' | 'size' | 'mood'): string => {
    if (type === 'breed') return '🐶'
    if (type === 'size') {
      const sizeEmojis: Record<string, string> = {
        small: '🐕',
        medium: '🐕‍🦺',
        large: '🦮',
        'extra-large': '🐩'
      }
      return sizeEmojis[value.toLowerCase()] || '🐕'
    }
    if (type === 'mood') {
      const moodEmojis: Record<string, string> = {
        happy: '😊',
        playful: '🎾',
        calm: '😌',
        energetic: '⚡',
        sleepy: '😴',
        curious: '🤔'
      }
      return moodEmojis[value.toLowerCase()] || '🐕'
    }
    return '🐕'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  }

  const isOwnEncounter = user && encounter && encounter.user_id === user.id

  if (loading) {
    return (
      <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin text-4xl mb-4">🐕</div>
            <p className="text-gray-600">Loading encounter...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!encounter) {
    return (
      <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🐕</div>
            <p className="text-gray-600 mb-4">Encounter not found</p>
            <Link
              href="/"
              className="text-yellow-500 hover:text-yellow-600 underline"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Encounter Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Image */}
          <div className="w-full h-96 overflow-hidden bg-gray-200 relative">
            <img
              src={encounter.photo_url}
              alt={encounter.description}
              className="w-full h-full object-cover"
            />
            {/* Mood Badge */}
            {encounter.mood && (
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-3 text-3xl shadow-lg">
                {getTagEmoji(encounter.mood, 'mood')}
              </div>
            )}
            {/* Edit/Delete buttons for own encounters */}
            {isOwnEncounter && (
              <div className="absolute top-4 left-4 flex gap-2">
                <Link
                  href={`/upload?edit=${encounter.id}`}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold shadow-lg"
                >
                  ✏️ Edit
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold shadow-lg disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : '🗑️ Delete'}
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Description */}
            <h1 className="text-3xl font-bold mb-4" style={{ color: '#5C3D2E' }}>
              {encounter.description}
            </h1>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {encounter.breed && (
                <span className="px-3 py-1.5 text-sm font-semibold bg-yellow-100 text-yellow-900 rounded-full flex items-center gap-1">
                  <span>{getTagEmoji(encounter.breed, 'breed')}</span>
                  {encounter.breed}
                </span>
              )}
              {encounter.size && (
                <span className="px-3 py-1.5 text-sm font-semibold bg-blue-100 text-blue-900 rounded-full flex items-center gap-1">
                  <span>{getTagEmoji(encounter.size, 'size')}</span>
                  {encounter.size}
                </span>
              )}
              {encounter.mood && (
                <span className="px-3 py-1.5 text-sm font-semibold bg-green-100 text-green-900 rounded-full flex items-center gap-1">
                  <span>{getTagEmoji(encounter.mood, 'mood')}</span>
                  {encounter.mood}
                </span>
              )}
            </div>

            {/* Posted By - More prominent on mobile */}
            {encounter.user_id && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: '#5C3D2E', opacity: 0.7 }}>Posted by</span>
                  <UserDisplayName 
                    userId={encounter.user_id} 
                    showAvatar={true}
                    className="text-base sm:text-sm font-semibold px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                    linkToProfile={true}
                  />
                </div>
                {/* Mobile: Add a "View Profile" button for clarity */}
                <Link
                  href={`/profile/${encounter.user_id}`}
                  className="sm:hidden px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Profile →
                </Link>
              </div>
            )}

            {/* Location */}
            <div className="flex items-center text-sm mb-4" style={{ color: '#5C3D2E' }}>
              <span className="text-xl mr-2">📍</span>
              <span className="font-semibold">{getLocationName()}</span>
            </div>

            {/* Date */}
            <p className="text-sm mb-6" style={{ color: '#5C3D2E', opacity: 0.7 }}>
              📅 {formatDate(encounter.created_at)}
            </p>

            {/* Likes and Comments */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <LikeButton
                likes={encounter.likes}
                onLike={handleLike}
                encounterId={encounter.id}
              />
              <button
                onClick={() => setCommentsExpanded(!commentsExpanded)}
                className="flex items-center gap-1 text-sm hover:opacity-80 transition-opacity cursor-pointer"
                style={{ color: '#5C3D2E' }}
              >
                <span>💬</span>
                <span>{commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}</span>
              </button>
            </div>

            {/* Comments Section */}
            <Comments 
              encounterId={encounter.id} 
              isExpanded={commentsExpanded}
              onCommentAdded={fetchCommentCount}
            />
          </div>
        </div>
      </div>
    </main>
  )
}

