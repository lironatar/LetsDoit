import React, { useState } from 'react'
import { XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline'

function TeamCreationModal({ isOpen, onClose, onCreateTeam }) {
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState('#4073FF')
  const [inviteEmails, setInviteEmails] = useState('')

  const teamColors = [
    { value: '#4073FF', name: 'כחול', bg: 'bg-blue-500' },
    { value: '#884DFF', name: 'סגול', bg: 'bg-purple-500' },
    { value: '#7ECC49', name: 'ירוק', bg: 'bg-green-500' },
    { value: '#FF9933', name: 'כתום', bg: 'bg-orange-500' },
    { value: '#DB4035', name: 'אדום', bg: 'bg-red-500' },
    { value: '#EB96EB', name: 'ורוד', bg: 'bg-pink-500' },
    { value: '#FAD000', name: 'צהוב', bg: 'bg-yellow-500' },
    { value: '#808080', name: 'אפור', bg: 'bg-gray-500' }
  ]

  const resetForm = () => {
    setTeamName('')
    setTeamDescription('')
    setSelectedColor('#4073FF')
    setInviteEmails('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!teamName.trim()) return

    const emails = inviteEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'))

    const newTeam = {
      name: teamName.trim(),
      description: teamDescription.trim(),
      color: selectedColor,
      inviteEmails: emails
    }

    onCreateTeam(newTeam)
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-[500px] max-h-[90vh] overflow-y-auto" 
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <UserGroupIcon className="w-6 h-6 text-[#4073FF] ml-3" />
            <h2 className="text-xl font-bold text-[#202020] hebrew-text">יצירת צוות חדש</h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded text-gray-500"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Team Name */}
          <div>
            <label className="block text-base font-medium text-[#202020] hebrew-text mb-2">
              שם הצוות *
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="הכנס שם צוות..."
              className="w-full px-3 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4073FF] focus:border-[#4073FF] hebrew-text"
              autoFocus
            />
          </div>

          {/* Team Description */}
          <div>
            <label className="block text-base font-medium text-[#202020] hebrew-text mb-2">
              תיאור הצוות (אופציונלי)
            </label>
            <textarea
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              placeholder="הוסף תיאור לצוות..."
              rows="3"
              className="w-full px-3 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4073FF] focus:border-[#4073FF] hebrew-text resize-none"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-base font-medium text-[#202020] hebrew-text mb-3">
              צבע הצוות
            </label>
            <div className="grid grid-cols-8 gap-2">
              {teamColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color.value 
                      ? 'border-gray-800 scale-110' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Invite Members */}
          <div>
            <label className="block text-base font-medium text-[#202020] hebrew-text mb-2">
              הזמנת חברי צוות (אופציונלי)
            </label>
            <textarea
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              placeholder="הכנס כתובות אימייל מופרדות בפסיק..."
              rows="2"
              className="w-full px-3 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4073FF] focus:border-[#4073FF] hebrew-text resize-none"
            />
            <div className="text-sm text-[#666] hebrew-text mt-1">
              דוגמה: user1@example.com, user2@example.com
            </div>
          </div>

          {/* Team Features Info */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-base font-medium text-blue-900 hebrew-text mb-2">מה תקבל עם הצוות:</h3>
            <ul className="text-sm text-blue-800 hebrew-text space-y-1">
              <li>• שיתוף פרויקטים עם חברי הצוות</li>
              <li>• הקצאת משימות לחברי צוות</li>
              <li>• מעקב אחר התקדמות הצוות</li>
              <li>• תקשורת וקוורדינציה משופרת</li>
            </ul>
          </div>

          {/* Preview */}
          {teamName && (
            <div className="bg-[#f8f8f8] rounded-md p-4 border border-gray-200">
              <div className="text-sm text-[#666] hebrew-text mb-2">תצוגה מקדימה:</div>
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full ml-3"
                  style={{ backgroundColor: selectedColor }}
                ></div>
                <UserGroupIcon className="w-4 h-4 text-gray-500 ml-2" />
                <div>
                  <div className="text-base text-[#202020] hebrew-text font-medium">{teamName}</div>
                  {teamDescription && (
                    <div className="text-sm text-[#666] hebrew-text mt-1">{teamDescription}</div>
                  )}
                  {inviteEmails && (
                    <div className="text-sm text-[#4073FF] hebrew-text mt-1">
                      {inviteEmails.split(',').filter(email => email.trim().includes('@')).length} חברים מוזמנים
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors hebrew-text font-medium"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={!teamName.trim()}
              className="flex-1 px-4 py-3 bg-[#4073FF] text-white rounded-md hover:bg-[#3461CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed hebrew-text font-medium"
            >
              צור צוות
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TeamCreationModal
