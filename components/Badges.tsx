'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ProgressBar from './ProgressBar'
import BadgePopup from './BadgePopup'

interface Badge {
  id: string
  user_id: string
  badge_type: string
  earned_at: string
}

interface BadgesProps {
  userId?: string
}

const badgeInfo: Record<string, { emoji: string; name: string; description: string; target: number }> = {
  first_upload: { emoji: '🎉', name: 'First Encounter', description: 'Uploaded your first dog encounter!', target: 1 },
  five_uploads: { emoji: '⭐', name: 'Dog Lover', description: 'Uploaded 5 encounters!', target: 5 },
  ten_uploads: { emoji: '🏆', name: 'Dog Enthusiast', description: 'Uploaded 10 encounters!', target: 10 },
  twenty_uploads: { emoji: '👑', name: 'Dog Master', description: 'Uploaded 20 encounters!', target: 20 },
  fifty_uploads: { emoji: '💎', name: 'Dog Legend', description: 'Uploaded 50 encounters!', target: 50 },
}

export default function Badges({ userId }: BadgesProps) {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadCount, setUploadCount] = useState(0)
  const [newBadge, setNewBadge] = useState<{ emoji: string; name: string; description: string } | null>(null)

  useEffect(() => {
    if (userId) {
      fetchBadges()
      fetchUploadCount()
    }
  }, [userId])

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('Badges')
        .select('*')
        .eq('user_id', userId || 'anonymous')
        .order('earned_at', { ascending: false })

      if (error) throw error
      
      const previousCount = badges.length
      setBadges(data || [])
      
      // Check for new badge
      if (data && data.length > previousCount && data.length > 0) {
        const latestBadge = data[0]
        const info = badgeInfo[latestBadge.badge_type]
        if (info) {
          setNewBadge(info)
        }
      }
    } catch (err) {
      console.error('Error fetching badges:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUploadCount = async () => {
    try {
      const { data } = await supabase
        .from('Encounters')
        .select('id')
        .eq('user_id', userId || 'anonymous')
      
      setUploadCount(data?.length || 0)
    } catch (err) {
      console.error('Error fetching upload count:', err)
    }
  }

  const getNextBadge = () => {
    const badgeTypes = ['first_upload', 'five_uploads', 'ten_uploads', 'twenty_uploads', 'fifty_uploads']
    const earnedTypes = new Set(badges.map(b => b.badge_type))
    
    for (const type of badgeTypes) {
      if (!earnedTypes.has(type)) {
        return badgeInfo[type]
      }
    }
    return null
  }

  if (loading || !userId) return null

  const nextBadge = getNextBadge()

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-yellow-200">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          🏅 Your Badges
        </h3>
        
        {badges.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-6xl mb-4">🐕</div>
            <p className="text-gray-600 mb-4">No badges yet. Start uploading to earn badges!</p>
            {nextBadge && (
              <ProgressBar
                current={uploadCount}
                target={nextBadge.target}
                label={`Next: ${nextBadge.name}`}
              />
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {badges.map((badge) => {
                const info = badgeInfo[badge.badge_type] || { emoji: '🏅', name: badge.badge_type, description: '', target: 0 }
                return (
                  <div
                    key={badge.id}
                    className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200 hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    <div className="text-5xl mb-2 bounce-in">{info.emoji}</div>
                    <p className="text-sm font-bold text-gray-900">{info.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{info.description}</p>
                  </div>
                )
              })}
            </div>
            
            {nextBadge && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <ProgressBar
                  current={uploadCount}
                  target={nextBadge.target}
                  label={`Next Badge: ${nextBadge.name} ${nextBadge.emoji}`}
                />
              </div>
            )}
          </>
        )}
      </div>
      
      <BadgePopup badge={newBadge} onClose={() => setNewBadge(null)} />
    </>
  )
}
