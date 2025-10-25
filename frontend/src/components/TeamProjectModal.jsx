import React, { useState, useEffect } from 'react'
import { XMarkIcon, UsersIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { friendAPI } from '../services/api'

function TeamProjectModal({ isOpen, onClose, onCreateProject, teams, selectedTeam = null }) {
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState('#DB4035')
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [friends, setFriends] = useState([])

  const projectColors = [
    { value: '#DB4035', name: 'אדום', bg: 'bg-red-500' },
    { value: '#FF9933', name: 'כתום', bg: 'bg-orange-500' },
    { value: '#FAD000', name: 'צהוב', bg: 'bg-yellow-500' },
    { value: '#7ECC49', name: 'ירוק', bg: 'bg-green-500' },
    { value: '#299438', name: 'ירוק כהה', bg: 'bg-green-700' },
    { value: '#6ACCBC', name: 'טורקיז', bg: 'bg-teal-400' },
    { value: '#158FAD', name: 'כחול', bg: 'bg-blue-600' },
    { value: '#4073FF', name: 'כחול רויאל', bg: 'bg-blue-500' },
    { value: '#884DFF', name: 'סגול', bg: 'bg-purple-500' },
    { value: '#EB96EB', name: 'ורוד', bg: 'bg-pink-400' },
    { value: '#E05194', name: 'ורוד כהה', bg: 'bg-pink-600' },
    { value: '#808080', name: 'אפור', bg: 'bg-gray-500' }
  ]

  useEffect(() => {
    if (isOpen) {
      loadFriends()
      if (selectedTeam) {
        setSelectedTeamId(selectedTeam.id)
      } else if (teams.length > 0) {
        setSelectedTeamId(teams[0].id)
      }
    }
  }, [isOpen, selectedTeam, teams])

  const loadFriends = async () => {
    try {
      const data = await friendAPI.getFriends()
      setFriends(data)
    } catch (err) {
      console.error('Failed to load friends:', err)
    }
  }

  const resetForm = () => {
    setProjectName('')
    setProjectDescription('')
    setSelectedColor('#DB4035')
    setSelectedMembers([])
    if (!selectedTeam && teams.length > 0) {
      setSelectedTeamId(teams[0].id)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const toggleMember = (friendId) => {
    setSelectedMembers(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!projectName.trim() || !selectedTeamId) return

    const newProject = {
      name: projectName.trim(),
      description: projectDescription.trim(),
      color: selectedColor,
      team: selectedTeamId,
      members: selectedMembers
    }

    onCreateProject(newProject)
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  const selectedTeamData = teams.find(t => t.id === parseInt(selectedTeamId))

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-[600px] max-h-[90vh] overflow-y-auto" 
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <UsersIcon className="w-6 h-6 text-[#4073FF] ml-3" />
            <h2 className="text-xl font-bold text-[#202020] hebrew-text">יצירת פרויקט צוות</h2>
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
          {/* Team Selection */}
          <div>
            <label className="block text-base font-medium text-[#202020] hebrew-text mb-2">
              בחר צוות *
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full px-3 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4073FF] focus:border-[#4073FF] hebrew-text"
              required
              disabled={!!selectedTeam}
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-base font-medium text-[#202020] hebrew-text mb-2">
              שם הפרויקט *
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="הכנס שם פרויקט..."
              className="w-full px-3 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4073FF] focus:border-[#4073FF] hebrew-text"
              autoFocus
              required
            />
          </div>

          {/* Project Description */}
          <div>
            <label className="block text-base font-medium text-[#202020] hebrew-text mb-2">
              תיאור הפרויקט (אופציונלי)
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="הוסף תיאור לפרויקט..."
              rows="3"
              className="w-full px-3 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4073FF] focus:border-[#4073FF] hebrew-text resize-none"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-base font-medium text-[#202020] hebrew-text mb-3">
              צבע הפרויקט
            </label>
            <div className="grid grid-cols-12 gap-2">
              {projectColors.map((color) => (
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

          {/* Member Assignment */}
          <div>
            <label className="block text-base font-medium text-[#202020] hebrew-text mb-3">
              הקצה חברים לפרויקט
            </label>
            {friends.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <UserPlusIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 hebrew-text text-sm">אין לך חברים עדיין</p>
                <p className="text-gray-400 hebrew-text text-xs mt-1">הוסף חברים מרשימת החברים</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                {friends.map((friend) => (
                  <label
                    key={friend.id}
                    className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(friend.id)}
                      onChange={() => toggleMember(friend.id)}
                      className="ml-3 w-4 h-4 text-[#4073FF] border-gray-300 rounded focus:ring-[#4073FF]"
                    />
                    <div className="flex items-center flex-1">
                      <div className="w-8 h-8 rounded-full bg-[#4073FF] flex items-center justify-center text-white text-sm font-medium ml-2">
                        {friend.name ? friend.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#202020] hebrew-text">
                          {friend.name || friend.username}
                        </div>
                        <div className="text-xs text-gray-500">{friend.email}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="text-sm text-gray-500 hebrew-text mt-2">
              נבחרו {selectedMembers.length} חברים
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-base font-medium text-blue-900 hebrew-text mb-2">
              📋 פרויקט צוות
            </h3>
            <ul className="text-sm text-blue-800 hebrew-text space-y-1">
              <li>• פרויקט זה יהיה חלק מצוות "{selectedTeamData?.name || ''}"</li>
              <li>• חברי הצוות שנבחרו יוכלו לצפות ולערוך משימות</li>
              <li>• ניתן להוסיף או להסיר חברים בכל עת</li>
            </ul>
          </div>

          {/* Preview */}
          {projectName && (
            <div className="bg-[#f8f8f8] rounded-md p-4 border border-gray-200">
              <div className="text-sm text-[#666] hebrew-text mb-2">תצוגה מקדימה:</div>
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full ml-3"
                  style={{ backgroundColor: selectedColor }}
                ></div>
                <div>
                  <div className="text-base text-[#202020] hebrew-text font-medium">{projectName}</div>
                  {projectDescription && (
                    <div className="text-sm text-[#666] hebrew-text mt-1">{projectDescription}</div>
                  )}
                  <div className="text-sm text-[#4073FF] hebrew-text mt-1">
                    צוות: {selectedTeamData?.name || ''} • {selectedMembers.length} חברים
                  </div>
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
              disabled={!projectName.trim() || !selectedTeamId}
              className="flex-1 px-4 py-3 bg-[#4073FF] text-white rounded-md hover:bg-[#3461CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed hebrew-text font-medium"
            >
              צור פרויקט צוות
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TeamProjectModal
