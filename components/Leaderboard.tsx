'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getUserProfile, getDisplayName, getAvatarUrl } from '@/lib/profiles'
import { Spinner } from './Spinner'
import { EmptyState } from './EmptyState'

interface LeaderboardEntry {
  user_id: string
  upload_count: number
  total_likes: number
  display_name?: string
  avatar?: string
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'uploads' | 'likes'>('uploads')

  useEffect(() => {
    fetchLeaderboard()
  }, [sortBy])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      
      if (sortBy === 'uploads') {
        const { data, error } = await supabase
          .from('Encounters')
          .select('user_id')

        if (error) throw error

        const userCounts: Record<string, number> = {}
        data?.forEach(encounter => {
          const userId = encounter.user_id || 'anonymous'
          userCounts[userId] = (userCounts[userId] || 0) + 1
        })

        const entries: LeaderboardEntry[] = Object.entries(userCounts)
          .map(([user_id, upload_count]) => ({
            user_id,
            upload_count,
            total_likes: 0,
          }))
          .sort((a, b) => b.upload_count - a.upload_count)
          .slice(0, 10)

        const { data: likesData } = await supabase
          .from('Encounters')
          .select('user_id, likes')

        likesData?.forEach(encounter => {
          const userId = encounter.user_id || 'anonymous'
          const entry = entries.find(e => e.user_id === userId)
          if (entry) {
            entry.total_likes += encounter.likes || 0
          }
        })

        // Load display names for all entries
        const entriesWithNames = await Promise.all(
          entries.map(async (entry) => {
            if (entry.user_id === 'anonymous') {
              return {
                ...entry,
                display_name: 'Anonymous User',
                avatar: '🐕'
              }
            }
            try {
              const profile = await getUserProfile(entry.user_id)
              return {
                ...entry,
                display_name: profile ? getDisplayName(profile, entry.user_id) : `User ${entry.user_id.slice(0, 8)}`,
                avatar: profile ? getAvatarUrl(profile) : '🐕'
              }
            } catch (error) {
              return {
                ...entry,
                display_name: `User ${entry.user_id.slice(0, 8)}`,
                avatar: '🐕'
              }
            }
          })
        )
        setLeaderboard(entriesWithNames)
      } else {
        const { data, error } = await supabase
          .from('Encounters')
          .select('user_id, likes')

        if (error) throw error

        const userLikes: Record<string, number> = {}
        const userCounts: Record<string, number> = {}

        data?.forEach(encounter => {
          const userId = encounter.user_id || 'anonymous'
          userLikes[userId] = (userLikes[userId] || 0) + (encounter.likes || 0)
          userCounts[userId] = (userCounts[userId] || 0) + 1
        })

        const entries: LeaderboardEntry[] = Object.entries(userLikes)
          .map(([user_id, total_likes]) => ({
            user_id,
            upload_count: userCounts[user_id] || 0,
            total_likes,
          }))
          .sort((a, b) => b.total_likes - a.total_likes)
          .slice(0, 10)

        // Load display names for all entries
        const entriesWithNames = await Promise.all(
          entries.map(async (entry) => {
            if (entry.user_id === 'anonymous') {
              return {
                ...entry,
                display_name: 'Anonymous User',
                avatar: '🐕'
              }
            }
            try {
              const profile = await getUserProfile(entry.user_id)
              return {
                ...entry,
                display_name: profile ? getDisplayName(profile, entry.user_id) : `User ${entry.user_id.slice(0, 8)}`,
                avatar: profile ? getAvatarUrl(profile) : '🐕'
              }
            } catch (error) {
              return {
                ...entry,
                display_name: `User ${entry.user_id.slice(0, 8)}`,
                avatar: '🐕'
              }
            }
          })
        )
        setLeaderboard(entriesWithNames)
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRankEmoji = (rank: number): string => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getDogAvatar = (userId: string): string => {
    const avatars = ['🐕', '🐕‍🦺', '🦮', '🐩', '🐶', '🐾', '🦴']
    const index = userId.charCodeAt(0) % avatars.length
    return avatars[index]
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 border-0 sm:border-2 sm:border-yellow-200">
      <div className="flex justify-between items-center mb-2 sm:mb-4">
        <div className="flex gap-1.5 sm:gap-2">
          <button
            onClick={() => setSortBy('uploads')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all transform hover:scale-105 ${
              sortBy === 'uploads'
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📤 Uploads
          </button>
          <button
            onClick={() => setSortBy('likes')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all transform hover:scale-105 ${
              sortBy === 'likes'
                ? 'bg-gradient-to-r from-pink-400 to-red-400 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ❤️ Likes
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Loading leaderboard...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="No rankings yet"
          description="Start sharing encounters to appear on the leaderboard!"
        />
      ) : (
        <div className="space-y-1 sm:space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.user_id}
              className="flex items-center gap-2 sm:gap-3 py-2 sm:p-4 sm:bg-yellow-50 sm:rounded-xl sm:border-2 sm:border-yellow-200 sm:hover:shadow-lg sm:transition-all sm:transform sm:hover:scale-105 border-b border-gray-200 sm:border-b-0 last:border-b-0 overflow-hidden"
            >
              {/* Rank Badge */}
              <div className="text-xl sm:text-3xl flex-shrink-0">{getRankEmoji(index + 1)}</div>
              
              {/* Dog Icon */}
              <div className="text-2xl sm:text-4xl flex-shrink-0">{entry.avatar || getDogAvatar(entry.user_id)}</div>
              
              {/* User Name */}
              <div className="flex-shrink min-w-0 max-w-[120px] sm:max-w-none sm:flex-1 flex items-center">
                {entry.user_id === 'anonymous' ? (
                  <p className="text-xs sm:text-sm font-bold text-gray-900 truncate whitespace-nowrap leading-none">
                    {entry.display_name || 'Anonymous User'}
                  </p>
                ) : (
                  <Link
                    href={`/profile/${entry.user_id}`}
                    className="text-xs sm:text-sm font-bold text-gray-900 hover:text-yellow-600 transition-colors block truncate whitespace-nowrap leading-none"
                  >
                    {entry.display_name || `User ${entry.user_id.slice(0, 8)}`}
                  </Link>
                )}
              </div>
              
              {/* Stats in one row */}
              <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0 ml-auto">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <span className="text-sm sm:text-lg">📤</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">{entry.upload_count}</span>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <span className="text-sm sm:text-lg">❤️</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">{entry.total_likes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
