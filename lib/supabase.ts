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
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
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

