'use client'

import { useEffect, useState } from 'react'

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative w-full overflow-hidden" style={{ height: '45vh', minHeight: '320px', maxHeight: '450px' }}>
      {/* Hero Content Layer - Background is handled by Background component */}
      <div className="relative z-10 flex flex-col items-center justify-start text-center px-4 sm:px-6 lg:px-8 h-full pt-12 sm:pt-14 lg:pt-16">
        {/* Main Header with Animation */}
        <h1
          className={`text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 sm:mb-5 lg:mb-6 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{
            fontFamily: 'var(--font-fredoka), sans-serif',
            color: '#5C3D2E',
            textShadow: '0 4px 12px rgba(255, 255, 255, 0.8), 0 2px 6px rgba(0, 0, 0, 0.1)',
            letterSpacing: '-0.02em',
            lineHeight: '1.1',
          }}
        >
          <span className="inline-flex items-center gap-3">
            <span className="text-4xl sm:text-5xl lg:text-6xl animate-bounce" style={{ animationDuration: '2s' }}>
              🐕
            </span>
            <span className="inline-block">
              PawPaw Encounters
            </span>
            <span className="text-4xl sm:text-5xl lg:text-6xl animate-bounce" style={{ animationDuration: '2s', animationDelay: '0.5s' }}>
              🐾
            </span>
          </span>
        </h1>

        {/* Tagline with Animation */}
        <p
          className={`text-lg sm:text-xl lg:text-2xl font-medium mb-0 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{
            fontFamily: 'var(--font-fredoka), sans-serif',
            color: '#5C3D2E',
            textShadow: '0 2px 8px rgba(255, 255, 255, 0.9), 0 1px 3px rgba(0, 0, 0, 0.1)',
            lineHeight: '1.4',
          }}
        >
          Share your dog encounters with the community! 🎾
        </p>
      </div>
    </section>
  )
}

