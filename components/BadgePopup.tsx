'use client'

import { useEffect, useState } from 'react'

interface BadgePopupProps {
  badge: {
    emoji: string
    name: string
    description: string
  } | null
  onClose: () => void
}

export default function BadgePopup({ badge, onClose }: BadgePopupProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (badge) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 500)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [badge, onClose])

  if (!badge || !isVisible) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="badge-popup bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 border-4 border-yellow-400">
        <div className="text-center">
          <div className="text-8xl mb-4">{badge.emoji}</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{badge.name}</h3>
          <p className="text-gray-600 mb-4">{badge.description}</p>
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(onClose, 500)
            }}
            className="px-6 py-2 bg-yellow-400 text-white rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
          >
            Awesome! 🎉
          </button>
        </div>
      </div>
    </div>
  )
}

