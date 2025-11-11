'use client'

import { useEffect, useState } from 'react'

interface PawTrailProps {
  trigger: boolean
}

export default function PawTrail({ trigger }: PawTrailProps) {
  const [paws, setPaws] = useState<Array<{ id: number; x: number; y: number }>>([])

  useEffect(() => {
    if (trigger) {
      const newPaws = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        x: 20 + (i * 8) + Math.random() * 5,
        y: 50 + Math.random() * 20,
      }))
      // Defer setState to avoid synchronous state update warning
      setTimeout(() => {
        setPaws(newPaws)
      }, 0)

      setTimeout(() => {
        setPaws([])
      }, 1000)
    }
  }, [trigger])

  return (
    <>
      {paws.map((paw) => (
        <div
          key={paw.id}
          className="paw-trail"
          style={{
            left: `${paw.x}%`,
            top: `${paw.y}%`,
            animationDelay: `${paw.id * 0.1}s`,
          }}
        >
          🐾
        </div>
      ))}
    </>
  )
}

