'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Comments from '@/components/Comments'
import LikeButton from '@/components/LikeButton'
import { reverseGeocode } from '@/lib/geocoding'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
})

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

interface Comment {
  id: string
  encounter_id: string
  user_id?: string | null
  comment: string
  created_at: string
}

// Tag emoji mapping
const getTagEmoji = (tag: string, type: 'breed' | 'size' | 'mood'): string => {
  if (type === 'breed') return '🐶'
  if (type === 'size') {
    if (tag.toLowerCase().includes('small')) return '🐕'
    if (tag.toLowerCase().includes('medium')) return '🐕‍🦺'
    if (tag.toLowerCase().includes('large')) return '🦮'
    if (tag.toLowerCase().includes('extra')) return '🐩'
  }
  if (type === 'mood') {
    const moodEmojis: Record<string, string> = {
      happy: '😊',
      playful: '🎾',
      calm: '😌',
      energetic: '⚡',
      sleepy: '😴',
      curious: '🤔',
    }
    return moodEmojis[tag.toLowerCase()] || '🐾'
  }
  return '🐾'
}

const getMoodEmoji = (mood?: string | null): string => {
  if (!mood) return '🐕'
  const moodEmojis: Record<string, string> = {
    happy: '😊',
    playful: '🎾',
    calm: '😌',
    energetic: '⚡',
    sleepy: '😴',
    curious: '🤔',
  }
  return moodEmojis[mood.toLowerCase()] || '🐕'
}

