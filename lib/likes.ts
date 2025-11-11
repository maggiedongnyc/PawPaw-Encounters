import { supabase } from './supabase'

/**
 * Check if user has liked an encounter
 */
export async function hasUserLiked(encounterId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('Likes')
      .select('id')
      .eq('encounter_id', encounterId)
      .eq('user_id', userId)
      .single()

    if (error) {
      // If table doesn't exist, return false
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return false
      }
      // If no rows found, user hasn't liked
      if (error.code === 'PGRST116') {
        return false
      }
      console.error('Error checking like:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.warn('Error checking like:', error)
    return false
  }
}

/**
 * Like an encounter
 */
export async function likeEncounter(encounterId: string, userId: string): Promise<boolean> {
  try {
    // Check if already liked
    const alreadyLiked = await hasUserLiked(encounterId, userId)
    if (alreadyLiked) {
      return true // Already liked
    }

    const { error } = await supabase
      .from('Likes')
      .insert({
        encounter_id: encounterId,
        user_id: userId,
      })

    if (error) {
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Likes table not set up yet. Run the database schema first.')
        return false
      }
      // Check if duplicate (shouldn't happen due to UNIQUE constraint, but handle gracefully)
      if (error.code === '23505') {
        return true // Already liked
      }
      console.error('Error liking encounter:', error)
      return false
    }

    return true
  } catch (error) {
    console.warn('Error liking encounter:', error)
    return false
  }
}

/**
 * Unlike an encounter
 */
export async function unlikeEncounter(encounterId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('Likes')
      .delete()
      .eq('encounter_id', encounterId)
      .eq('user_id', userId)

    if (error) {
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Likes table not set up yet. Run the database schema first.')
        return false
      }
      console.error('Error unliking encounter:', error)
      return false
    }

    return true
  } catch (error) {
    console.warn('Error unliking encounter:', error)
    return false
  }
}

/**
 * Get like count for an encounter
 */
export async function getLikeCount(encounterId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('Likes')
      .select('*', { count: 'exact', head: true })
      .eq('encounter_id', encounterId)

    if (error) {
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        // Fallback to Encounters.likes column
        const { data } = await supabase
          .from('Encounters')
          .select('likes')
          .eq('id', encounterId)
          .single()
        
        return data?.likes || 0
      }
      console.error('Error getting like count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.warn('Error getting like count:', error)
    return 0
  }
}

