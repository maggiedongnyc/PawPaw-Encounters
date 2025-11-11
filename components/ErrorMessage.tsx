'use client'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ 
  title = "Something went wrong", 
  message, 
  onRetry 
}: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <h4 className="font-semibold text-red-800 mb-2">
            {title}
          </h4>
          <p className="text-red-700 text-sm mb-4">
            {message}
          </p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="text-sm font-semibold text-red-800 hover:text-red-900 focus-visible-ring rounded px-4 py-2 bg-red-100 hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