export default function MyPawPawsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [neighborhoodNames, setNeighborhoodNames] = useState<Record<string, string>>({})
  const [commentsByEncounter, setCommentsByEncounter] = useState<Record<string, Comment[]>>({})
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [selectedEncounter, setSelectedEncounter] = useState<string | null>(null)
  const processedEncounterIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return

    fetchMyEncounters()

    // Set up real-time subscription for user's encounters
    const channel = supabase
      .channel('my-encounters-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Encounters',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newEncounter = payload.new as Encounter
          if (processedEncounterIds.current.has(newEncounter.id)) {
            return
          }
          setEncounters((currentEncounters) => {
            const exists = currentEncounters.some(e => e.id === newEncounter.id)
            if (exists) {
              return currentEncounters
            }
            processedEncounterIds.current.add(newEncounter.id)
            return [newEncounter, ...currentEncounters]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Encounters',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setEncounters((currentEncounters) => {
            return currentEncounters.map(e => 
              e.id === payload.new.id ? (payload.new as Encounter) : e
            )
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'Encounters',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setEncounters((currentEncounters) => {
            return currentEncounters.filter(e => e.id !== payload.old.id)
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    if (encounters.length === 0) return

    // Fetch neighborhood names
    const fetchNeighborhoodNames = async () => {
      const names: Record<string, string> = {}
      for (const encounter of encounters) {
        const location = parseLocation(encounter.location)
        if (location && !location.name) {
          const neighborhood = await reverseGeocode(location.lat, location.lng)
          if (neighborhood) {
            names[encounter.id] = neighborhood
          }
        }
      }
      setNeighborhoodNames(names)
    }

    fetchNeighborhoodNames()

    // Fetch comments
    const fetchComments = async () => {
      const encounterIds = encounters.map(e => e.id)
      const { data: commentsData, error: commentsError } = await supabase
        .from('Comments')
        .select('*')
        .in('encounter_id', encounterIds)
        .order('created_at', { ascending: true })

      if (commentsError) {
        console.error('Error fetching comments:', commentsError)
        return
      }

      const commentsByEncounterId: Record<string, Comment[]> = {}
      const counts: Record<string, number> = {}

      commentsData?.forEach((comment: Comment) => {
        const encounterId = comment.encounter_id
        if (!commentsByEncounterId[encounterId]) {
          commentsByEncounterId[encounterId] = []
        }
        commentsByEncounterId[encounterId].push(comment)
        counts[encounterId] = (counts[encounterId] || 0) + 1
      })

      setCommentsByEncounter(commentsByEncounterId)
      setCommentCounts(counts)
    }

    fetchComments()
  }, [encounters])

  const fetchMyEncounters = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data: encountersData, error: encountersError } = await supabase
        .from('Encounters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (encountersError) {
        throw encountersError
      }

      const processedEncounters: Encounter[] = encountersData || []

      // Fetch comments
      if (processedEncounters.length > 0) {
        const encounterIds = processedEncounters.map(e => e.id)
        const { data: commentsData, error: commentsError } = await supabase
          .from('Comments')
          .select('*')
          .in('encounter_id', encounterIds)
          .order('created_at', { ascending: true })

        if (!commentsError && commentsData) {
          const commentsByEncounterId: Record<string, Comment[]> = {}
          const counts: Record<string, number> = {}

          commentsData.forEach((comment: Comment) => {
            const encounterId = comment.encounter_id
            if (!commentsByEncounterId[encounterId]) {
              commentsByEncounterId[encounterId] = []
            }
            commentsByEncounterId[encounterId].push(comment)
            counts[encounterId] = (counts[encounterId] || 0) + 1
          })

          setCommentsByEncounter(commentsByEncounterId)
          setCommentCounts(counts)
        }
      }

      setEncounters(processedEncounters)
      processedEncounters.forEach(encounter => {
        processedEncounterIds.current.add(encounter.id)
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load your encounters')
      console.error('Error fetching encounters:', err)
    } finally {
      setLoading(false)
    }
  }

  const parseLocation = (location: string | LocationData): LocationData | null => {
    if (!location) return null
    if (typeof location === 'string') {
      try {
        return JSON.parse(location) as LocationData
      } catch {
        return null
      }
    }
    return location as LocationData
  }

  const getLocationName = (encounter: Encounter): string => {
    const location = parseLocation(encounter.location)
    if (!location) return 'Location not available'
    
    if (neighborhoodNames[encounter.id]) {
      return neighborhoodNames[encounter.id]
    }
    
    if (location.name && !location.name.startsWith('Lat:')) {
      return location.name
    }
    
    return `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`
  }

  const handleLike = async (encounterId: string, currentLikes: number) => {
    try {
      const { error } = await supabase
        .from('Encounters')
        .update({ likes: currentLikes + 1 })
        .eq('id', encounterId)

      if (error) throw error

      setEncounters(encounters.map(e => 
        e.id === encounterId ? { ...e, likes: e.likes + 1 } : e
      ))
    } catch (err) {
      console.error('Error liking encounter:', err)
    }
  }

  const handleDoubleClickEncounter = (encounter: Encounter) => {
    if (!user || encounter.user_id !== user.id) {
      console.log('Double-click blocked: user not logged in or not owner', { user: !!user, encounterUserId: encounter.user_id, currentUserId: user?.id })
      return
    }
    // Navigate to upload page with edit query param
    console.log('Double-click detected, navigating to edit mode:', encounter.id)
    router.push(`/upload?edit=${encounter.id}`)
  }

  const handleDeleteEncounter = async (encounterId: string) => {
    if (!user) return

    if (!confirm('Are you sure you want to delete this encounter? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('Encounters')
        .delete()
        .eq('id', encounterId)
        .eq('user_id', user.id) // Only allow deleting own encounters

      if (error) throw error

      // Remove from local state
      setEncounters(encounters.filter(e => e.id !== encounterId))
    } catch (err) {
      console.error('Error deleting encounter:', err)
      alert('Failed to delete encounter. You can only delete your own encounters.')
    }
  }

  const fetchCommentsForEncounter = async (encounterId: string) => {
    try {
      const { data, error } = await supabase
        .from('Comments')
        .select('*')
        .eq('encounter_id', encounterId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCommentsByEncounter((prev) => ({
        ...prev,
        [encounterId]: data || []
      }))
      
      setCommentCounts((prev) => ({
        ...prev,
        [encounterId]: data?.length || 0
      }))
    } catch (err) {
      console.error('Error fetching comments:', err)
    }
  }

  const handleEditComment = async (commentId: string, encounterId: string, newText: string) => {
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('Comments')
        .update({ comment: newText.trim() })
        .eq('id', commentId)
        .eq('user_id', user.id)

      if (error) throw error
      
      // Refresh comments
      fetchCommentsForEncounter(encounterId)
    } catch (err) {
      console.error('Error updating comment:', err)
      alert('Failed to update comment. You can only edit your own comments.')
    }
  }

  const handleDeleteComment = async (commentId: string, encounterId: string) => {
    if (!user) return
    
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('Comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id)

      if (error) throw error
      
      // Refresh comments
      fetchCommentsForEncounter(encounterId)
    } catch (err) {
      console.error('Error deleting comment:', err)
      alert('Failed to delete comment. You can only delete your own comments.')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-medium mb-4" style={{ color: '#5C3D2E' }}>
            Please sign in to view your PawPaws
          </p>
          <Link
            href="/"
            className="px-6 py-3 text-base font-medium text-white rounded-lg transition-all"
            style={{
              background: 'linear-gradient(to right, #FFB500, #FFC845)',
            }}
          >
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center relative">
          {/* Top Right Navigation - Back to Home */}
          <div className="absolute top-0 right-0 flex items-center gap-3 flex-wrap mt-4 mr-4 z-20">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ 
                color: '#5C3D2E',
                background: 'linear-gradient(to right, #FFEB99, #FFD166)',
                border: '2px solid #FFC845'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #FFD166, #FFC845)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #FFEB99, #FFD166)'
              }}
            >
              ← Back to Home
            </Link>
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="font-fredoka text-4xl sm:text-5xl md:text-6xl font-bold" style={{ 
              color: '#5C3D2E',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
              fontFamily: 'var(--font-fredoka), sans-serif'
            }}>
              🐾 My PawPaws 🐾
            </h1>
          </div>
          <p className="font-fredoka text-lg sm:text-xl md:text-2xl mb-6 font-medium" style={{
            color: '#5C3D2E',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)',
            fontFamily: 'var(--font-fredoka), sans-serif'
          }}>
            Your dog encounters collection
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/upload"
              className="px-6 py-3 text-sm font-fredoka font-semibold text-white rounded-lg transition-all"
              style={{
                background: 'linear-gradient(to right, #FFB500, #FFC845)',
                boxShadow: '0 10px 25px rgba(255, 181, 0, 0.4)'
              }}
            >
              📸 Upload New
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin text-6xl mb-4">🐕</div>
            <p className="text-[#5C3D2E] font-medium">Loading your PawPaws...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && encounters.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🐕</div>
            <p className="text-[#5C3D2E] mb-4 font-medium text-lg">You haven't uploaded any encounters yet.</p>
            <Link
              href="/upload"
              className="px-8 py-4 text-base font-fredoka font-semibold text-white rounded-full transition-all shadow-xl hover:shadow-2xl transform hover:scale-110"
              style={{
                background: 'linear-gradient(to right, #FFB500, #FFC845)',
                boxShadow: '0 10px 25px rgba(255, 181, 0, 0.4)'
              }}
            >
              📸 Upload Your First PawPaw! 🎉
            </Link>
          </div>
        )}

        {/* Grid of Encounters */}
        {!loading && encounters.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#5C3D2E' }}>
              🖼️ Your Encounters ({encounters.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {encounters.map((encounter) => {
                const location = parseLocation(encounter.location)
                const encounterComments = commentsByEncounter[encounter.id] || []
                const commentCount = commentCounts[encounter.id] || 0
                const firstTwoComments = encounterComments.slice(0, 2)
                
                return (
                  <div
                    key={encounter.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                    onDoubleClick={() => handleDoubleClickEncounter(encounter)}
                  >
                    {/* Image */}
                    <div className="w-full h-64 overflow-hidden bg-gray-200 relative group">
                      <img
                        src={encounter.photo_url}
                        alt={encounter.description}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Mood Emoji Badge */}
                      {encounter.mood && (
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-3 text-3xl shadow-lg">
                          {getMoodEmoji(encounter.mood)}
                        </div>
                      )}
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {/* Delete button for own encounters */}
                      <div className="flex justify-end gap-2 mb-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation() // Prevent double-click from triggering
                            handleDeleteEncounter(encounter.id)
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
                          title="Delete encounter"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Description */}
                      <h3 className="text-lg font-semibold mb-3 line-clamp-2" style={{ color: '#5C3D2E' }}>
                        {encounter.description}
                      </h3>

                      {/* Tags with Emojis */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {encounter.breed && (
                          <span className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 rounded-full flex items-center gap-1">
                            <span>{getTagEmoji(encounter.breed, 'breed')}</span>
                            {encounter.breed}
                          </span>
                        )}
                        {encounter.size && (
                          <span className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full flex items-center gap-1">
                            <span>{getTagEmoji(encounter.size, 'size')}</span>
                            {encounter.size}
                          </span>
                        )}
                        {encounter.mood && (
                          <span className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-full flex items-center gap-1">
                            <span>{getTagEmoji(encounter.mood, 'mood')}</span>
                            {encounter.mood}
                          </span>
                        )}
                        </div>
                      )}

                      {/* Location - Neighborhood Name */}
                      {location && (
                        <div className="flex items-center text-sm mb-4" style={{ color: '#5C3D2E' }}>
                          <span className="text-xl mr-2">📍</span>
                          <span className="truncate font-medium">{getLocationName(encounter)}</span>
                        </div>
                      )}

                      {/* Likes and Comments Count */}
                      <div className="flex items-center justify-between mb-3">
                        <LikeButton
                          likes={encounter.likes}
                          onLike={() => handleLike(encounter.id, encounter.likes)}
                          encounterId={encounter.id}
                        />
                        <button
                          onClick={() => setSelectedEncounter(selectedEncounter === encounter.id ? null : encounter.id)}
                          className="flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer hover:opacity-80"
                          style={{ color: '#5C3D2E' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#FFB500'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#5C3D2E'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>{commentCount > 0 ? `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}` : '0 comments'}</span>
                        </button>
                      </div>

                      {/* First 2 Comments */}
                      {firstTwoComments.length > 0 && (
                        <div className="mb-3 pt-3 border-t border-gray-200">
                          <div className="space-y-2">
                            {firstTwoComments.map((comment) => (
                              <div key={comment.id} className="p-2 bg-gray-50 rounded-md">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium" style={{ color: '#5C3D2E' }}>
                                      {comment.comment}
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: '#5C3D2E', opacity: 0.6 }}>
                                      {formatCommentDate(comment.created_at)}
                                    </p>
                                  </div>
                                  {/* Edit/Delete buttons for own comments */}
                                  {user && comment.user_id && String(comment.user_id) === String(user.id) && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const newText = prompt('Edit comment:', comment.comment)
                                          if (newText && newText.trim() && newText !== comment.comment) {
                                            handleEditComment(comment.id, encounter.id, newText)
                                          }
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-800 underline px-1"
                                        title="Edit comment"
                                      >
                                        Edit
                                      </button>
                                      <span className="text-gray-300">|</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteComment(comment.id, encounter.id)
                                        }}
                                        className="text-xs text-red-600 hover:text-red-800 underline px-1"
                                        title="Delete comment"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Date */}
                      <p className="text-xs mb-2 font-medium" style={{ color: '#5C3D2E', opacity: 0.8 }}>
                        📅 {formatDate(encounter.created_at)}
                      </p>

                      {/* View All Comments Button */}
                      {commentCount > 2 && (
                        <button
                          onClick={() => setSelectedEncounter(selectedEncounter === encounter.id ? null : encounter.id)}
                          className="w-full mt-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border-2"
                          style={{ 
                            color: '#5C3D2E',
                            borderColor: '#FFC845',
                            background: 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(to right, #FFEB99, #FFD166)'
                            e.currentTarget.style.borderColor = '#FFB500'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.borderColor = '#FFC845'
                          }}
                        >
                          View all {commentCount} comments
                        </button>
                      )}

                      {/* Full Comments Section (when expanded) */}
                      {selectedEncounter === encounter.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <Comments encounterId={encounter.id} />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Map View */}
        {!loading && encounters.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#5C3D2E' }}>
              🗺️ Your PawPaws on Map
            </h2>
            <div className="h-[600px] w-full rounded-xl overflow-hidden border-2 border-gray-300 shadow-xl">
              <MapView encounters={encounters} />
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

