import { supabase } from './supabase'

export interface UserProfile {
  id: string
  user_id: string
  username?: string | null
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  favorite_breeds?: string[] | null
  location?: string | null
  website?: string | null
  created_at: string
  updated_at: string
}

export interface UserStatistics {
  user_id: string
  total_encounters: number
  total_comments: number
  total_likes_received: number
  total_badges: number
  last_encounter_at?: string | null
  first_encounter_at?: string | null
}

export interface ProfileWithStats extends UserProfile {
  statistics?: UserStatistics
}

/**
 * Get user profile by user ID
 * Creates a profile if it doesn't exist
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    if (!userId) {
      console.warn('getUserProfile: userId is required')
      return null
    }

    // First, try to get existing profile
    let { data, error } = await supabase
      .from('UserProfiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    // If profile doesn't exist (PGRST116 = no rows returned), create one
    if (error) {
      // Check if table doesn't exist (42P01) or other schema errors
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('UserProfiles table does not exist. Please run the database schema first.')
        // Return a minimal profile object so the app doesn't break
        return {
          id: '',
          user_id: userId,
          username: null,
          display_name: `User ${userId.slice(0, 8)}`,
          bio: null,
          avatar_url: null,
          favorite_breeds: null,
          location: null,
          website: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }

      // If profile doesn't exist (PGRST116), try to create it
      if (error.code === 'PGRST116') {
        try {
          const { data: newProfile, error: createError } = await supabase
            .from('UserProfiles')
            .insert({
              user_id: userId,
              display_name: `User ${userId.slice(0, 8)}`
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating profile:', createError)
            // If insert fails (maybe table doesn't exist), return minimal profile
            if (createError.code === '42P01' || createError.message?.includes('does not exist')) {
              return {
                id: '',
                user_id: userId,
                username: null,
                display_name: `User ${userId.slice(0, 8)}`,
                bio: null,
                avatar_url: null,
                favorite_breeds: null,
                location: null,
                website: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            }
            return null
          }

          return newProfile
        } catch (createErr) {
          console.error('Exception creating profile:', createErr)
          // Return minimal profile on any error
          return {
            id: '',
            user_id: userId,
            username: null,
            display_name: `User ${userId.slice(0, 8)}`,
            bio: null,
            avatar_url: null,
            favorite_breeds: null,
            location: null,
            website: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      // Other errors
      console.error('Error getting profile:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return null
    }

    return data
  } catch (error) {
    console.error('Exception in getUserProfile:', error)
    // Return minimal profile on any exception
    return {
      id: '',
      user_id: userId,
      username: null,
      display_name: `User ${userId.slice(0, 8)}`,
      bio: null,
      avatar_url: null,
      favorite_breeds: null,
      location: null,
      website: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
}

/**
 * Get user profile by username
 */
export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('UserProfiles')
      .select('*')
      .eq('username', username)
      .single()

    if (error) {
      console.error('Error getting profile by username:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserProfileByUsername:', error)
    return null
  }
}

/**
 * Get user statistics
 */
export async function getUserStatistics(userId: string): Promise<UserStatistics | null> {
  try {
    if (!userId) {
      return {
        user_id: userId || '',
        total_encounters: 0,
        total_comments: 0,
        total_likes_received: 0,
        total_badges: 0,
        last_encounter_at: null,
        first_encounter_at: null
      }
    }

    const { data, error } = await supabase
      .from('UserStatistics')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // If view doesn't exist, return default stats
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('UserStatistics view does not exist. Please run the database schema first.')
        return {
          user_id: userId,
          total_encounters: 0,
          total_comments: 0,
          total_likes_received: 0,
          total_badges: 0,
          last_encounter_at: null,
          first_encounter_at: null
        }
      }

      // If no statistics found, return default stats
      if (error.code === 'PGRST116') {
        return {
          user_id: userId,
          total_encounters: 0,
          total_comments: 0,
          total_likes_received: 0,
          total_badges: 0,
          last_encounter_at: null,
          first_encounter_at: null
        }
      }
      console.error('Error getting statistics:', {
        code: error.code,
        message: error.message,
        details: error.details
      })
      // Return default stats on error
      return {
        user_id: userId,
        total_encounters: 0,
        total_comments: 0,
        total_likes_received: 0,
        total_badges: 0,
        last_encounter_at: null,
        first_encounter_at: null
      }
    }

    return data
  } catch (error) {
    console.error('Exception in getUserStatistics:', error)
    // Return default stats on exception
    return {
      user_id: userId || '',
      total_encounters: 0,
      total_comments: 0,
      total_likes_received: 0,
      total_badges: 0,
      last_encounter_at: null,
      first_encounter_at: null
    }
  }
}

