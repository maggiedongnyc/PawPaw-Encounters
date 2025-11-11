'use client'

import { useEffect, useState } from 'react'

interface ConfettiProps {
  trigger: boolean
}

export default function Confetti({ trigger }: ConfettiProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; color: string }>>([])

  useEffect(() => {
    if (trigger) {
      const colors = ['#FCD34D', '#93C5FD', '#86EFAC', '#F9A8D4', '#FBBF24', '#C4B5FD']
      const newConfetti = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      }))
      // Defer setState to avoid synchronous state update warning
      setTimeout(() => {
        setConfetti(newConfetti)
      }, 0)

      setTimeout(() => {
        setConfetti([])
      }, 3000)
    }
  }, [trigger])

  return (
    <>
      {confetti.map((item) => (
        <div
          key={item.id}
          className="confetti"
          style={{
            left: `${item.left}%`,
            backgroundColor: item.color,
            animationDelay: `${item.delay}s`,
          }}
        />
      ))}
    </>
  )
}

