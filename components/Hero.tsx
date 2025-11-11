'use client'

import { useEffect, useState } from 'react'

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Defer setState to avoid synchronous state update warning
    setTimeout(() => {
      setIsVisible(true)
    }, 0)
  }, [])

  return (
    <section className="relative w-full overflow-hidden" style={{ height: '30vh', minHeight: '200px', maxHeight: '280px' }}>
      {/* Hero Content Layer - Background is handled by Background component */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 h-full pt-16 sm:pt-14 lg:pt-16">
        {/* Main Header with Animation */}
        <h1
          className={`text-5xl sm:text-7xl lg:text-8xl font-bold mb-3 sm:mb-4 transition-all duration-1000 relative ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{
            fontFamily: 'var(--font-caveat), cursive',
            color: '#5C3D2E',
            textShadow: '0 4px 12px rgba(255, 255, 255, 0.8), 0 2px 6px rgba(0, 0, 0, 0.1)',
            letterSpacing: '0.02em',
            lineHeight: '1.1',
            fontWeight: 700,
            transform: 'rotate(-2deg)',
          }}
        >
          <span className="inline-flex items-center gap-1 sm:gap-3">
            <span className="text-4xl sm:text-6xl lg:text-7xl icon-float-left" style={{ transform: 'rotate(8deg)' }}>
              🐕
            </span>
            <span className="inline-block relative">
              PawPaw Encounters
              {/* Hand-drawn underline */}
              <svg 
                className="absolute -bottom-2 left-0 w-full h-3 sm:h-4" 
                viewBox="0 0 300 12" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <path 
                  d="M2 6 Q 50 3, 100 6 T 200 6 T 298 6" 
                  stroke="#FFB500" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  fill="none"
                  style={{ 
                    filter: 'drop-shadow(0 2px 3px rgba(255, 181, 0, 0.3))'
                  }}
                />
              </svg>
            </span>
            <span className="text-4xl sm:text-6xl lg:text-7xl icon-float-right" style={{ transform: 'rotate(-8deg)' }}>
              🐾
            </span>
          </span>
        </h1>

        {/* Tagline with Animation */}
        <p
          className={`text-lg sm:text-xl lg:text-2xl mb-0 sm:mb-4 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{
            fontFamily: 'var(--font-patrick), cursive',
            color: '#5C3D2E',
            textShadow: '0 2px 8px rgba(255, 255, 255, 0.9), 0 1px 3px rgba(0, 0, 0, 0.1)',
            lineHeight: '1.4',
            fontWeight: 400,
            transform: 'rotate(1deg)',
          }}
        >
          {/* Mobile: Shorter version */}
          <span className="sm:hidden">
            Share your paw encounters and light up the community!
          </span>
          {/* Desktop: Full version */}
          <span className="hidden sm:inline">
            Share your paw encounters! They light up your day, you light up the community.
          </span>
        </p>
      </div>
    </section>
  )
}

