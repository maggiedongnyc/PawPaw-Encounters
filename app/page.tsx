'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Comments from '@/components/Comments'
import LikeButton from '@/components/LikeButton'
import Hero from '@/components/Hero'
import SearchBar from '@/components/SearchBar'
import UserDisplayName from '@/components/UserDisplayName'
import UserProfileLink from '@/components/UserProfileLink'
import NotificationBell from '@/components/NotificationBell'
import BottomNavigation from '@/components/BottomNavigation'
import { reverseGeocode } from '@/lib/geocoding'
import toast from 'react-hot-toast'

const Leaderboard = dynamic(() => import('@/components/Leaderboard'), {
  ssr: false,
})

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

export default function Home() {
  // Get authenticated user (auth is already initialized by AuthProvider)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [filteredEncounters, setFilteredEncounters] = useState<Encounter[]>([])
  const [searchResults, setSearchResults] = useState<Encounter[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [neighborhoodNames, setNeighborhoodNames] = useState<Record<string, string>>({})
  const [showLeaderboard, setShowLeaderboard] = useState(true)
  const [commentsByEncounter, setCommentsByEncounter] = useState<Record<string, Comment[]>>({})
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [selectedEncounter, setSelectedEncounter] = useState<string | null>(null)
  // Track processed encounter IDs to prevent duplicates
  const processedEncounterIds = useRef<Set<string>>(new Set())
  
  // Filters
  const [selectedBreed, setSelectedBreed] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedMood, setSelectedMood] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [locationRadius, setLocationRadius] = useState<number>(0)
  const [userLocation, setUserLocation] = useState<LocationData | null>(null)

  // Close search modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSearchModal) {
        setShowSearchModal(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showSearchModal])

  useEffect(() => {
    fetchEncounters()
    getUserLocation()

    // Set up real-time subscription for all encounters
    // Use unique channel name to prevent conflicts
    const channelName = `encounters-changes-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Encounters',
        },
        (payload) => {
          // Only add if it doesn't already exist (prevent duplicates)
          const newEncounter = payload.new as Encounter
          if (processedEncounterIds.current.has(newEncounter.id)) {
            return
          }
          
          setEncounters((currentEncounters) => {
            // Check if already in state
            const exists = currentEncounters.some(e => e.id === newEncounter.id)
            if (exists) {
              return currentEncounters
            }
            
            // Mark as processed
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
        },
        (payload) => {
          // Update existing encounter (e.g., likes count)
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
        },
        (payload) => {
          // Remove deleted encounter
          setEncounters((currentEncounters) => {
            return currentEncounters.filter(e => e.id !== payload.old.id)
          })
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe().then(() => {
        supabase.removeChannel(channel)
      }).catch((err) => {
        console.warn('Error unsubscribing from encounters channel:', err)
        supabase.removeChannel(channel)
      })
    }
  }, [])

  useEffect(() => {
    // Only apply filters if not searching
    if (searchQuery !== 'searching') {
      applyFilters()
    }
  }, [encounters, selectedBreed, selectedSize, selectedMood, dateFilter, locationRadius, userLocation, searchQuery])

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

    if (encounters.length > 0) {
      fetchNeighborhoodNames()
    }
  }, [encounters])

  // Set up real-time subscription for comments (separate from fetchEncounters)
  useEffect(() => {
    // Set up real-time subscription for comments
    // Use unique channel name to prevent conflicts
    const commentsChannelName = `comments-changes-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const commentsChannel = supabase
      .channel(commentsChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Comments',
        },
        (payload) => {
          const newComment = payload.new as Comment
          setCommentsByEncounter((current) => {
            const updated = { ...current }
            if (!updated[newComment.encounter_id]) {
              updated[newComment.encounter_id] = []
            }
            updated[newComment.encounter_id] = [...updated[newComment.encounter_id], newComment]
            return updated
          })
          setCommentCounts((current) => {
            const updated = { ...current }
            updated[newComment.encounter_id] = (updated[newComment.encounter_id] || 0) + 1
            return updated
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'Comments',
        },
        (payload) => {
          const deletedComment = payload.old as Comment
          setCommentsByEncounter((current) => {
            const updated = { ...current }
            if (updated[deletedComment.encounter_id]) {
              updated[deletedComment.encounter_id] = updated[deletedComment.encounter_id].filter(
                c => c.id !== deletedComment.id
              )
            }
            return updated
          })
          setCommentCounts((current) => {
            const updated = { ...current }
            if (updated[deletedComment.encounter_id]) {
              updated[deletedComment.encounter_id] = Math.max(0, (updated[deletedComment.encounter_id] || 0) - 1)
            }
            return updated
          })
        }
      )
      .subscribe()

    return () => {
      commentsChannel.unsubscribe().then(() => {
        supabase.removeChannel(commentsChannel)
      }).catch((err) => {
        console.warn('Error unsubscribing from comments channel:', err)
        supabase.removeChannel(commentsChannel)
      })
    }
  }, [])

  const getUserLocation = async () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          // Only log errors that aren't user denials (which are expected)
          // PERMISSION_DENIED = 1, POSITION_UNAVAILABLE = 2, TIMEOUT = 3
          if (error.code !== 1) {
            console.warn('Geolocation error:', error.message || 'Unable to get location')
          }
          // Silently handle permission denied - this is expected behavior
        },
        {
          timeout: 10000,
          enableHighAccuracy: false,
        }
      )
    }
  }

  const fetchEncounters = async () => {
    try {
      setLoading(true)
      const { data: encountersData, error: encountersError } = await supabase
        .from('Encounters')
        .select('*')
        .order('created_at', { ascending: false })

      if (encountersError) {
        throw encountersError
      }

      const processedEncounters: Encounter[] = encountersData || []
      
      // Mark all as processed
      processedEncounters.forEach(encounter => {
        processedEncounterIds.current.add(encounter.id)
      })

      setEncounters(processedEncounters)

      // Fetch all comments for these encounters
      if (processedEncounters.length > 0) {
        const encounterIds = processedEncounters.map(e => e.id)
        const { data: commentsData, error: commentsError } = await supabase
          .from('Comments')
          .select('*')
          .in('encounter_id', encounterIds)
          .order('created_at', { ascending: true })

        if (commentsError) {
          console.error('Error fetching comments:', commentsError)
        } else {
          // Group comments by encounter_id
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

          // Update comments state
          setCommentsByEncounter(commentsByEncounterId)
          setCommentCounts(counts)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load encounters')
      console.error('Error fetching encounters:', err)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...encounters]

    // Filter by breed
    if (selectedBreed) {
      filtered = filtered.filter(e => 
        e.breed && e.breed.toLowerCase().includes(selectedBreed.toLowerCase())
      )
    }

    // Filter by size
    if (selectedSize) {
      filtered = filtered.filter(e => 
        e.size && e.size.toLowerCase() === selectedSize.toLowerCase()
      )
    }

    // Filter by mood
    if (selectedMood) {
      filtered = filtered.filter(e => 
        e.mood && e.mood.toLowerCase() === selectedMood.toLowerCase()
      )
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(e => {
        const created = new Date(e.created_at)
        const diffMs = now.getTime() - created.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        
        switch (dateFilter) {
          case 'today':
            return diffDays === 0
          case 'week':
            return diffDays <= 7
          case 'month':
            return diffDays <= 30
          default:
            return true
        }
      })
    }

    // Filter by location radius
    if (locationRadius > 0 && userLocation) {
      filtered = filtered.filter(e => {
        const location = parseLocation(e.location)
        if (!location) return false
        
        const distance = getDistance(userLocation, location)
        return distance <= locationRadius
      })
    }

    setFilteredEncounters(filtered)
  }

  const getDistance = (loc1: LocationData, loc2: LocationData): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
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
    
    // Fallback to coordinates if no neighborhood name available yet
    return `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`
  }

  const handleLike = async (encounterId: string, newLikesCount: number) => {
    if (!user) {
      return
    }

    try {
      // Update local state
      setEncounters(encounters.map(e => 
        e.id === encounterId ? { ...e, likes: newLikesCount } : e
      ))
      setFilteredEncounters(filteredEncounters.map(e => 
        e.id === encounterId ? { ...e, likes: newLikesCount } : e
      ))

      // Get encounter to find owner and check if this is a like (not unlike)
      const { data: encounter } = await supabase
        .from('Encounters')
        .select('user_id, likes')
        .eq('id', encounterId)
        .single()

      if (encounter && newLikesCount > encounter.likes) {
        // This is a like (count increased), create notification
        if (encounter.user_id && encounter.user_id !== user.id) {
          const { createNotification } = await import('@/lib/notifications')
          await createNotification(encounter.user_id, 'like', {
            encounterId: encounterId,
            fromUserId: user.id,
          })
        }
      }
    } catch (err) {
      console.error('Error updating like:', err)
    }
  }

  const handleDoubleClickEncounter = (encounter: Encounter) => {
    if (!user || encounter.user_id !== user.id) {
      return
    }
    // Navigate to upload page with edit query param
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
      setFilteredEncounters(filteredEncounters.filter(e => e.id !== encounterId))
      toast.success('Encounter deleted successfully! 🗑️')
    } catch (err) {
      console.error('Error deleting encounter:', err)
      toast.error('Failed to delete encounter. You can only delete your own encounters.')
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
      toast.success('Comment updated! ✏️', { duration: 2000 })
    } catch (err) {
      console.error('Error updating comment:', err)
      toast.error('Failed to update comment. You can only edit your own comments.')
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
      toast.success('Comment deleted! 🗑️', { duration: 2000 })
    } catch (err) {
      console.error('Error deleting comment:', err)
      toast.error('Failed to delete comment. You can only delete your own comments.')
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
    // Use a fixed "now" time to avoid hydration mismatches
    // This will be slightly inaccurate but prevents hydration errors
    const now = typeof window !== 'undefined' ? new Date() : date
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    // For server-side, just return the date without relative time
    if (typeof window === 'undefined') {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Get unique breeds, sizes, and moods for filters
  const uniqueBreeds = Array.from(new Set(encounters.map(e => e.breed).filter(Boolean))) as string[]
  const uniqueSizes = Array.from(new Set(encounters.map(e => e.size).filter(Boolean))) as string[]
  const uniqueMoods = Array.from(new Set(encounters.map(e => e.mood).filter(Boolean))) as string[]

  return (
    <main className="min-h-screen relative z-10">
      {/* Hero Section */}
      <div className="relative">
        {/* Top Right Navigation - Overlay on Hero */}
        <div className="absolute top-0.5 right-4 sm:top-1 sm:right-6 flex items-center gap-3 flex-wrap z-30">
          {user ? (
            <>
              {/* Search Icon */}
              <button
                onClick={() => setShowSearchModal(true)}
                className="p-2 text-white hover:text-yellow-200 transition-colors rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                aria-label="Search encounters"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <NotificationBell />
              <Link
                href="/my-pawpaws"
                className="px-4 py-2 text-sm font-fredoka font-semibold text-white rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                style={{ 
                  fontFamily: 'var(--font-fredoka), sans-serif',
                  background: 'linear-gradient(to right, #FFC845, #FFD166)',
                  boxShadow: '0 8px 20px rgba(255, 181, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #FFD166, #FFB500)'
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(255, 181, 0, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #FFC845, #FFD166)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 181, 0, 0.3)'
                }}
                aria-label="My PawPaws"
              >
                🐾 My PawPaws
              </Link>
              <button
                onClick={async () => {
                  await signOut()
                  router.push('/') // Redirect to home after sign out
                }}
                className="px-4 py-2 text-sm font-fredoka font-semibold text-white rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                aria-label="Sign out"
                style={{ 
                  fontFamily: 'var(--font-fredoka), sans-serif',
                  background: 'linear-gradient(to right, #FFC845, #FFD166)',
                  boxShadow: '0 8px 20px rgba(255, 181, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #FFD166, #FFB500)'
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(255, 181, 0, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #FFC845, #FFD166)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 181, 0, 0.3)'
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              {/* Search Icon */}
              <button
                onClick={() => setShowSearchModal(true)}
                className="p-2 text-white hover:text-yellow-200 transition-colors rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                aria-label="Search encounters"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <Link
                href="/signin"
                className="px-6 py-3 text-sm font-fredoka font-semibold text-white rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{
                  background: 'linear-gradient(to right, #FFB500, #FFC845)',
                  boxShadow: '0 8px 20px rgba(255, 181, 0, 0.3)'
                }}
                aria-label="Sign in"
              >
                🔐 Sign In
              </Link>
            </>
          )}
        </div>

        {/* Hero Component */}
        <Hero />
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4"
          onClick={() => setShowSearchModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ color: '#5C3D2E' }}>Search Encounters</h2>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close search"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SearchBar
              onSearch={(results) => {
                setSearchResults(results)
                setSearchQuery('searching')
              }}
              onSearchStart={() => {
                setIsSearching(true)
                setSearchQuery('searching')
              }}
              onSearchEnd={() => {
                setIsSearching(false)
              }}
              onClear={() => {
                setSearchQuery('')
                setSearchResults([])
              }}
              placeholder="Search encounters by breed, description, or tags..."
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-0 pb-12 px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-18 lg:-mt-20 relative z-20">
        <div className="max-w-7xl mx-auto">
          
          {/* Upload Button */}
          <div className="flex justify-center gap-4 mb-4 relative z-30">
            {user ? (
              <Link
                href="/upload"
                className="px-8 py-4 text-base font-fredoka font-semibold text-white rounded-full transition-all shadow-xl hover:shadow-2xl transform hover:scale-110 relative z-40"
                style={{
                  background: 'linear-gradient(to right, #FFB500, #FFC845)',
                  boxShadow: '0 10px 25px rgba(255, 181, 0, 0.4)',
                  position: 'relative',
                  zIndex: 40
                }}
                aria-label="Upload your PawPaw encounter"
              >
                📸 Upload Your PawPaw Encounter
              </Link>
            ) : (
              <div className="text-center relative z-40">
                <Link
                  href="/signin"
                  className="px-8 py-4 text-base font-fredoka font-semibold text-white rounded-full transition-all shadow-xl hover:shadow-2xl transform hover:scale-110 inline-block relative z-50"
                  style={{
                    background: 'linear-gradient(to right, #FFB500, #FFC845)',
                    boxShadow: '0 10px 25px rgba(255, 181, 0, 0.4)',
                    position: 'relative',
                    zIndex: 50
                  }}
                >
                  📸 Upload Your PawPaws
                </Link>
                <p className="mt-3 text-sm font-medium" style={{ color: '#5C3D2E', opacity: 0.7 }}>
                  Sign in to upload and comment
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredEncounters.length === 0 && encounters.length === 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🐕</div>
            <p className="text-[#5C3D2E] mb-4 font-medium">No encounters yet.</p>
            <Link
              href="/upload"
              className="underline font-semibold transition-colors"
              style={{ color: '#FFB500' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FFC845'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#FFB500'}
            >
              Upload your first encounter! 🎉
            </Link>
          </div>
        )}

        {/* Empty Filter State */}
        {!loading && !error && !isSearching && searchQuery === '' && filteredEncounters.length === 0 && encounters.length > 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🐕</div>
            <p className="text-[#5C3D2E] mb-4 font-medium">No encounters match your filters.</p>
            <button
              onClick={() => {
                setSelectedBreed('')
                setSelectedSize('')
                setSelectedMood('')
                setDateFilter('all')
                setLocationRadius(0)
              }}
              className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-yellow-400 to-blue-500 rounded-lg hover:from-yellow-500 hover:to-blue-600 transition-all"
              aria-label="Clear all filters"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Empty Search State */}
        {!loading && !error && isSearching === false && searchQuery === 'searching' && searchResults.length === 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-[#5C3D2E] mb-4 font-medium">No encounters found matching your search.</p>
            <p className="text-sm text-gray-600 mb-4">Try different keywords or clear your search.</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSearchResults([])
                setShowSearchModal(false)
              }}
              className="px-6 py-2 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(to right, #FFB500, #FFC845)',
              }}
              aria-label="Clear search"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* SECTION 1: Grid of Encounters */}
        {!loading && ((searchQuery === 'searching' && searchResults.length > 0) || (searchQuery === '' && filteredEncounters.length > 0)) && (
          <section className="mb-16 sm:mb-20 lg:mb-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold flex items-center gap-3" style={{ 
                color: '#5C3D2E',
                fontFamily: 'var(--font-fredoka), sans-serif',
                textShadow: '0 2px 4px rgba(255, 255, 255, 0.8)',
                letterSpacing: '-0.02em'
              }}>
                <span className="text-3xl md:text-4xl">
                  {searchQuery === 'searching' ? '🔍' : '🖼️'}
                </span>
                <span>
                  {searchQuery === 'searching' 
                    ? `Search Results (${searchResults.length})` 
                    : 'Recent Encounters'}
                </span>
              </h2>
              <div className="flex items-center gap-3">
                {searchQuery === 'searching' && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSearchResults([])
                      setShowSearchModal(false)
                    }}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90 flex items-center gap-2"
                    style={{
                      background: 'linear-gradient(to right, #FFB500, #FFC845)',
                    }}
                    aria-label="Clear search and show all encounters"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Search
                  </button>
                )}
                {searchQuery === '' && filteredEncounters.length > 12 && (
                  <Link
                    href="#all"
                    className="text-sm font-semibold transition-colors hover:opacity-80 flex items-center gap-1"
                    style={{ color: '#5C3D2E' }}
                  >
                    <span>View All</span>
                    <span>→</span>
                  </Link>
                )}
              </div>
            </div>
            
            {/* Active Filter Chips */}
            {(selectedBreed || selectedSize || selectedMood || dateFilter !== 'all' || locationRadius > 0) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedBreed && (
                  <span className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 rounded-full flex items-center gap-2">
                    <span>🐶</span>
                    <span>Breed: {selectedBreed}</span>
                    <button
                      onClick={() => setSelectedBreed('')}
                      className="ml-1 hover:bg-yellow-300 rounded-full p-0.5 transition-colors"
                      aria-label="Remove breed filter"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedSize && (
                  <span className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full flex items-center gap-2">
                    <span>📏</span>
                    <span>Size: {selectedSize}</span>
                    <button
                      onClick={() => setSelectedSize('')}
                      className="ml-1 hover:bg-blue-300 rounded-full p-0.5 transition-colors"
                      aria-label="Remove size filter"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedMood && (
                  <span className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-full flex items-center gap-2">
                    <span>{getMoodEmoji(selectedMood)}</span>
                    <span>Mood: {selectedMood}</span>
                    <button
                      onClick={() => setSelectedMood('')}
                      className="ml-1 hover:bg-green-300 rounded-full p-0.5 transition-colors"
                      aria-label="Remove mood filter"
                    >
                      ×
                    </button>
                  </span>
                )}
                {dateFilter !== 'all' && (
                  <span className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 rounded-full flex items-center gap-2">
                    <span>📅</span>
                    <span>Date: {dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : dateFilter === 'month' ? 'This Month' : 'This Year'}</span>
                    <button
                      onClick={() => setDateFilter('all')}
                      className="ml-1 hover:bg-purple-300 rounded-full p-0.5 transition-colors"
                      aria-label="Remove date filter"
                    >
                      ×
                    </button>
                  </span>
                )}
                {locationRadius > 0 && (
                  <span className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 rounded-full flex items-center gap-2">
                    <span>📍</span>
                    <span>Radius: {locationRadius}km</span>
                    <button
                      onClick={() => setLocationRadius(0)}
                      className="ml-1 hover:bg-orange-300 rounded-full p-0.5 transition-colors"
                      aria-label="Remove location filter"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(searchQuery === 'searching' ? searchResults : filteredEncounters).slice(0, 12).map((encounter) => {
                const location = parseLocation(encounter.location)
                const encounterComments = commentsByEncounter[encounter.id] || []
                const commentCount = commentCounts[encounter.id] || 0
                const isExpanded = selectedEncounter === encounter.id
                const commentsToShow = isExpanded ? encounterComments : encounterComments.slice(0, 2)
                
                return (
                  <div
                    key={encounter.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                  >
                    {/* Image */}
                    <Link
                      href={`/encounter/${encounter.id}`}
                      className="w-full h-64 overflow-hidden bg-gray-200 relative group cursor-pointer block"
                      onDoubleClick={(e) => {
                        e.preventDefault()
                        handleDoubleClickEncounter(encounter)
                      }}
                    >
                      <img
                        src={encounter.photo_url}
                        alt={encounter.description}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Your Encounter Badge */}
                      {user && encounter.user_id === user.id && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg flex items-center gap-1">
                          <span>✏️</span>
                          <span>Your encounter</span>
                          <span className="text-[10px] opacity-75">(double-click to edit)</span>
                        </div>
                      )}
                      {/* Mood Emoji Badge */}
                      {encounter.mood && (
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2.5 text-2xl shadow-lg">
                          {getMoodEmoji(encounter.mood)}
                        </div>
                      )}
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>

                    {/* Content */}
                    <div className="p-5">
                      {/* Title - Always at the top */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-lg font-semibold line-clamp-2 flex-1" style={{ color: '#5C3D2E' }}>
                          {encounter.description}
                        </h3>
                        {/* Delete button for own encounters - small and unobtrusive */}
                        {user && encounter.user_id === user.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation() // Prevent double-click from triggering
                              handleDeleteEncounter(encounter.id)
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100 flex-shrink-0"
                            title="Delete encounter"
                            aria-label="Delete encounter"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>

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

                      {/* Posted By - More prominent on mobile */}
                      {encounter.user_id && (
                        <div className="flex items-center gap-2 mb-3 sm:mb-2">
                          <span className="text-xs sm:text-xs" style={{ color: '#5C3D2E', opacity: 0.7 }}>Posted by</span>
                          <UserDisplayName 
                            userId={encounter.user_id} 
                            showAvatar={true}
                            className="text-sm sm:text-xs font-semibold px-2 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                            linkToProfile={true}
                          />
                          {/* Mobile: Add a "View Profile" button for clarity */}
                          <Link
                            href={`/profile/${encounter.user_id}`}
                            className="sm:hidden text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md font-medium hover:bg-blue-100 active:bg-blue-200 transition-colors touch-manipulation"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Profile
                          </Link>
                        </div>
                      )}

                      {/* Location and Date - Combined */}
                      <div className="flex items-center gap-3 text-xs mb-3" style={{ color: '#5C3D2E', opacity: 0.7 }}>
                        {location && (
                          <div className="flex items-center gap-1">
                            <span>📍</span>
                            <span className="truncate font-medium">{getLocationName(encounter)}</span>
                          </div>
                        )}
                        {location && (
                          <span className="text-gray-300">•</span>
                        )}
                        <div className="flex items-center gap-1">
                          <span>📅</span>
                          <span>{formatDate(encounter.created_at)}</span>
                        </div>
                      </div>

                      {/* Likes and Comments Count */}
                      <div className="flex items-center justify-between mb-3">
                        <LikeButton
                          likes={encounter.likes}
                          onLike={(newLikes) => handleLike(encounter.id, newLikes)}
                          encounterId={encounter.id}
                        />
                        <button
                          onClick={() => {
                            if (commentCount > 2) {
                              setSelectedEncounter(selectedEncounter === encounter.id ? null : encounter.id)
                            }
                          }}
                          className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                            commentCount > 2 ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                          }`}
                          style={{ color: '#5C3D2E' }}
                          onMouseEnter={(e) => {
                            if (commentCount > 2) {
                              e.currentTarget.style.color = '#FFB500'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (commentCount > 2) {
                              e.currentTarget.style.color = '#5C3D2E'
                            }
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>{commentCount > 0 ? `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}` : '0 comments'}</span>
                        </button>
                      </div>

                      {/* Comments Preview (first 2, or all if expanded) */}
                      {commentsToShow.length > 0 && (
                        <div className="mb-3 pt-3 border-t border-gray-200">
                          <div className="space-y-2">
                            {commentsToShow.map((comment) => (
                              <div key={comment.id} className="p-2 bg-gray-50 rounded-md">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium" style={{ color: '#5C3D2E' }}>
                                      {comment.comment}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <UserProfileLink 
                                        userId={comment.user_id} 
                                        showAvatar={false} 
                                        className="text-xs font-medium" 
                                      />
                                      <span className="text-xs" style={{ color: '#5C3D2E', opacity: 0.4 }}>•</span>
                                      <p className="text-xs" style={{ color: '#5C3D2E', opacity: 0.6 }}>
                                        {formatCommentDate(comment.created_at)}
                                      </p>
                                    </div>
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

                      {/* View All / Show Less Comments Button */}
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
                          {isExpanded ? 'Show less' : `View all ${commentCount} comments`}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* SECTION 2 & 3: Filters and Map Side-by-Side */}
        {!loading && (searchQuery === 'searching' ? searchResults.length > 0 : encounters.length > 0) && (
          <section className="mb-16 sm:mb-20 lg:mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-[38.2%_61.8%] gap-8">
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#5C3D2E' }}>
                  🔍 Filters
                  {searchQuery === 'searching' && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (Search active)
                    </span>
                  )}
                </h2>
                <div className={`space-y-4 ${searchQuery === 'searching' ? 'opacity-50 pointer-events-none' : ''}`}>
                  {/* Breed Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#5C3D2E' }}>
                      Breed
                    </label>
                    <input
                      type="text"
                      value={selectedBreed}
                      onChange={(e) => setSelectedBreed(e.target.value)}
                      placeholder="Filter by breed..."
                      disabled={searchQuery === 'searching'}
                      className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-yellow-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      style={{ borderColor: '#FFC845' }}
                    />
                  </div>

                  {/* Size Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#5C3D2E' }}>
                      Size
                    </label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      disabled={searchQuery === 'searching'}
                      className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-yellow-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      style={{ borderColor: '#FFC845' }}
                    >
                      <option value="">All sizes</option>
                      {uniqueSizes.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  {/* Mood Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#5C3D2E' }}>
                      Mood
                    </label>
                    <select
                      value={selectedMood}
                      onChange={(e) => setSelectedMood(e.target.value)}
                      disabled={searchQuery === 'searching'}
                      className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-yellow-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      style={{ borderColor: '#FFC845' }}
                    >
                      <option value="">All moods</option>
                      {uniqueMoods.map((mood) => (
                        <option key={mood} value={mood}>{mood}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#5C3D2E' }}>
                      Date
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      disabled={searchQuery === 'searching'}
                      className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-yellow-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      style={{ borderColor: '#FFC845' }}
                    >
                      <option value="all">All time</option>
                      <option value="today">Today</option>
                      <option value="week">This week</option>
                      <option value="month">This month</option>
                    </select>
                  </div>

                  {/* Location Radius Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#5C3D2E' }}>
                      Location Radius: {locationRadius} km
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={locationRadius}
                      onChange={(e) => setLocationRadius(Number(e.target.value))}
                      disabled={searchQuery === 'searching'}
                      className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Location radius filter in kilometers"
                      aria-valuemin={0}
                      aria-valuemax={50}
                      aria-valuenow={locationRadius}
                    />
                    <button
                      onClick={() => setLocationRadius(0)}
                      className="mt-2 text-sm text-gray-600 hover:text-gray-800 underline"
                      aria-label="Clear location radius filter"
                    >
                      Clear radius
                    </button>
                  </div>

                  {/* Clear Filters Button */}
                  <button
                    onClick={() => {
                      setSelectedBreed('')
                      setSelectedSize('')
                      setSelectedMood('')
                      setDateFilter('all')
                      setLocationRadius(0)
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-yellow-400 to-blue-500 rounded-lg hover:from-yellow-500 hover:to-blue-600 transition-all"
                    aria-label="Clear all filters"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>

              {/* Map View */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#5C3D2E' }}>
                    🗺️ Map View
                  </h2>
                </div>
                <div className="h-[500px] w-full rounded-xl overflow-hidden border-2 border-gray-300 shadow-xl">
                  <MapView key="main-map-view" encounters={searchQuery === 'searching' ? searchResults : filteredEncounters} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: Leaderboard - Collapsible at Bottom */}
        {encounters.length > 0 && (
          <section className="mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="w-full flex items-center justify-between text-2xl font-bold mb-4"
                style={{ color: '#5C3D2E' }}
                aria-label={showLeaderboard ? 'Hide leaderboard' : 'Show leaderboard'}
                aria-expanded={showLeaderboard}
              >
                <span className="flex items-center gap-2">
                  🏆 Leaderboard
                </span>
                <span className="text-lg">{showLeaderboard ? '▼' : '▶'}</span>
              </button>
              {showLeaderboard && (
                <div className="mt-4">
                  <Leaderboard />
                </div>
              )}
            </div>
          </section>
        )}
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation />
      
      {/* Add padding to bottom of main content to prevent overlap with bottom nav */}
      <div className="h-16 sm:hidden" aria-hidden="true"></div>
    </main>
  )
}
