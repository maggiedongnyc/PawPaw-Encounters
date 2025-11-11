import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with authentication support
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // Enable to handle magic link redirects
  },
})

// Authentication helper functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  return user
}

export const signInWithEmail = async (email: string) => {
  try {
    // Always use the current origin - this will be the IP address if accessed via IP,
    // or localhost if accessed via localhost, or the production domain in production
    let redirectUrl: string | undefined
    if (typeof window !== 'undefined') {
      const origin = window.location.origin
      
      // If accessing via localhost, try to detect if we should use network IP
      // For mobile testing, users should access via IP address
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        // Check if we can detect the network IP from environment or use a default
        // For now, we'll use the origin as-is but log a warning
        console.warn('⚠️ Accessing via localhost - magic link will use localhost. For mobile, access via your network IP (e.g., http://192.168.4.22:3000)')
        redirectUrl = `${origin}/auth/callback`
      } else {
        redirectUrl = `${origin}/auth/callback`
      }
      
      // Debug logging only in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔗 Magic link redirect URL:', redirectUrl)
        console.log('📍 Current origin:', origin)
        console.log('📱 For mobile: Make sure you accessed the app via', origin.includes('localhost') ? 'http://192.168.4.22:3000' : origin)
      }
    }
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
        shouldCreateUser: true,
      },
    })
    
    if (error) {
      console.error('Error sending magic link:', error)
      return { data: null, error }
    }
    
    return { data, error: null }
  } catch (err: any) {
    console.error('Exception in signInWithEmail:', err)
    return { data: null, error: err }
  }
}

export const signInWithPhone = async (phone: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms',
      },
    })
    
    if (error) {
      console.error('Error sending SMS:', error)
      return { data: null, error }
    }
    
    return { data, error: null }
  } catch (err: any) {
    console.error('Exception in signInWithPhone:', err)
    return { data: null, error: err }
  }
}

export const verifyEmailOTP = async (email: string, token: string) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'magiclink',
    })
    
    if (error) {
      console.error('Error verifying email OTP:', error)
      return { data: null, error }
    }
    
    return { data, error: null }
  } catch (err: any) {
    console.error('Exception in verifyEmailOTP:', err)
    return { data: null, error: err }
  }
}

export const verifyPhoneOTP = async (phone: string, token: string) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })
    
    if (error) {
      console.error('Error verifying phone OTP:', error)
      return { data: null, error }
    }
    
    return { data, error: null }
  } catch (err: any) {
    console.error('Exception in verifyPhoneOTP:', err)
    return { data: null, error: err }
  }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

