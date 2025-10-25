import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

function ProjectCreationModal({ isOpen, onClose, onCreateProject, teams = [] }) {
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState('#DB4035')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [isTeamProject, setIsTeamProject] = useState(false)

  const projectColors = [
    { value: '#DB4035', name: 'אדום', bg: 'bg-red-500' },
    { value: '#FF9933', name: 'כתום', bg: 'bg-orange-500' },
    { value: '#FAD000', name: 'צהוב', bg: 'bg-yellow-500' },
    { value: '#7ECC49', name: 'ירוק', bg: 'bg-green-500' },
    { value: '#4073FF', name: 'כחול', bg: 'bg-blue-500' },
    { value: '#884DFF', name: 'סגול', bg: 'bg-purple-500' },
    { value: '#EB96EB', name: 'ורוד', bg: 'bg-pink-500' },
    { value: '#808080', name: 'אפור', bg: 'bg-gray-500' }
  ]

  const resetForm = () => {
    setProjectName('')
    setProjectDescription('')
    setSelectedColor('#DB4035')
    setSelectedTeam('')
    setIsTeamProject(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!projectName.trim()) return

    const newProject = {
      name: projectName.trim(),
      description: projectDescription.trim(),
      color: selectedColor,
      team: isTeamProject && selectedTeam ? selectedTeam : null
    }

    onCreateProject(newProject)
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
        className="bg-white rounded-lg shadow-xl w-[480px] max-h-[90vh] overflow-y-auto" 
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-gray-200">
          <h2 className="text-xl font-bold text-[#202020] hebrew-text">הוספת פרויקט</h2>
          <button 
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded text-gray-500"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          {/* Project Name */}
          <div>
            <label className="form-label hebrew-text mb-2">שם הפרויקט *</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="הכנס שם פרויקט..."
              className="form-control hebrew-text"
              autoFocus
            />
          </div>

          {/* Project Description */}
          <div>
            <label className="form-label hebrew-text mb-2">תיאור (אופציונלי)</label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="הוסף תיאור לפרויקט..."
              rows="3"
              className="form-control hebrew-text resize-none"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="form-label hebrew-text mb-3">צבע הפרויקט</label>
            <div className="grid grid-cols-8 gap-2">
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

          {/* Team Assignment */}
          {teams.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="isTeamProject"
                  checked={isTeamProject}
                  onChange={(e) => setIsTeamProject(e.target.checked)}
                  className="w-4 h-4 text-[#db4c3f] border-gray-300 rounded focus:ring-[#db4c3f] ml-2"
                />
                <label htmlFor="isTeamProject" className="text-base font-medium text-[#202020] hebrew-text">
                  פרויקט צוות
                </label>
              </div>

              {isTeamProject && (
                <div>
                  <label className="form-label hebrew-text mb-2">בחר צוות</label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="form-control hebrew-text"
                  >
                    <option value="">בחר צוות...</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {projectName && (
            <div className="bg-[#f8f8f8] rounded-md p-4 border border-gray-200">
              <div className="text-sm text-[#666] hebrew-text mb-2">תצוגה מקדימה:</div>
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full ml-3"
                  style={{ backgroundColor: selectedColor }}
                ></div>
                <div>
                  <div className="text-base text-[#202020] hebrew-text font-medium">{projectName}</div>
                  {projectDescription && (
                    <div className="text-sm text-[#666] hebrew-text mt-1">{projectDescription}</div>
                  )}
                  {isTeamProject && selectedTeam && (
                    <div className="text-sm text-[#4073FF] hebrew-text mt-1">
                      צוות: {teams.find(t => t.id == selectedTeam)?.name}
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
              disabled={!projectName.trim()}
              className="flex-1 px-4 py-3 bg-[#db4c3f] text-white rounded-md hover:bg-[#c53030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed hebrew-text font-medium"
            >
              צור פרויקט
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectCreationModal
