import { supabase } from './supabase'

export interface Notification {
  id: string
  user_id: string
  type: 'comment' | 'like' | 'follow' | 'mention'
  encounter_id?: string | null
  comment_id?: string | null
  from_user_id?: string | null
  read: boolean
  created_at: string
}

export interface NotificationWithDetails extends Notification {
  encounter?: {
    id: string
    photo_url: string
    description: string
  } | null
  from_user?: {
    id: string
    display_name: string
    avatar_url: string
  } | null
}

/**
 * Create a notification
 */
export async function createNotification(
  userId: string,
  type: Notification['type'],
  options: {
    encounterId?: string
    commentId?: string
    fromUserId?: string
  } = {}
): Promise<string | null> {
  try {
    // Don't create notification if user is notifying themselves
    if (userId === options.fromUserId) {
      return null
    }

    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: userId,
      p_type: type,
      p_encounter_id: options.encounterId || null,
      p_comment_id: options.commentId || null,
      p_from_user_id: options.fromUserId || null,
    })

    if (error) {
      // Check if function or table doesn't exist
      if (error.code === '42883' || error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Notifications table or function not set up yet. Run the database schema first.')
        return null
      }
      console.error('Error creating notification:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      })
      return null
    }

    return data
  } catch (error) {
    console.warn('Error creating notification:', error)
    return null
  }
}

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userId: string,
  options: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
  } = {}
): Promise<NotificationWithDetails[]> {
  try {
    
    let query = supabase
      .from('Notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options.unreadOnly) {
      query = query.eq('read', false)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, error } = await query

    if (error) {
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Notifications table not set up yet. Run the database schema first.')
        return []
      }
      console.error('Error fetching notifications:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return []
    }


    if (!data || data.length === 0) {
      return []
    }

    // Fetch related data (encounters, users) for each notification
    const notificationsWithDetails: NotificationWithDetails[] = await Promise.all(
      data.map(async (notification) => {
        const details: NotificationWithDetails = {
          ...notification,
          encounter: null,
          from_user: null,
        }

        // Fetch encounter details if encounter_id exists
        if (notification.encounter_id) {
          const { data: encounter } = await supabase
            .from('Encounters')
            .select('id, photo_url, description')
            .eq('id', notification.encounter_id)
            .single()

          if (encounter) {
            details.encounter = encounter
          }
        }

        // Fetch from_user details if from_user_id exists
        if (notification.from_user_id) {
          const { data: profile } = await supabase
            .from('UserProfiles')
            .select('user_id, display_name, avatar_url')
            .eq('user_id', notification.from_user_id)
            .single()

          if (profile) {
            details.from_user = {
              id: profile.user_id,
              display_name: profile.display_name || `User ${profile.user_id.slice(0, 8)}`,
              avatar_url: profile.avatar_url || '🐕',
            }
          } else {
            // Fallback if no profile exists
            details.from_user = {
              id: notification.from_user_id,
              display_name: `User ${notification.from_user_id.slice(0, 8)}`,
              avatar_url: '🐕',
            }
          }
        }

        return details
      })
    )

    return notificationsWithDetails
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    // First, try the RPC function
    const { data, error } = await supabase.rpc('get_unread_notification_count', {
      p_user_id: userId,
    })

    if (error) {
      // Check if it's a "function does not exist" error (42883) or "table does not exist" error (42P01)
      if (error.code === '42883' || error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Notifications table or function not set up yet. Run the database schema first.')
        return 0
      }

      // For other errors, try fallback to direct query
      try {
        const { count, error: queryError } = await supabase
          .from('Notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('read', false)

        if (queryError) {
          // Table doesn't exist
          if (queryError.code === '42P01' || queryError.message?.includes('does not exist')) {
            console.warn('Notifications table not set up yet. Run the database schema first.')
            return 0
          }
          console.error('Error getting unread count (fallback):', queryError)
          return 0
        }

        return count || 0
      } catch (fallbackError) {
        console.warn('Notifications table not set up yet. Run the database schema first.')
        return 0
      }
    }

    return data || 0
  } catch (error) {
    // Handle any unexpected errors gracefully
    console.warn('Error getting unread count:', error)
    return 0
  }
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(
  userId: string,
  notificationIds?: string[]
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('mark_notifications_read', {
      p_user_id: userId,
      p_notification_ids: notificationIds || null,
    })

    if (error) {
      // Check if function or table doesn't exist
      if (error.code === '42883' || error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Notifications table or function not set up yet. Run the database schema first.')
        return false
      }

      // Fallback to direct update
      try {
        let query = supabase
          .from('Notifications')
          .update({ read: true })
          .eq('user_id', userId)
          .eq('read', false)

        if (notificationIds && notificationIds.length > 0) {
          query = query.in('id', notificationIds)
        }

        const { error: updateError } = await query

        if (updateError) {
          if (updateError.code === '42P01' || updateError.message?.includes('does not exist')) {
            console.warn('Notifications table not set up yet. Run the database schema first.')
            return false
          }
          console.error('Error in fallback update:', updateError)
          return false
        }
      } catch (fallbackError) {
        console.warn('Notifications table not set up yet. Run the database schema first.')
        return false
      }
    }

    return true
  } catch (error) {
    console.warn('Error marking notifications as read:', error)
    return false
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('Notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting notification:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting notification:', error)
    return false
  }
}

