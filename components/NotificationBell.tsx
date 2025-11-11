'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUnreadNotificationCount } from '@/lib/notifications'
import { supabase } from '@/lib/supabase'
import NotificationDropdown from './NotificationDropdown'

export default function NotificationBell() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0)
      setLoading(false)
      return
    }

    try {
      const count = await getUnreadNotificationCount(user.id)
      console.log('Notification unread count:', count, 'for user:', user.id)
      setUnreadCount(count)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      setLoading(false)
      return
    }

    fetchUnreadCount()

    // Set up real-time subscription for notifications
    // Use unique channel name to prevent conflicts
    const channelName = `notifications-${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New notification received via real-time:', payload)
          console.log('Notification data:', payload.new)
          // Refresh unread count when new notification arrives
          fetchUnreadCount()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Notification updated via real-time:', payload)
          // Refresh unread count when notification is marked as read
          fetchUnreadCount()
        }
      )
      .subscribe((status, err) => {
        console.log('Notification subscription status:', status)
        if (err) {
          console.error('Notification subscription error:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to notifications for user:', user.id)
        } else if (status === 'CLOSED') {
          console.warn('Notification subscription closed. Attempting to resubscribe...')
          // Try to resubscribe after a delay
          setTimeout(() => {
            fetchUnreadCount()
          }, 2000)
        }
      })

    return () => {
      channel.unsubscribe().then(() => {
        supabase.removeChannel(channel)
      }).catch((err) => {
        console.warn('Error unsubscribing from notifications channel:', err)
        supabase.removeChannel(channel)
      })
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (!user) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
          onNotificationRead={() => fetchUnreadCount()}
        />
      )}
    </div>
  )
}

