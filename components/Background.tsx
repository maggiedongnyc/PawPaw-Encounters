'use client'

import { useEffect, useState, useMemo, useRef } from 'react'

export default function Background() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Defer setState to avoid synchronous state update warning
    setTimeout(() => {
      setMounted(true)
    }, 0)
  }, [])

  // Helper function to generate points along a diagonal path
  const generateDiagonalPath = (start: { x: number; y: number }, end: { x: number; y: number }, numPoints: number) => {
    const points = []
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1)
      const x = start.x + (end.x - start.x) * t
      const y = start.y + (end.y - start.y) * t
      points.push({ x, y })
    }
    return points
  }

  // Helper function to generate points along an S-curve path
  const generateSCurvePath = (start: { x: number; y: number }, end: { x: number; y: number }, numPoints: number) => {
    const points = []
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1)
      // S-curve using sine wave
      const curveX = Math.sin(t * Math.PI) * 15 // 15% horizontal curve
      const x = start.x + (end.x - start.x) * t + curveX
      const y = start.y + (end.y - start.y) * t
      points.push({ x, y })
    }
    return points
  }

  // Helper function to generate points along an arc path
  const generateArcPath = (start: { x: number; y: number }, end: { x: number; y: number }, numPoints: number, arcHeight: number) => {
    const points = []
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1)
      // Arc using quadratic curve
      const arcX = 4 * arcHeight * t * (1 - t) // Parabolic arc
      const x = start.x + (end.x - start.x) * t
      const y = start.y + (end.y - start.y) * t - arcX
      points.push({ x, y })
    }
    return points
  }

  // Calculate rotation angle based on path direction
  const calculateRotation = (currentPoint: { x: number; y: number }, nextPoint: { x: number; y: number } | null, baseRotation: number, seededRandom?: () => number) => {
    if (!nextPoint) return baseRotation
    const dx = nextPoint.x - currentPoint.x
    const dy = nextPoint.y - currentPoint.y
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)
    const random = seededRandom || Math.random
    return angle + (random() - 0.5) * 10 // Add ±5° variation
  }

  // Generate random size based on mix ratio: 30% small, 50% medium, 20% large
  const getRandomSize = (randomFn: () => number = Math.random) => {
    const rand = randomFn()
    if (rand < 0.3) return randomFn() * 10 + 30 // 30-40px (small)
    if (rand < 0.8) return randomFn() * 15 + 45 // 45-60px (medium)
    return randomFn() * 15 + 65 // 65-80px (large)
  }

  // Define natural walking paths - only edges and corners (avoid center 25-75% completely)
  const paths = [
    // Path 1: Top-left corner to bottom-right corner (edge path)
    {
      name: 'diagonal-1',
      points: generateDiagonalPath(
        { x: 3, y: 30 },
        { x: 25, y: 85 }, // Stay on left edge
        4
      )
    },
    // Path 2: Top-right corner to bottom-left corner (edge path)
    {
      name: 's-curve',
      points: generateSCurvePath(
        { x: 97, y: 28 },
        { x: 3, y: 82 }, // Stay on edges
        4
      )
    },
    // Path 3: Bottom-left corner to top-right corner (edge path)
    {
      name: 'arc',
      points: generateArcPath(
        { x: 3, y: 80 },
        { x: 97, y: 32 }, // Stay on edges
        4,
        20
      )
    },
    // Path 4: Top-right corner path
    {
      name: 'diagonal-2',
      points: generateDiagonalPath(
        { x: 75, y: 30 }, // Start from right edge
        { x: 97, y: 88 }, // Stay on right edge
        3
      )
    },
    // Path 5: Top-left corner horizontal path
    {
      name: 'horizontal-top-left',
      points: generateDiagonalPath(
        { x: 3, y: 30 },
        { x: 20, y: 32 }, // Stay on left edge
        3
      )
    },
    // Path 6: Top-right corner horizontal path
    {
      name: 'horizontal-top-right',
      points: generateDiagonalPath(
        { x: 80, y: 30 },
        { x: 97, y: 32 }, // Stay on right edge
        3
      )
    },
    // Path 7: Bottom-left corner horizontal path
    {
      name: 'horizontal-bottom-left',
      points: generateDiagonalPath(
        { x: 3, y: 85 },
        { x: 20, y: 88 }, // Stay on left edge
        3
      )
    },
    // Path 8: Bottom-right corner horizontal path
    {
      name: 'horizontal-bottom-right',
      points: generateDiagonalPath(
        { x: 80, y: 85 },
        { x: 97, y: 88 }, // Stay on right edge
        3
      )
    }
  ]

  // Generate paw prints from paths - use useMemo with seeded random for consistency
  const pawPrints = useMemo(() => {
    if (!mounted) return []
    
    const prints: Array<{
      id: string
      left: number
      top: number
      size: number
      rotation: number
      delay: number
      duration: number
      opacity: number
      startOffset: number
    }> = []

    // Use a seeded random function for consistent results across server/client
    // Use a closure to maintain seed state without reassignment
    const createSeededRandom = (initialSeed: number) => {
      let seed = initialSeed
      return () => {
        seed = (seed * 9301 + 49297) % 233280
        return seed / 233280
      }
    }
    const seededRandom = createSeededRandom(12345)

    paths.forEach((path) => {
      path.points.forEach((point, idx) => {
        const nextPoint = idx < path.points.length - 1 ? path.points[idx + 1] : null
        const baseRotation = calculateRotation(point, nextPoint, 0, seededRandom)
        
        // Vary spacing along path (60-120px equivalent in %)
        const spacingVariation = seededRandom() * 0.5 + 0.75 // 0.75-1.25 multiplier
        
        prints.push({
          id: `${path.name}-${idx}`,
          left: point.x + (seededRandom() - 0.5) * 3, // Small random offset
          top: point.y + (seededRandom() - 0.5) * 3,
          size: getRandomSize(seededRandom),
          rotation: baseRotation + (seededRandom() - 0.5) * 30, // ±15° variation (MORE ROTATION!)
          delay: seededRandom() * 5, // Stagger fade-in over 0-5 seconds
          duration: seededRandom() * 6 + 8, // 8-14 seconds for faster bounce
          opacity: seededRandom() * 0.15 + 0.25, // 0.25-0.4 opacity (slightly more visible)
          startOffset: seededRandom(), // Where in float cycle to start
        })
      })
    })

    // Add some scattered prints to fill gaps naturally (5% of total) - only edges and corners
    const scatteredCount = Math.floor(prints.length * 0.05)
    for (let i = 0; i < scatteredCount; i++) {
      // Only edges and corners - completely avoid center (25-75% horizontally, 25-75% vertically)
      let left, top
      const rand = seededRandom()
      if (rand < 0.33) {
        // Left edge (0-25%)
        left = seededRandom() * 25
        top = seededRandom() * 100
      } else if (rand < 0.66) {
        // Right edge (75-100%)
        left = seededRandom() * 25 + 75
        top = seededRandom() * 100
      } else {
        // Top or bottom edge (avoid center horizontally)
        left = seededRandom() < 0.5 ? seededRandom() * 25 : seededRandom() * 25 + 75 // 0-25% or 75-100%
        top = seededRandom() < 0.5 ? seededRandom() * 25 : seededRandom() * 25 + 75 // 0-25% or 75-100%
      }
      
      prints.push({
        id: `scattered-${i}`,
        left,
        top,
        size: getRandomSize(seededRandom),
        rotation: seededRandom() * 360,
        delay: seededRandom() * 5,
        duration: seededRandom() * 6 + 8, // 8-14 seconds for faster bounce
        opacity: seededRandom() * 0.15 + 0.25, // 0.25-0.4 opacity (slightly more visible)
        startOffset: seededRandom(),
      })
    }

    return prints
  }, [mounted]) // Only regenerate when mounted changes

  if (!mounted) return null

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Cork Board Base - Community Bulletin Board Feel */}
      <div 
        className="absolute inset-0"
        style={{
          background: '#E5D4C1',
        }}
      />
      
      {/* Cork Texture - Fine grain and organic variation */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(217, 200, 181, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(232, 215, 196, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(209, 196, 177, 0.3) 0%, transparent 40%),
            radial-gradient(ellipse at 70% 20%, rgba(225, 212, 193, 0.3) 0%, transparent 40%)
          `,
        }}
      />
      
      {/* Cork Grain Texture */}
      <div 
        className="absolute inset-0 opacity-40 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='corkNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' seed='1' /%3E%3CfeColorMatrix values='0 0 0 0 0.82, 0 0 0 0 0.77, 0 0 0 0 0.69, 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23corkNoise)' opacity='0.15'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Subtle darker spots (like cork natural texture) */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='15' r='1' fill='%238B7355' opacity='0.3'/%3E%3Ccircle cx='45' cy='30' r='1.5' fill='%238B7355' opacity='0.2'/%3E%3Ccircle cx='70' cy='55' r='1' fill='%238B7355' opacity='0.25'/%3E%3Ccircle cx='25' cy='75' r='1.2' fill='%238B7355' opacity='0.3'/%3E%3Ccircle cx='85' cy='20' r='0.8' fill='%238B7355' opacity='0.2'/%3E%3Ccircle cx='60' cy='85' r='1' fill='%238B7355' opacity='0.25'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Paw Print Overlay Layer */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        {pawPrints.map((paw) => (
          <div
            key={paw.id}
            className="absolute"
            style={{
              left: `${paw.left}%`,
              top: `${paw.top}%`,
              width: `${paw.size}px`,
              height: `${paw.size}px`,
              transform: `rotate(${paw.rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                '--target-opacity': paw.opacity,
                animation: `fadeInFloat ${paw.duration}s ease-in-out infinite`,
                animationDelay: `${paw.delay}s`,
                animationFillMode: 'both',
                willChange: 'transform, opacity',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15)) drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              } as React.CSSProperties & { '--target-opacity': number }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                {/* Paw print icon matching header style - main pad */}
                <path
                  d="M12 18C10.5 18 9 16.5 9 15C9 13.5 10.5 12 12 12C13.5 12 15 13.5 15 15C15 16.5 13.5 18 12 18Z"
                  fill="#000000"
                />
                {/* Toe pads - top left */}
                <circle cx="8" cy="10" r="2.5" fill="#000000" />
                {/* Toe pad - top center */}
                <circle cx="12" cy="8" r="2.5" fill="#000000" />
                {/* Toe pad - top right */}
                <circle cx="16" cy="10" r="2.5" fill="#000000" />
                {/* Small toe pads - top */}
                <circle cx="10" cy="6" r="2" fill="#000000" />
                <circle cx="14" cy="6" r="2" fill="#000000" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

