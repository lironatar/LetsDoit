import { XMarkIcon, CheckIcon, XCircleIcon, BellIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { notificationAPI } from '../services/api'
import { useToast } from '../contexts/ToastContext'

function NotificationInbox({ isOpen, onClose, onProjectUpdate }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const data = await notificationAPI.getNotifications()
      setNotifications(data)
    } catch (error) {
      console.error('Failed to load notifications:', error)
      showError('שגיאה בטעינת התראות')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (notificationId) => {
    try {
      await notificationAPI.markRead(notificationId)
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleAcceptShare = async (notification) => {
    try {
      const result = await notificationAPI.acceptShare(notification.id)
      showSuccess('הפרויקט נוסף לרשימת הפרויקטים שלך')
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
      if (onProjectUpdate) {
        onProjectUpdate()
      }
    } catch (error) {
      console.error('Failed to accept share:', error)
      showError('שגיאה בקבלת שיתוף הפרויקט')
    }
  }

  const handleDeclineShare = async (notification) => {
    try {
      await notificationAPI.declineShare(notification.id)
      showSuccess('בקשת השיתוף נדחתה')
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    } catch (error) {
      console.error('Failed to decline share:', error)
      showError('שגיאה בדחיית שיתוף הפרויקט')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      showSuccess('כל ההתראות סומנו כנקראו')
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      showError('שגיאה בסימון התראות')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'עכשיו'
    if (minutes < 60) return `לפני ${minutes} דקות`
    if (hours < 24) return `לפני ${hours} שעות`
    if (days < 7) return `לפני ${days} ימים`
    return date.toLocaleDateString('he-IL')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" dir="rtl">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-30" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold hebrew-text">התראות</h2>
          <div className="flex items-center space-x-2 space-x-reverse">
            {notifications.some(n => !n.is_read) && (
              <button
                onClick={handleMarkAllRead}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                סמן הכל כנקרא
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 hebrew-text">אין התראות חדשות</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.is_read
                      ? 'bg-white border-gray-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => !notification.is_read && handleMarkRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 space-x-reverse mb-1">
                        {notification.related_user_avatar && (
                          <img
                            src={notification.related_user_avatar}
                            alt={notification.related_user_name}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <h3 className="font-semibold hebrew-text">{notification.title}</h3>
                      </div>
                      <p className="text-gray-700 hebrew-text mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-500">{formatDate(notification.created_at)}</p>
                    </div>

                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>

                  {/* Action buttons for share requests */}
                  {notification.notification_type === 'project_share' && !notification.is_read && (
                    <div className="flex space-x-2 space-x-reverse mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAcceptShare(notification)
                        }}
                        className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckIcon className="w-5 h-5" />
                        <span>קבל</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeclineShare(notification)
                        }}
                        className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        <XCircleIcon className="w-5 h-5" />
                        <span>דחה</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationInbox

