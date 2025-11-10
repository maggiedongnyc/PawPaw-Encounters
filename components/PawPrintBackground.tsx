'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface PawPrint {
  id: number
  left: number
  top: number
  size: number
  opacity: number
  delay: number
  duration: number
  direction: 'left' | 'right' | 'up' | 'down' | 'diagonal'
  rotation: number
}

export default function PawPrintBackground() {
  const [pawPrints, setPawPrints] = useState<PawPrint[]>([])
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    // Generate paw prints evenly distributed across the background
    const generatePawPrints = () => {
      const prints: PawPrint[] = []
      const directions: Array<'left' | 'right' | 'up' | 'down' | 'diagonal'> = ['left', 'right', 'up', 'down', 'diagonal']
      
      // Create a grid for even distribution
      const cols = 6
      const rows = 5
      const colSpacing = 100 / (cols + 1)
      const rowSpacing = 100 / (rows + 1)
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const id = row * cols + col
          prints.push({
            id,
            left: (col + 1) * colSpacing + (Math.random() - 0.5) * 3, // Small random offset
            top: (row + 1) * rowSpacing + (Math.random() - 0.5) * 3, // Small random offset
            size: 40 + Math.random() * 30, // 40px to 70px
            opacity: 1, // Solid black, no transparency
            delay: Math.random() * 5, // 0 to 5 seconds
            duration: 20 + Math.random() * 20, // 20 to 40 seconds
            direction: directions[Math.floor(Math.random() * directions.length)],
            rotation: Math.random() * 360, // Random rotation 0-360 degrees
          })
        }
      }
      
      setPawPrints(prints)
    }

    generatePawPrints()
  }, [])

  const getAnimationClass = (direction: string) => {
    switch (direction) {
      case 'left':
        return 'animate-paw-left'
      case 'right':
        return 'animate-paw-right'
      case 'up':
        return 'animate-paw-up'
      case 'down':
        return 'animate-paw-down'
      case 'diagonal':
        return 'animate-paw-diagonal'
      default:
        return 'animate-paw-diagonal'
    }
  }

  return (
    <div className="paw-background-container">
      {pawPrints.map((paw) => (
        <div
          key={paw.id}
          className={`absolute ${getAnimationClass(paw.direction)}`}
          style={{
            left: `${paw.left}%`,
            top: `${paw.top}%`,
            width: `${paw.size}px`,
            height: `${paw.size}px`,
            opacity: paw.opacity,
            animationDelay: `${paw.delay}s`,
            animationDuration: `${paw.duration}s`,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear',
            willChange: 'transform, opacity',
            transformOrigin: 'center center',
          }}
        >
          {/* Use the uploaded paw print image */}
          <div
            className="w-full h-full"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M12 20C10.5 20 9.5 19 9 17.5C8.5 16 8.5 14.5 9 13C9.5 11.5 10.5 10.5 12 10.5C13.5 10.5 14.5 11.5 15 13C15.5 14.5 15.5 16 15 17.5C14.5 19 13.5 20 12 20Z\' fill=\'%23000000\'/%3E%3Cellipse cx=\'7\' cy=\'8\' rx=\'2\' ry=\'2.5\' fill=\'%23000000\' transform=\'rotate(-15 7 8)\'/%3E%3Cellipse cx=\'9.5\' cy=\'6\' rx=\'2.2\' ry=\'3\' fill=\'%23000000\' transform=\'rotate(-5 9.5 6)\'/%3E%3Cellipse cx=\'14.5\' cy=\'6\' rx=\'2.2\' ry=\'3\' fill=\'%23000000\' transform=\'rotate(5 14.5 6)\'/%3E%3Cellipse cx=\'17\' cy=\'8\' rx=\'2\' ry=\'2.5\' fill=\'%23000000\' transform=\'rotate(15 17 8)\'/%3E%3C/svg%3E")',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              transform: `rotate(${paw.rotation}deg)`,
              transformOrigin: 'center center',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            }}
          />
        </div>
      ))}
    </div>
  )
}
