'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { hasUserLiked, likeEncounter, unlikeEncounter } from '@/lib/likes'

interface LikeButtonProps {
  likes: number
  onLike: (newLikes: number) => void
  encounterId: string
}

export default function LikeButton({ likes, onLike, encounterId }: LikeButtonProps) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentLikes, setCurrentLikes] = useState(likes)
  const [loading, setLoading] = useState(true)

  // Check if user has already liked this encounter
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const liked = await hasUserLiked(encounterId, user.id)
        setIsLiked(liked)
      } catch (error) {
        console.error('Error checking like status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkLikeStatus()
  }, [encounterId, user])

  // Update likes when prop changes
  useEffect(() => {
    setCurrentLikes(likes)
  }, [likes])

  const handleClick = async () => {
    if (!user) {
      return
    }

    if (loading) return

    const wasLiked = isLiked
    const newLikedState = !wasLiked
    const newLikesCount = wasLiked ? currentLikes - 1 : currentLikes + 1

    // Optimistic update
    setIsLiked(newLikedState)
    setCurrentLikes(newLikesCount)
    setIsAnimating(true)

    try {
      if (wasLiked) {
        // Unlike
        const success = await unlikeEncounter(encounterId, user.id)
        if (!success) {
          // Revert on error
          setIsLiked(wasLiked)
          setCurrentLikes(currentLikes)
        } else {
          onLike(newLikesCount)
        }
      } else {
        // Like
        const success = await likeEncounter(encounterId, user.id)
        if (!success) {
          // Revert on error
          setIsLiked(wasLiked)
          setCurrentLikes(currentLikes)
        } else {
          onLike(newLikesCount)
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert on error
      setIsLiked(wasLiked)
      setCurrentLikes(currentLikes)
    } finally {
      setTimeout(() => {
        setIsAnimating(false)
      }, 500)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || !user}
      className={`flex items-center gap-2.5 sm:gap-2 transition-all duration-300 touch-manipulation min-h-[44px] sm:min-h-0 px-2 rounded focus-visible-ring ${
        isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500 active:text-red-600'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <svg 
        className={`w-7 h-7 sm:w-6 sm:h-6 transition-all duration-300 ${isAnimating ? 'animate-pulse-heart' : ''}`}
        fill={isLiked ? '#FF0000' : 'none'}
        stroke={isLiked ? '#FF0000' : 'currentColor'}
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
        />
      </svg>
      <span className="font-semibold text-base sm:text-sm">{currentLikes}</span>
    </button>
  )
}

