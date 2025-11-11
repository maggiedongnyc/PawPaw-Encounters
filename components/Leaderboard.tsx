'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getUserProfile, getDisplayName, getAvatarUrl } from '@/lib/profiles'

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
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-yellow-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          🏆 Leaderboard
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('uploads')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all transform hover:scale-105 ${
              sortBy === 'uploads'
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📤 Uploads
          </button>
          <button
            onClick={() => setSortBy('likes')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all transform hover:scale-105 ${
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
          <div className="inline-block animate-spin text-4xl mb-2">🐕</div>
          <p className="text-gray-500 text-sm">Loading leaderboard...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🐕</div>
          <p className="text-gray-500 text-sm">No entries yet. Start uploading to appear on the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.user_id}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200 hover:shadow-lg transition-all transform hover:scale-105"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{getRankEmoji(index + 1)}</div>
                <div className="text-4xl">{entry.avatar || getDogAvatar(entry.user_id)}</div>
                <div>
                  {entry.user_id === 'anonymous' ? (
                    <p className="text-sm font-bold text-gray-900">
                      {entry.display_name || 'Anonymous User'}
                    </p>
                  ) : (
                    <Link
                      href={`/profile/${entry.user_id}`}
                      className="text-sm font-bold text-gray-900 hover:text-yellow-600 transition-colors block"
                    >
                      {entry.display_name || `User ${entry.user_id.slice(0, 8)}`}
                    </Link>
                  )}
                  <p className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                    <span>📤 {entry.upload_count} uploads</span>
                    <span>•</span>
                    <span>❤️ {entry.total_likes} likes</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
