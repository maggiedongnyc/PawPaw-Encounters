'use client'

interface ProgressBarProps {
  current: number
  target: number
  label: string
}

export default function ProgressBar({ current, target, label }: ProgressBarProps) {
  const percentage = Math.min((current / target) * 100, 100)
  const paws = Math.floor(percentage / 10)

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{current} / {target}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 via-blue-400 to-green-400 transition-all duration-500 ease-out paw-progress"
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-600">
            {'🐾'.repeat(paws)}
          </span>
        </div>
      </div>
    </div>
  )
}

