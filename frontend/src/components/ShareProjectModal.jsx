import { XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { friendAPI, projectAPI } from '../services/api'
import { useToast } from '../contexts/ToastContext'

function ShareProjectModal({ isOpen, onClose, project, onShareComplete }) {
  const [friends, setFriends] = useState([])
  const [selectedFriends, setSelectedFriends] = useState([])
  const [loading, setLoading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadFriends()
      setSelectedFriends([])
    }
  }, [isOpen])

  const loadFriends = async () => {
    setLoading(true)
    try {
      const data = await friendAPI.getFriends()
      setFriends(data)
    } catch (error) {
      console.error('Failed to load friends:', error)
      showError('שגיאה בטעינת רשימת החברים')
    } finally {
      setLoading(false)
    }
  }

  const toggleFriend = (friendId) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  const handleShare = async () => {
    if (selectedFriends.length === 0) {
      showError('יש לבחור לפחות חבר אחד')
      return
    }

    setSharing(true)
    try {
      await projectAPI.shareProject(project.id, selectedFriends)
      showSuccess(`הפרויקט שותף עם ${selectedFriends.length} חברים`)
      if (onShareComplete) {
        onShareComplete()
      }
      onClose()
    } catch (error) {
      console.error('Failed to share project:', error)
      showError('שגיאה בשיתוף הפרויקט')
    } finally {
      setSharing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-30" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3 space-x-reverse">
            <UserGroupIcon className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-bold hebrew-text">שתף פרויקט</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-600 hebrew-text mb-2">
              שתף את "<span className="font-semibold">{project?.name}</span>" עם:
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 hebrew-text">אין חברים ברשימה</p>
              <p className="text-sm text-gray-400 hebrew-text">הוסף חברים כדי לשתף פרויקטים</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {friends.map((friend) => (
                <label
                  key={friend.id}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedFriends.includes(friend.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(friend.id)}
                    onChange={() => toggleFriend(friend.id)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center mr-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                      {friend.name?.charAt(0).toUpperCase() || friend.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="mr-3">
                      <div className="font-medium hebrew-text">{friend.name || friend.email}</div>
                      <div className="text-sm text-gray-500">{friend.email}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex space-x-3 space-x-reverse p-6 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors hebrew-text"
          >
            ביטול
          </button>
          <button
            onClick={handleShare}
            disabled={selectedFriends.length === 0 || sharing}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors hebrew-text"
          >
            {sharing ? 'משתף...' : `שתף (${selectedFriends.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShareProjectModal

