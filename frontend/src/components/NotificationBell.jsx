import { BellIcon } from '@heroicons/react/24/outline'
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid'
import { useState, useEffect } from 'react'
import { notificationAPI } from '../services/api'

function NotificationBell({ onClick }) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadUnreadCount()
    // Poll every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadUnreadCount = async () => {
    try {
      const data = await notificationAPI.getUnreadCount()
      setUnreadCount(data.count)
    } catch (error) {
      console.error('Failed to load unread count:', error)
    }
  }

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-secondary-hover transition-colors"
    >
      {unreadCount > 0 ? (
        <BellSolidIcon className="w-6 h-6 text-red-500" />
      ) : (
        <BellIcon className="w-6 h-6 text-gray-500" />
      )}
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}

export default NotificationBell

