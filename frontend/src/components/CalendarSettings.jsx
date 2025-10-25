import React, { useState, useEffect } from 'react'
import { CalendarDaysIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useToast } from '../contexts/ToastContext'
import { getFullURL, getFetchOptions } from '../utils/apiUrl'

function CalendarSettings({ currentUser }) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold hebrew-text mb-2" style={{ color: 'var(--color-text-primary)' }}>
          חיבור ליומן Google
        </h3>
        <p className="text-sm hebrew-text" style={{ color: 'var(--color-text-description)' }}>
          חבר את היומן שלך כדי לסנכרן משימות עם Google Calendar
        </p>
      </div>

      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 rounded-xl border" style={{ 
        backgroundColor: isConnected ? 'var(--color-secondary-hover)' : 'var(--color-main-bg)',
        borderColor: 'var(--color-secondary-hover)'
      }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ 
            backgroundColor: isConnected ? 'var(--color-selected-icon)' : 'var(--color-secondary-hover)' 
          }}>
            {isConnected ? (
              <CheckCircleIcon className="w-6 h-6 text-white" />
            ) : (
              <CalendarDaysIcon className="w-6 h-6" style={{ color: 'var(--color-text-description)' }} />
            )}
          </div>
          <div>
            <p className="hebrew-text font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {isConnected ? 'היומן מחובר' : 'היומן לא מחובר'}
            </p>
            <p className="text-sm hebrew-text" style={{ color: 'var(--color-text-description)' }}>
              {isConnected ? 'המשימות מסונכרנות עם Google Calendar' : 'חבר את היומן שלך להתחיל'}
            </p>
          </div>
        </div>

        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hebrew-text font-medium flex items-center gap-2"
            style={{ backgroundColor: 'var(--color-selected-icon)', color: 'white' }}
            onMouseEnter={(e) => {
              if (!e.target.disabled) {
                e.target.style.opacity = '0.9'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '1'
            }}
          >
            <CalendarDaysIcon className="w-5 h-5" />
            {isLoading ? 'מתחבר...' : 'התחבר ליומן'}
          </button>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="px-4 py-2 rounded-lg transition-all hebrew-text font-medium flex items-center gap-2"
              style={{ 
                backgroundColor: 'var(--color-selected-icon)', 
                color: 'white' 
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              <ArrowPathIcon className="w-5 h-5" />
              אפשרויות
            </button>

            {showMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />

                {/* Menu */}
                <div className="absolute left-0 mt-2 w-64 rounded-xl shadow-lg border z-50 overflow-hidden" style={{ 
                  backgroundColor: 'var(--color-main-bg)',
                  borderColor: 'var(--color-secondary-hover)'
                }}>
                  <button
                    onClick={handleSyncAll}
                    disabled={isLoading}
                    className="w-full text-right px-4 py-3 transition-colors hebrew-text text-sm border-b disabled:opacity-50"
                    style={{ 
                      color: 'var(--color-text-primary)',
                      borderColor: 'var(--color-secondary-hover)'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-secondary-hover)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    📤 שלח משימות ליומן Google
                  </button>
                  
                  <button
                    onClick={handleDisconnect}
                    disabled={isLoading}
                    className="w-full text-right px-4 py-3 transition-colors hebrew-text text-sm disabled:opacity-50"
                    style={{ color: 'var(--color-selected-icon)' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-secondary-hover)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    נתק יומן
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-secondary-hover)' }}>
        <h4 className="hebrew-text font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          מה קורה כשמחברים את היומן?
        </h4>
        <ul className="space-y-1 text-sm hebrew-text" style={{ color: 'var(--color-text-description)' }}>
          <li>• המשימות שלך מסונכרנות עם Google Calendar</li>
          <li>• תוכל לראות את המשימות ישירות ביומן</li>
          <li>• שינויים ביומן יעודכנו גם כאן</li>
        </ul>
      </div>
    </div>
  )
}

export default CalendarSettings
