'use client'

import { useEffect, useState } from 'react'

export default function Background() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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
  const calculateRotation = (currentPoint: { x: number; y: number }, nextPoint: { x: number; y: number } | null, baseRotation: number) => {
    if (!nextPoint) return baseRotation
    const dx = nextPoint.x - currentPoint.x
    const dy = nextPoint.y - currentPoint.y
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)
    return angle + (Math.random() - 0.5) * 10 // Add ±5° variation
  }

  // Generate random size based on mix ratio: 30% small, 50% medium, 20% large
  const getRandomSize = () => {
    const rand = Math.random()
    if (rand < 0.3) return Math.random() * 10 + 30 // 30-40px (small)
    if (rand < 0.8) return Math.random() * 15 + 45 // 45-60px (medium)
    return Math.random() * 15 + 65 // 65-80px (large)
  }

  // Define natural walking paths - only edges and corners (avoid center 25-75% completely)
  const paths = [
    // Path 1: Top-left corner to bottom-right corner (edge path)
    {
      name: 'diagonal-1',
      points: generateDiagonalPath(
        { x: 3, y: 30 },
        { x: 25, y: 85 }, // Stay on left edge
        6
      )
    },
    // Path 2: Top-right corner to bottom-left corner (edge path)
    {
      name: 's-curve',
      points: generateSCurvePath(
        { x: 97, y: 28 },
        { x: 3, y: 82 }, // Stay on edges
        6
      )
    },
    // Path 3: Bottom-left corner to top-right corner (edge path)
    {
      name: 'arc',
      points: generateArcPath(
        { x: 3, y: 80 },
        { x: 97, y: 32 }, // Stay on edges
        6,
        20
      )
    },
    // Path 4: Top-right corner path
    {
      name: 'diagonal-2',
      points: generateDiagonalPath(
        { x: 75, y: 30 }, // Start from right edge
        { x: 97, y: 88 }, // Stay on right edge
        5
      )
    },
    // Path 5: Top-left corner horizontal path
    {
      name: 'horizontal-top-left',
      points: generateDiagonalPath(
        { x: 3, y: 30 },
        { x: 20, y: 32 }, // Stay on left edge
        4
      )
    },
    // Path 6: Top-right corner horizontal path
    {
      name: 'horizontal-top-right',
      points: generateDiagonalPath(
        { x: 80, y: 30 },
        { x: 97, y: 32 }, // Stay on right edge
        4
      )
    },
    // Path 7: Bottom-left corner horizontal path
    {
      name: 'horizontal-bottom-left',
      points: generateDiagonalPath(
        { x: 3, y: 85 },
        { x: 20, y: 88 }, // Stay on left edge
        4
      )
    },
    // Path 8: Bottom-right corner horizontal path
    {
      name: 'horizontal-bottom-right',
      points: generateDiagonalPath(
        { x: 80, y: 85 },
        { x: 97, y: 88 }, // Stay on right edge
        4
      )
    }
  ]

  // Generate paw prints from paths
  const pawPrints = (() => {
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

    paths.forEach((path) => {
      path.points.forEach((point, idx) => {
        const nextPoint = idx < path.points.length - 1 ? path.points[idx + 1] : null
        const baseRotation = calculateRotation(point, nextPoint, 0)
        
        // Vary spacing along path (60-120px equivalent in %)
        const spacingVariation = Math.random() * 0.5 + 0.75 // 0.75-1.25 multiplier
        
        prints.push({
          id: `${path.name}-${idx}`,
          left: point.x + (Math.random() - 0.5) * 3, // Small random offset
          top: point.y + (Math.random() - 0.5) * 3,
          size: getRandomSize(),
          rotation: baseRotation + (Math.random() - 0.5) * 10, // ±5° variation
          delay: Math.random() * 5, // Stagger fade-in over 0-5 seconds
          duration: Math.random() * 9 + 12, // 12-21 seconds for float (3x slower)
          opacity: Math.random() * 0.2 + 0.3, // 0.3-0.5 opacity
          startOffset: Math.random(), // Where in float cycle to start
        })
      })
    })

    // Add some scattered prints to fill gaps naturally (10% of total) - only edges and corners
    const scatteredCount = Math.floor(prints.length * 0.1)
    for (let i = 0; i < scatteredCount; i++) {
      // Only edges and corners - completely avoid center (25-75% horizontally, 25-75% vertically)
      let left, top
      const rand = Math.random()
      if (rand < 0.33) {
        // Left edge (0-25%)
        left = Math.random() * 25
        top = Math.random() * 100
      } else if (rand < 0.66) {
        // Right edge (75-100%)
        left = Math.random() * 25 + 75
        top = Math.random() * 100
      } else {
        // Top or bottom edge (avoid center horizontally)
        left = Math.random() < 0.5 ? Math.random() * 25 : Math.random() * 25 + 75 // 0-25% or 75-100%
        top = Math.random() < 0.5 ? Math.random() * 25 : Math.random() * 25 + 75 // 0-25% or 75-100%
      }
      
      prints.push({
        id: `scattered-${i}`,
        left,
        top,
        size: getRandomSize(),
        rotation: Math.random() * 360,
        delay: Math.random() * 5,
        duration: Math.random() * 9 + 12, // 12-21 seconds for float (3x slower)
        opacity: Math.random() * 0.2 + 0.3,
        startOffset: Math.random(),
      })
    }

    return prints
  })()

  if (!mounted) return null

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base Gradient Layer */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 20%, #DBEAFE 60%, #BFDBFE 100%)',
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

