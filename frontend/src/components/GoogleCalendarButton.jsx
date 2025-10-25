import React, { useState, useEffect } from 'react'
import { CalendarDaysIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useToast } from '../contexts/ToastContext'
import { getFullURL, getFetchOptions } from '../utils/apiUrl'

function GoogleCalendarButton({ currentUser }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const { showSuccess, showError } = useToast()

  // Check calendar connection status on mount
  useEffect(() => {
    checkCalendarStatus()
  }, [currentUser])

  // Check for calendar connection callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const calendarConnected = urlParams.get('calendar_connected')
    const calendarError = urlParams.get('calendar_error')

    if (calendarConnected === 'true') {
      showSuccess('היומן חובר בהצלחה! 🎉')
      setIsConnected(true)
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    } else if (calendarError) {
      showError('שגיאה בחיבור ליומן')
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const checkCalendarStatus = async () => {
    try {
      const response = await fetch(getFullURL('/api/calendar/status/'), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      setIsConnected(data.connected)
    } catch (error) {
      console.error('Error checking calendar status:', error)
    }
  }

  const handleConnect = async () => {
    setIsLoading(true)
    console.log('Starting calendar connection...')
    try {
      console.log('Fetching calendar connect endpoint...')
      const response = await fetch(getFullURL('/api/calendar/connect/'), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      const data = await response.json()
      console.log('Response data:', data)

      if (data.success && data.authorization_url) {
        console.log('Redirecting to Google OAuth...')
        // Redirect to Google OAuth
        window.location.href = data.authorization_url
      } else {
        console.error('Calendar connect failed:', data)
        showError('שגיאה בהתחברות ליומן')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error connecting calendar:', error)
      showError('שגיאה בהתחברות ליומן Google')
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('האם אתה בטוח שברצונך לנתק את היומן?')) {
      return
    }

    setIsLoading(true)
    try {
      // Get CSRF token first
      const csrfResponse = await fetch(getFullURL('/api/csrf-token/'), {
        method: 'GET',
        credentials: 'include'
      })
      
      let csrfToken = null
      if (csrfResponse.ok) {
        const csrfData = await csrfResponse.json()
        csrfToken = csrfData.csrfToken
      }

      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
      
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken
      }

      const response = await fetch(getFullURL('/api/calendar/disconnect/'), {
        method: 'POST',
        credentials: 'include',
        headers
      })

      const data = await response.json()

      if (data.success) {
        showSuccess('היומן נותק בהצלחה')
        setIsConnected(false)
        setShowMenu(false)
      } else {
        showError('שגיאה בניתוק היומן')
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error)
      showError('שגיאה בניתוק היומן')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncAll = async () => {
    setIsLoading(true)
    setShowMenu(false)
    
    try {
      // Get CSRF token first
      const csrfResponse = await fetch(getFullURL('/api/csrf-token/'), {
        method: 'GET',
        credentials: 'include'
      })
      
      let csrfToken = null
      if (csrfResponse.ok) {
        const csrfData = await csrfResponse.json()
        csrfToken = csrfData.csrfToken
      }
      
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
      
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken
      }
      
      const response = await fetch(getFullURL('/api/calendar/sync-all/'), {
        method: 'POST',
        credentials: 'include',
        headers
      })

      const data = await response.json()

      if (response.ok && data.success) {
        showSuccess(`סונכרנו ${data.synced_count} משימות ליומן! 📅`)
      } else {
        console.error('Sync failed:', response.status, data)
        showError(data.error || `שגיאה בסנכרון משימות (${response.status})`)
      }
    } catch (error) {
      console.error('Error syncing tasks:', error)
      showError('שגיאה בחיבור לשרת')
    } finally {
      setIsLoading(false)
    }
  }


  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors hebrew-text text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        title="התחבר ליומן Google שלך"
      >
        <CalendarDaysIcon className="w-5 h-5" />
        {isLoading ? 'מתחבר...' : 'התחבר ליומן שלך'}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors hebrew-text text-sm font-medium text-green-700 dark:text-green-300"
        title="היומן מחובר"
      >
        <CheckCircleIcon className="w-5 h-5" />
        <span>יומן מחובר</span>
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            <button
              onClick={handleSyncAll}
              disabled={isLoading}
              className="w-full text-right px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors hebrew-text text-sm text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 disabled:opacity-50"
            >
              📤 שלח משימות ליומן Google
            </button>
            
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="w-full text-right px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors hebrew-text text-sm text-red-600 dark:text-red-400 disabled:opacity-50"
            >
              נתק יומן
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default GoogleCalendarButton

