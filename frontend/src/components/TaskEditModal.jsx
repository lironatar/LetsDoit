import React, { useState, useEffect, useRef } from 'react'
import { CalendarIcon, FlagIcon, XMarkIcon } from '@heroicons/react/24/outline'

function TaskEditModal({ isOpen, onClose, onUpdateTask, task, projects, teams }) {
  const [taskTitle, setTaskTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [priority, setPriority] = useState(1)
  const [selectedProject, setSelectedProject] = useState('')
  const modalRef = useRef(null)
  const titleInputRef = useRef(null)

  // Initialize form with task data
  useEffect(() => {
    if (task && isOpen) {
      setTaskTitle(task.title || '')
      setDescription(task.description || '')
      setPriority(task.priority || 1)
      setSelectedProject(task.project || '')
      
      // Parse due_time if it exists
      if (task.due_time) {
        if (task.due_time.includes('T')) {
          // Full datetime format
          const [date, time] = task.due_time.split('T')
          setDueDate(date)
          setDueTime(time.slice(0, 5)) // Remove seconds
        } else {
          // Date only format
          setDueDate(task.due_time)
          setDueTime('')
        }
      } else {
        setDueDate('')
        setDueTime('')
      }
    }
  }, [task, isOpen])

  // Auto-focus on title when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current.focus()
        titleInputRef.current.select()
      }, 100)
    }
  }, [isOpen])

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!taskTitle.trim()) return

    // Construct due_time
    let due_time = ''
    if (dueDate) {
      due_time = dueTime ? `${dueDate}T${dueTime}` : dueDate
    }

    const updatedTask = {
      ...task,
      title: taskTitle.trim(),
      description: description.trim(),
      due_time,
      priority,
      project: selectedProject || 'הפרויקטים שלי',
    }

    onUpdateTask(updatedTask)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const getPriorityColor = (p) => {
    switch (p) {
      case 4: return 'bg-red-500 border-red-500 text-white'
      case 3: return 'bg-yellow-500 border-yellow-500 text-white'
      case 2: return 'bg-blue-500 border-blue-500 text-white'
      default: return 'bg-gray-200 border-gray-200 text-gray-600'
    }
  }

  const getPriorityText = (p) => {
    switch (p) {
      case 4: return 'גבוה'
      case 3: return 'בינוני'
      case 2: return 'נמוך'
      default: return 'רגיל'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 hebrew-text">ערוך משימה</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Title */}
          <div>
            <label className="block text-base font-medium text-gray-700 hebrew-text mb-2">
              שם המשימה
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="הכנס שם משימה..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hebrew-text"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-base font-medium text-gray-700 hebrew-text mb-2">
              תיאור
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="הוסף תיאור (אופציונלי)..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hebrew-text resize-none"
            />
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 hebrew-text mb-2">
                תאריך יעד
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 hebrew-text mb-2">
                שעה (אופציונלי)
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-base font-medium text-gray-700 hebrew-text mb-2">
              עדיפות
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md border transition-colors text-base hebrew-text ${
                    priority === p ? getPriorityColor(p) : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <FlagIcon className="w-3 h-3" />
                  {getPriorityText(p)}
                </button>
              ))}
            </div>
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-base font-medium text-gray-700 hebrew-text mb-2">
              פרויקט
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hebrew-text"
            >
              <option value="">הפרויקטים שלי</option>
              
              {/* Personal Projects */}
              {projects.filter(p => !p.team).map((project) => (
                <option key={project.id} value={project.name}>
                  📝 {project.name}
                </option>
              ))}
              
              {/* Team Projects */}
              {teams.map((team) => {
                const teamProjects = projects.filter(p => p.team?.id === team.id)
                return teamProjects.map((project) => (
                  <option key={`team-${project.id}`} value={project.name}>
                    🏢 {project.name} ({team.name})
                  </option>
                ))
              })}
            </select>
          </div>

          {/* Quick Date Buttons */}
          <div>
            <label className="block text-base font-medium text-gray-700 hebrew-text mb-2">
              קיצורי דרך
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0]
                  setDueDate(today)
                }}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors hebrew-text"
              >
                היום
              </button>
              <button
                type="button"
                onClick={() => {
                  const tomorrow = new Date()
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  setDueDate(tomorrow.toISOString().split('T')[0])
                }}
                className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors hebrew-text"
              >
                מחר
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextWeek = new Date()
                  nextWeek.setDate(nextWeek.getDate() + 7)
                  setDueDate(nextWeek.toISOString().split('T')[0])
                }}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors hebrew-text"
              >
                שבוע הבא
              </button>
              <button
                type="button"
                onClick={() => {
                  setDueDate('')
                  setDueTime('')
                }}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors hebrew-text"
              >
                ללא תאריך
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-base text-gray-600 hover:bg-gray-100 rounded-md transition-colors hebrew-text"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={!taskTitle.trim()}
              className="px-4 py-2 text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hebrew-text font-medium"
            >
              שמור שינויים
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskEditModal
