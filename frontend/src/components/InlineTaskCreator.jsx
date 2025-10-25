import React, { useState, useRef, useEffect } from 'react'
import { CalendarIcon, FlagIcon, BellIcon } from '@heroicons/react/24/outline'

function InlineTaskCreator({ isOpen, onClose, onCreateTask, onCancel, currentView, projects, teams }) {
  const [taskTitle, setTaskTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showDescription, setShowDescription] = useState(false)
  const [selectedProject, setSelectedProject] = useState('')
  const inputRef = useRef(null)

  // Auto-focus when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Auto-select project based on current view
  useEffect(() => {
    if (currentView.startsWith('project-')) {
      const projectId = currentView.replace('project-', '')
      const currentProject = projects.find(p => p.id == projectId)
      if (currentProject) {
        setSelectedProject(currentProject.name)
      }
    } else if (currentView.startsWith('team-')) {
      const teamId = currentView.replace('team-', '')
      const teamProjects = projects.filter(p => p.team?.id == teamId)
      if (teamProjects.length > 0) {
        setSelectedProject(teamProjects[0].name)
      }
    }
  }, [currentView, projects])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!taskTitle.trim()) return

    const newTask = {
      id: Date.now(),
      title: taskTitle.trim(),
      description: description.trim(),
      priority: 1,
      due_time: '',
      completed: false,
      project: selectedProject || 'הפרויקטים שלי',
    }

    onCreateTask(newTask)
    
    // Reset form
    setTaskTitle('')
    setDescription('')
    setShowDescription(false)
    onClose()
  }

  const handleCancel = () => {
    setTaskTitle('')
    setDescription('')
    setShowDescription(false)
    onCancel()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (!isOpen) return null

  // Check if we're in team context
  const isTeamContext = currentView.startsWith('team-')
  const currentTeamId = isTeamContext ? currentView.replace('team-', '') : null
  const currentTeam = teams.find(t => t.id == currentTeamId)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-4" dir="rtl">
      <form onSubmit={handleSubmit}>
        {/* Main task input */}
        <div className="mb-3">
          <input
            ref={inputRef}
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="שם המשימה"
            className="w-full text-base text-[#202020] placeholder-gray-400 border-none outline-none hebrew-text font-medium"
            style={{ background: 'transparent' }}
          />
        </div>

        {/* Description */}
        {showDescription && (
          <div className="mb-3">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="תיאור"
              className="w-full text-base text-gray-600 placeholder-gray-400 border-none outline-none hebrew-text"
              style={{ background: 'transparent' }}
            />
          </div>
        )}

        {!showDescription && taskTitle && (
          <button
            type="button"
            onClick={() => setShowDescription(true)}
            className="text-base text-gray-500 hover:text-gray-700 hebrew-text mb-3"
          >
            תיאור
          </button>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Today */}
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-1 text-xs text-[#0a7d3d] bg-[#e8f5e8] rounded hover:bg-[#d4f1d4] transition-colors hebrew-text font-medium border border-[#b8e6c1]"
            >
              <CalendarIcon className="w-3 h-3" />
              היום
              <span className="text-gray-500 hover:text-gray-700">×</span>
            </button>

            {/* Priority */}
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors hebrew-text"
            >
              <FlagIcon className="w-3 h-3" />
              עדיפות
            </button>

            {/* Reminders */}
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors hebrew-text"
            >
              <BellIcon className="w-3 h-3" />
              תזכורות
            </button>

            {/* More options */}
            <button
              type="button"
              className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              •••
            </button>

            {/* Team/Project context */}
            {isTeamContext && selectedProject && (
              <div className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hebrew-text">
                🏢 {selectedProject}
              </div>
            )}
          </div>

          {/* Submit buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 text-base text-gray-600 hover:bg-gray-100 rounded transition-colors hebrew-text"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={!taskTitle.trim()}
            className={`px-4 py-2 text-base text-white rounded transition-colors hebrew-text font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
              isTeamContext ? 'bg-[#4073FF] hover:bg-[#3461CC]' : 'bg-[#dc4c3e] hover:bg-[#c53030]'
            }`}
            >
              הוסף משימה
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default InlineTaskCreator
