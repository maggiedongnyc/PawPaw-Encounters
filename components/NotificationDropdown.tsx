'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getNotifications, markNotificationsAsRead, type NotificationWithDetails } from '@/lib/notifications'
import Link from 'next/link'
import UserDisplayName from './UserDisplayName'

interface NotificationDropdownProps {
  onClose: () => void
  onNotificationRead: () => void
}

export default function NotificationDropdown({ onClose, onNotificationRead }: NotificationDropdownProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAsRead, setMarkingAsRead] = useState<string[]>([])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    fetchNotifications()
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await getNotifications(user.id, { limit: 20 })
      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return

    // Optimistically update UI
    setMarkingAsRead((prev) => [...prev, notificationId])
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    )

    try {
      await markNotificationsAsRead(user.id, [notificationId])
      onNotificationRead()
    } catch (error) {
      console.error('Error marking notification as read:', error)
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n))
      )
      setMarkingAsRead((prev) => prev.filter((id) => id !== notificationId))
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user || notifications.length === 0) return

    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return

    // Optimistically update UI
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setMarkingAsRead((prev) => [...prev, ...unreadIds])

    try {
      await markNotificationsAsRead(user.id, unreadIds)
      onNotificationRead()
    } catch (error) {
      console.error('Error marking all as read:', error)
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) =>
          unreadIds.includes(n.id) ? { ...n, read: false } : n
        )
      )
      setMarkingAsRead((prev) => prev.filter((id) => !unreadIds.includes(id)))
    }
  }

  const getNotificationMessage = (notification: NotificationWithDetails): string => {
    const fromUserName = notification.from_user?.display_name || 'Someone'
    
    switch (notification.type) {
      case 'comment':
        return `${fromUserName} commented on your encounter`
      case 'like':
        return `${fromUserName} liked your encounter`
      case 'follow':
        return `${fromUserName} started following you`
      case 'mention':
        return `${fromUserName} mentioned you in a comment`
      default:
        return 'New notification'
    }
  }

  const getNotificationLink = (notification: NotificationWithDetails): string => {
    if (notification.encounter_id) {
      return `/encounter/${notification.encounter_id}`
    }
    if (notification.from_user_id) {
      return `/profile/${notification.from_user_id}`
    }
    return '#'
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    // Only calculate relative time on client to avoid hydration mismatches
    if (typeof window === 'undefined') {
      return date.toLocaleDateString()
    }
    
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  if (!user) {
    return null
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-600">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-600">
            No notifications yet
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={getNotificationLink(notification)}
                onClick={() => {
                  if (!notification.read) {
                    handleMarkAsRead(notification.id)
                  }
                  onClose()
                }}
                className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {notification.from_user ? (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                        {notification.from_user.avatar_url || '🐕'}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-lg">🔔</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {getNotificationMessage(notification)}
                    </p>
                    {notification.encounter && (
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {notification.encounter.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 text-center">
          <Link
            href="/notifications"
            onClick={onClose}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}

