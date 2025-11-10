'use client'

import { useState } from 'react'

interface LikeButtonProps {
  likes: number
  onLike: () => void
  encounterId: string
}

export default function LikeButton({ likes, onLike, encounterId }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = () => {
    if (!isLiked) {
      setIsLiked(true)
      setIsAnimating(true)
      onLike()
      
      setTimeout(() => {
        setIsAnimating(false)
      }, 500)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLiked}
      className={`flex items-center gap-2 transition-all duration-300 ${
        isLiked ? '' : 'text-gray-600 hover:text-red-500'
      }`}
      style={isLiked ? { color: '#FF0000' } : {}}
    >
      <svg 
        className={`w-6 h-6 transition-all duration-300 ${isAnimating ? 'animate-pulse-heart' : ''}`}
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
      <span className="font-semibold">{likes}</span>
    </button>
  )
}

