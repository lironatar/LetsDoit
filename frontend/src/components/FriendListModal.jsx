import React, { useState, useEffect } from 'react'
import { XMarkIcon, UserGroupIcon, UserPlusIcon, CheckIcon, XCircleIcon, TrashIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { friendAPI } from '../services/api'
import { getFullURL, getFetchOptions } from '../utils/apiUrl'

function FriendListModal({ isOpen, onClose }) {
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [activeTab, setActiveTab] = useState('friends') // 'friends', 'requests', or 'sent'
  const [newFriendEmail, setNewFriendEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      loadFriends()
      loadPendingRequests()
      loadSentRequests()
    } else {
      setIsAnimating(false)
    }
  }, [isOpen])

  const loadFriends = async () => {
    try {
      const data = await friendAPI.getFriends()
      setFriends(data)
    } catch (err) {
      console.error('Failed to load friends:', err)
    }
  }

  const loadPendingRequests = async () => {
    try {
      console.log('📥 Loading pending requests...')
      const data = await friendAPI.getPendingRequests()
      console.log('📥 Pending requests received from API:', data)
      console.log('📥 Number of pending requests:', data.length)
      if (data.length > 0) {
        console.log('📥 First pending request:', data[0])
      } else {
        console.log('⚠️ No pending requests found')
      }
      setPendingRequests(data)
      console.log('📥 State updated with', data.length, 'pending requests')
    } catch (err) {
      console.error('❌ Failed to load pending requests:', err)
      console.error('Error details:', err.response?.data)
    }
  }

  const loadSentRequests = async () => {
    try {
      const data = await friendAPI.getSentRequests()
      console.log('📤 Loaded sent requests:', data)
      setSentRequests(data)
    } catch (err) {
      console.error('Failed to load sent requests:', err)
    }
  }

  const handleSendRequest = async (e) => {
    e.preventDefault()
    if (!newFriendEmail.trim()) return

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await friendAPI.sendRequest(newFriendEmail.trim())
      
      console.log('Friend request result:', result)
      
      // Check if this is an invitation (not existing user)
      if (result.is_invitation) {
        setSuccess(result.message || 'הזמנה נשלחה בהצלחה! הם יקבלו הודעה בדוא"ל')
      } else {
        setSuccess(result.message || 'בקשת חברות נשלחה בהצלחה!')
      }
      
      setNewFriendEmail('')
      // Refresh all data after sending
      await loadFriends()
      await loadPendingRequests()
      await loadSentRequests()
      setTimeout(() => setSuccess(''), 5000) // Longer timeout for invitation messages
    } catch (err) {
      console.error('Friend request error:', err)
      console.error('Error response:', err.response?.data)
      const errorMsg = err.response?.data?.error || 'שגיאה בשליחת בקשת חברות'
      const migrationNeeded = err.response?.data?.migration_needed
      
      if (migrationNeeded) {
        setError('מערכת ההזמנות טרם הופעלה. יש להריץ את המיגרציה של המסד נתונים.')
      } else {
        setError(errorMsg)
      }
      
      setTimeout(() => setError(''), 7000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await friendAPI.acceptRequest(friendshipId)
      await loadFriends()
      await loadPendingRequests()
      setSuccess('בקשת חברות אושרה!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('שגיאה באישור בקשת חברות')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleDeclineRequest = async (friendshipId) => {
    try {
      await friendAPI.declineRequest(friendshipId)
      await loadPendingRequests()
      setSuccess('בקשת חברות נדחתה')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('שגיאה בדחיית בקשת חברות')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleRemoveFriend = async (friendshipId) => {
    if (!confirm('האם אתה בטוח שברצונך להסיר חבר זה?')) return

    try {
      await friendAPI.deleteFriend(friendshipId)
      await loadFriends()
      setSuccess('החבר הוסר בהצלחה')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('שגיאה בהסרת חבר')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleDebugFriendships = async () => {
    try {
      const data = await friendAPI.debugFriendships()
      setDebugInfo(JSON.stringify(data, null, 2))
      setTimeout(() => setDebugInfo(''), 10000)
    } catch (err) {
      setError('שגיאה בקבלת מידע דיבוג')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleClearPending = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את כל הבקשות הממתינות?')) return

    try {
      const data = await friendAPI.clearPending()
      setSuccess(data.message)
      await loadPendingRequests()
      await loadSentRequests()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('שגיאה במחיקת בקשות')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleCheckDatabaseStatus = async () => {
    try {
      // Try the simple DB check first (no auth required)
      const response = await fetch(getFullURL('/api/db-check/'), getFetchOptions())
      
      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)
      
      if (!response.ok) {
        const text = await response.text()
        console.error('Response text:', text)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Database status response:', data)
      setDebugInfo(JSON.stringify(data, null, 2))
      setTimeout(() => setDebugInfo(''), 15000)
    } catch (err) {
      console.error('Database status check error:', err)
      setError(`שגיאה בבדיקת סטטוס מסד הנתונים: ${err.message}`)
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleDebugAllFriends = async () => {
    try {
      const response = await fetch(getFullURL('/api/friends/debug_all_friends/'), getFetchOptions())
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('All friends debug:', data)
      setDebugInfo(JSON.stringify(data, null, 2))
      setTimeout(() => setDebugInfo(''), 15000)
    } catch (err) {
      console.error('Debug all friends error:', err)
      setError(`שגיאה בבדיקת כל החברים: ${err.message}`)
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleTestRegistration = async () => {
    try {
      const response = await fetch(getFullURL('/api/friends/test_registration_logic/'), getFetchOptions())
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Registration test result:', data)
      setDebugInfo(JSON.stringify(data, null, 2))
      setTimeout(() => setDebugInfo(''), 15000)
    } catch (err) {
      console.error('Registration test error:', err)
      setError(`שגיאה בבדיקת רישום: ${err.message}`)
      setTimeout(() => setError(''), 5000)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className={`fixed inset-0 bg-black flex items-center justify-center z-[9999] transition-opacity duration-200 ${
        isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'
      }`}
      onClick={onClose}
    >
      <div 
        className={`rounded-2xl shadow-2xl w-[600px] max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{ backgroundColor: 'var(--color-main-bg)' }} 
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-5 border-b" style={{ borderColor: 'var(--color-secondary-hover)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-secondary-hover)' }}>
              <UserGroupIcon className="w-6 h-6 text-selected-icon" />
            </div>
            <h2 className="text-xl font-bold hebrew-text" style={{ color: 'var(--color-text-primary)' }}>רשימת חברים</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg transition-all"
            style={{ 
              backgroundColor: 'transparent',
              color: 'var(--color-text-description)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--color-secondary-hover)'
              e.target.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.transform = 'scale(1)'
            }}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 hebrew-text text-sm flex items-start gap-3 animate-fade-in">
            <CheckIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 hebrew-text text-sm flex items-start gap-3 animate-fade-in">
            <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Add Friend Form */}
        <div className="p-6 pb-4 border-b" style={{ borderColor: 'var(--color-secondary-hover)' }}>
          <form onSubmit={handleSendRequest} className="flex gap-3">
            <div className="flex-1 relative">
              <EnvelopeIcon className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="email"
                value={newFriendEmail}
                onChange={(e) => setNewFriendEmail(e.target.value)}
                placeholder="הזן אימייל של חבר..."
                className="w-full pl-3 pr-10 py-2.5 border rounded-lg focus:outline-none hebrew-text text-base transition-all"
                style={{ 
                  color: 'var(--color-text-primary)',
                  backgroundColor: 'var(--color-main-bg)',
                  borderColor: 'var(--color-secondary-hover)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-selected-icon)'
                  e.target.style.boxShadow = `0 0 0 3px rgba(64, 115, 255, 0.1)`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-secondary-hover)'
                  e.target.style.boxShadow = 'none'
                }}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !newFriendEmail.trim()}
              className="px-5 py-2.5 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hebrew-text font-medium flex items-center gap-2 shadow-sm"
              style={{ backgroundColor: 'var(--color-selected-icon)' }}
              onMouseEnter={(e) => {
                if (!e.target.disabled) {
                  e.target.style.transform = 'translateY(-1px)'
                  e.target.style.boxShadow = '0 4px 12px rgba(64, 115, 255, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = ''
              }}
            >
              <UserPlusIcon className="w-5 h-5" />
              הוסף חבר
            </button>
          </form>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6 pt-2" style={{ borderColor: 'var(--color-secondary-hover)' }}>
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-3 hebrew-text font-medium transition-all relative ${
              activeTab === 'friends'
                ? 'border-b-2'
                : 'hover:bg-secondary-hover'
            }`}
            style={activeTab === 'friends' ? { 
              color: 'var(--color-selected-icon)', 
              borderBottomColor: 'var(--color-selected-icon)' 
            } : { color: 'var(--color-text-description)' }}
          >
            <span>חברים</span>
            {friends.length > 0 && (
              <span className="mr-2 px-2 py-0.5 rounded-full text-xs" style={{ 
                backgroundColor: activeTab === 'friends' ? 'var(--color-selected-icon)' : 'var(--color-secondary)', 
                color: 'white' 
              }}>
                {friends.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-3 hebrew-text font-medium transition-all relative ${
              activeTab === 'requests'
                ? 'border-b-2'
                : 'hover:bg-secondary-hover'
            }`}
            style={activeTab === 'requests' ? { 
              color: 'var(--color-selected-icon)', 
              borderBottomColor: 'var(--color-selected-icon)' 
            } : { color: 'var(--color-text-description)' }}
          >
            <span>בקשות ממתינות</span>
            {pendingRequests.length > 0 && (
              <span className="mr-2 px-2 py-0.5 rounded-full text-xs bg-red-500 text-white animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-3 hebrew-text font-medium transition-all ${
              activeTab === 'sent'
                ? 'border-b-2'
                : 'hover:bg-secondary-hover'
            }`}
            style={activeTab === 'sent' ? { 
              color: 'var(--color-selected-icon)', 
              borderBottomColor: 'var(--color-selected-icon)' 
            } : { color: 'var(--color-text-description)' }}
          >
            <span>בקשות שנשלחו</span>
            {sentRequests.length > 0 && (
              <span className="mr-2 px-2 py-0.5 rounded-full text-xs" style={{ 
                backgroundColor: activeTab === 'sent' ? 'var(--color-selected-icon)' : 'var(--color-secondary)', 
                color: 'white' 
              }}>
                {sentRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'friends' && (
            <div className="space-y-3">
              {friends.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--color-secondary-hover)' }}>
                    <UserGroupIcon className="w-10 h-10" style={{ color: 'var(--color-text-description)', opacity: 0.5 }} />
                  </div>
                  <p className="hebrew-text text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>אין לך חברים עדיין</p>
                  <p className="hebrew-text text-sm" style={{ color: 'var(--color-text-description)', opacity: 0.7 }}>הוסף חברים באמצעות האימייל שלהם</p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-4 rounded-xl transition-all border"
                    style={{ 
                      backgroundColor: 'var(--color-main-bg)',
                      borderColor: 'var(--color-secondary-hover)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-secondary-hover)'
                      e.currentTarget.style.borderColor = 'var(--color-selected-icon)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-main-bg)'
                      e.currentTarget.style.borderColor = 'var(--color-secondary-hover)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ml-3" style={{ backgroundColor: 'var(--color-selected-icon)' }}>
                        {friend.name ? friend.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="text-base font-medium hebrew-text" style={{ color: 'var(--color-text-primary)' }}>
                          {friend.name || friend.username}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--color-text-description)' }}>{friend.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="הסר חבר"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--color-secondary-hover)' }}>
                    <CheckIcon className="w-10 h-10" style={{ color: 'var(--color-text-description)', opacity: 0.5 }} />
                  </div>
                  <p className="hebrew-text text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>אין בקשות חברות ממתינות</p>
                  <p className="hebrew-text text-sm" style={{ color: 'var(--color-text-description)', opacity: 0.7 }}>בקשות חדשות יופיעו כאן</p>
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-xl border-2 transition-all"
                    style={{ 
                      backgroundColor: 'var(--color-main-bg)',
                      borderColor: 'var(--color-selected-icon)',
                      opacity: 0.95
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ml-3" style={{ backgroundColor: 'var(--color-selected-icon)' }}>
                        {request.user.first_name ? request.user.first_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="text-base font-medium hebrew-text" style={{ color: 'var(--color-text-primary)' }}>
                          {request.user.first_name || request.user.username}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--color-text-description)' }}>{request.user.email}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="p-2 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors"
                        title="אשר"
                      >
                        <CheckIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(request.id)}
                        className="p-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors"
                        title="דחה"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'sent' && (
            <div className="space-y-3">
              {sentRequests.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--color-secondary-hover)' }}>
                    <UserPlusIcon className="w-10 h-10" style={{ color: 'var(--color-text-description)', opacity: 0.5 }} />
                  </div>
                  <p className="hebrew-text text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>לא נשלחו בקשות חברות</p>
                  <p className="hebrew-text text-sm" style={{ color: 'var(--color-text-description)', opacity: 0.7 }}>הבקשות שתשלח יופיעו כאן</p>
                </div>
              ) : (
                sentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-xl border transition-all"
                    style={{ 
                      backgroundColor: 'var(--color-main-bg)',
                      borderColor: 'var(--color-secondary-hover)',
                      opacity: 0.9
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ml-3" style={{ backgroundColor: 'var(--color-selected-icon)' }}>
                        {request.friend_name ? request.friend_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="text-base font-medium hebrew-text" style={{ color: 'var(--color-text-primary)' }}>
                          {request.friend_name}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--color-text-description)' }}>{request.friend_email}</div>
                        <div className="text-xs hebrew-text mt-1 px-2 py-0.5 rounded-full inline-block" style={{ 
                          backgroundColor: request.is_invitation ? 'var(--color-secondary)' : 'var(--color-secondary-hover)',
                          color: 'var(--color-selected-icon)',
                          fontWeight: '500'
                        }}>
                          {request.is_invitation ? 'הזמנה נשלחה' : 'ממתין לאישור'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFriend(request.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="ביטול בקשה"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FriendListModal