/**
 * Get user profile with statistics
 * Also calculates statistics directly from tables if view doesn't exist
 */
export async function getUserProfileWithStats(userId: string): Promise<ProfileWithStats | null> {
  try {
    const [profile, statistics] = await Promise.all([
      getUserProfile(userId),
      getUserStatistics(userId)
    ])

    if (!profile) return null

    // Always calculate statistics directly from tables for accuracy
    // The view might be outdated or incorrect, so we'll use direct queries
    let finalStats = statistics
    try {
      const [encountersResult, commentsResult, badgesResult] = await Promise.all([
        supabase
          .from('Encounters')
          .select('id, likes, created_at')
          .eq('user_id', userId),
        supabase
          .from('Comments')
          .select('id')
          .eq('user_id', userId),
        supabase
          .from('Badges')
          .select('id')
          .eq('user_id', userId)
      ])

      // Check for errors in queries
      if (encountersResult.error && encountersResult.error.code !== 'PGRST116') {
        console.warn('Error fetching encounters for stats:', encountersResult.error)
      }
      if (commentsResult.error && commentsResult.error.code !== 'PGRST116') {
        console.warn('Error fetching comments for stats:', commentsResult.error)
      }
      if (badgesResult.error && badgesResult.error.code !== 'PGRST116') {
        console.warn('Error fetching badges for stats:', badgesResult.error)
      }

      const encounters = encountersResult.data || []
      const comments = commentsResult.data || []
      const badges = badgesResult.data || []

      const totalLikes = encounters.reduce((sum, e) => sum + (e.likes || 0), 0)
      const encounterDates = encounters.map(e => e.created_at).filter(Boolean) as string[]
      const lastEncounter = encounterDates.length > 0 ? encounterDates.sort().reverse()[0] : null
      const firstEncounter = encounterDates.length > 0 ? encounterDates.sort()[0] : null

      // Use directly calculated stats (more accurate)
      finalStats = {
        user_id: userId,
        total_encounters: encounters.length,
        total_comments: comments.length,
        total_likes_received: totalLikes,
        total_badges: badges.length,
        last_encounter_at: lastEncounter,
        first_encounter_at: firstEncounter
      }
    } catch (calcError) {
      console.warn('Error calculating statistics directly, using view data:', calcError)
      // Fall back to view statistics if direct calculation fails
    }

    return {
      ...profile,
      statistics: finalStats || undefined
    }
  } catch (error) {
    console.error('Error in getUserProfileWithStats:', error)
    return null
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<UserProfile | null> {
  try {
    // Ensure profile exists first
    await getUserProfile(userId)

    const { data, error } = await supabase
      .from('UserProfiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateUserProfile:', error)
    return null
  }
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('UserProfiles')
      .select('id')
      .eq('username', username)
      .limit(1)

    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error checking username:', error)
      return false
    }

    return !data || data.length === 0
  } catch (error) {
    console.error('Error in isUsernameAvailable:', error)
    return false
  }
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('dog-photos') // Using existing bucket, or create 'avatars' bucket
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true
      })

    if (error) {
      console.error('Error uploading avatar:', error)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('dog-photos')
      .getPublicUrl(data.path)

    return publicUrl
  } catch (error) {
    console.error('Error in uploadAvatar:', error)
    return null
  }
}

/**
 * Get display name for a user
 * Returns username, display_name, or fallback
 */
export function getDisplayName(profile: UserProfile | null, userId?: string): string {
  if (!profile) {
    return userId ? `User ${userId.slice(0, 8)}` : 'Anonymous User'
  }

  return profile.username || profile.display_name || `User ${profile.user_id.slice(0, 8)}`
}

/**
 * Get avatar URL for a user
 * Returns avatar_url or default avatar
 */
export function getAvatarUrl(profile: UserProfile | null): string {
  if (profile?.avatar_url) {
    return profile.avatar_url
  }

  // Default avatar based on user ID (consistent across sessions)
  const avatars = ['🐕', '🐕‍🦺', '🦮', '🐩', '🐶', '🐾', '🦴']
  const index = profile?.user_id ? profile.user_id.charCodeAt(0) % avatars.length : 0
  // For now, return emoji as text. In future, could return URL to generated avatar image
  return avatars[index]
}

