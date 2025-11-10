'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmail, signInWithPhone } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface SignInProps {
  onSuccess?: () => void
}

export default function SignIn({ onSuccess }: SignInProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [method, setMethod] = useState<'email' | 'phone'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Redirect if user is already signed in
  useEffect(() => {
    if (user) {
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/')
      }
    }
  }, [user, router, onSuccess])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setMessage(null)
    setLoading(true)

    try {
      if (method === 'email') {
        if (!email.trim()) {
          setError('Please enter your email address')
          setLoading(false)
          return
        }

        const { error: signInError } = await signInWithEmail(email.trim())
        
        if (signInError) {
          setError(signInError.message || 'Failed to send magic link')
          setLoading(false)
          return
        }

        setSuccess(true)
        setMessage(`Magic link sent to ${email}! Check your email and click the link to sign in.`)
        setLoading(false)
      } else {
        if (!phone.trim()) {
          setError('Please enter your phone number')
          setLoading(false)
          return
        }

        const { error: signInError } = await signInWithPhone(phone.trim())
        
        if (signInError) {
          setError(signInError.message || 'Failed to send SMS')
          setLoading(false)
          return
        }

        setSuccess(true)
        setMessage(`SMS sent to ${phone}! Check your phone for the verification code.`)
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="font-fredoka text-4xl sm:text-5xl font-bold mb-2" style={{ color: '#5C3D2E' }}>
            🐕 PawPaw Encounters
          </h1>
          <p className="text-lg font-medium" style={{ color: '#5C3D2E' }}>
            Sign in to share your dog encounters
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-yellow-200">
          {/* Method Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setMethod('email')
                setError(null)
                setSuccess(false)
                setMessage(null)
              }}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                method === 'email'
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📧 Email
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('phone')
                setError(null)
                setSuccess(false)
                setMessage(null)
              }}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                method === 'phone'
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📱 Phone
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {method === 'email' ? (
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#5C3D2E' }}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all"
                  disabled={loading || success}
                />
              </div>
            ) : (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2" style={{ color: '#5C3D2E' }}>
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all"
                  disabled={loading || success}
                />
                <p className="mt-1 text-xs text-gray-500">Include country code (e.g., +1 for US)</p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && message && (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">{message}</p>
                {method === 'email' && (
                  <p className="text-xs text-green-700 mt-2">
                    Click the link in your email to complete sign-in. The link will open in this browser.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full px-6 py-3 text-base font-fredoka font-semibold text-white rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{
                background: loading || success
                  ? 'linear-gradient(to right, #9CA3AF, #6B7280)'
                  : 'linear-gradient(to right, #FFB500, #FFC845)',
                boxShadow: loading || success ? 'none' : '0 10px 25px rgba(255, 181, 0, 0.4)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Sending...
                </span>
              ) : success ? (
                '✓ Link Sent!'
              ) : method === 'email' ? (
                '📧 Send Magic Link'
              ) : (
                '📱 Send SMS Code'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

