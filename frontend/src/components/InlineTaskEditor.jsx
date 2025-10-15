import { useState, useEffect, useRef } from 'react'
import { CalendarIcon, FlagIcon, BellIcon, XMarkIcon, EllipsisHorizontalIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import HebrewCalendar from './HebrewCalendar'

function InlineTaskEditor({ task, onSave, onCancel, projects, teams }) {
  const [taskTitle, setTaskTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [priority, setPriority] = useState(1)
  const [selectedProject, setSelectedProject] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  
  const titleInputRef = useRef(null)
  const calendarRef = useRef(null)
  const projectDropdownRef = useRef(null)

  // Initialize form with task data
  useEffect(() => {
    if (task) {
      setTaskTitle(task.title || '')
      setDescription(task.description || '')
      setPriority(task.priority || 1)
      setSelectedProject(task.project || '')
      
      // Parse due_time if it exists
      if (task.due_time) {
        if (task.due_time.includes('T')) {
          const [date, time] = task.due_time.split('T')
          setDueDate(date)
          setDueTime(time.slice(0, 5))
        } else {
          setDueDate(task.due_time)
          setDueTime('')
        }
      } else {
        setDueDate('')
        setDueTime('')
      }
    }
  }, [task])

  // Auto-focus on title when component mounts
  useEffect(() => {
    if (titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current.focus()
        titleInputRef.current.select()
      }, 100)
    }
  }, [])

  // Handle outside clicks for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false)
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target)) {
        setShowProjectDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSave = () => {
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
      project: selectedProject || 'תיבת הדואר',
    }

    onSave(updatedTask)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel()
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave()
    }
  }

  const getPriorityColor = (p) => {
    switch (p) {
      case 4: return 'text-red-600 border-red-200 bg-red-50'
      case 3: return 'text-yellow-600 border-yellow-200 bg-yellow-50'
      case 2: return 'text-blue-600 border-blue-200 bg-blue-50'
      default: return 'text-gray-600 border-gray-200 bg-gray-50'
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

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'תאריך יעד'
    
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'היום'
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'מחר'
    }
    
    return date.toLocaleDateString('he-IL', { 
      day: 'numeric', 
      month: 'short' 
    })
  }

  const handleDateSelect = (selectedDate) => {
    setDueDate(selectedDate)
    setShowCalendar(false)
  }

  const getProjectDisplayName = () => {
    if (!selectedProject) return 'תיבת הדואר'
    
    const project = projects.find(p => p.name === selectedProject)
    if (project?.team) {
      const team = teams.find(t => t.id === project.team.id)
      return `🏢 ${selectedProject} (${team?.name || 'צוות'})`
    }
    
    return `📝 ${selectedProject}`
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-2" dir="rtl">
      {/* Title Input */}
      <div className="mb-3">
        <input
          ref={titleInputRef}
          type="text"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="שם המשימה"
          className="w-full text-base text-gray-900 placeholder-gray-400 border-none outline-none hebrew-text font-medium bg-transparent"
        />
      </div>

      {/* Description Input */}
      <div className="mb-4">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="תיאור"
          className="w-full text-base text-gray-600 placeholder-gray-400 border-none outline-none hebrew-text bg-transparent"
        />
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Due Date Button */}
          <div className="relative" ref={calendarRef}>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className={`flex items-center gap-1 px-2 py-1 text-sm rounded border transition-colors hebrew-text ${
                dueDate 
                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <CalendarIcon className="w-3 h-3" />
              {formatDateForDisplay(dueDate)}
              {dueDate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setDueDate('')
                    setDueTime('')
                  }}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              )}
            </button>

            {/* Hebrew Calendar Dropdown */}
            {showCalendar && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg">
                <HebrewCalendar
                  selectedDate={dueDate}
                  onSelectDate={handleDateSelect}
                  onClose={() => setShowCalendar(false)}
                />
              </div>
            )}
          </div>

          {/* Priority Button */}
          <button
            type="button"
            onClick={() => setPriority(priority >= 4 ? 1 : priority + 1)}
            className={`flex items-center gap-1 px-2 py-1 text-sm rounded border transition-colors hebrew-text ${getPriorityColor(priority)}`}
          >
            <FlagIcon className="w-3 h-3" />
            {getPriorityText(priority)}
          </button>

          {/* Reminders Button */}
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-200 transition-colors hebrew-text"
          >
            <BellIcon className="w-3 h-3" />
            תזכורות
          </button>

          {/* More Options */}
          <button
            type="button"
            className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
          >
            •••
          </button>
        </div>

        {/* Project and Save/Cancel */}
        <div className="flex items-center gap-2">
          {/* Project Selector */}
          <div className="relative" ref={projectDropdownRef}>
            <button
              type="button"
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-200 transition-colors hebrew-text"
            >
              {getProjectDisplayName()}
              <ChevronDownIcon className="w-3 h-3" />
            </button>

            {/* Project Dropdown */}
            {showProjectDropdown && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedProject('')
                    setShowProjectDropdown(false)
                  }}
                  className="w-full px-3 py-2 text-right text-base hebrew-text hover:bg-gray-50 transition-colors"
                >
                  📝 תיבת הדואר
                </button>
                
                {/* Personal Projects */}
                {projects.filter(p => !p.team).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project.name)
                      setShowProjectDropdown(false)
                    }}
                    className="w-full px-3 py-2 text-right text-base hebrew-text hover:bg-gray-50 transition-colors"
                  >
                    📝 {project.name}
                  </button>
                ))}
                
                {/* Team Projects */}
                {teams.map((team) => {
                  const teamProjects = projects.filter(p => p.team?.id === team.id)
                  return teamProjects.map((project) => (
                    <button
                      key={`team-${project.id}`}
                      onClick={() => {
                        setSelectedProject(project.name)
                        setShowProjectDropdown(false)
                      }}
                      className="w-full px-3 py-2 text-right text-base hebrew-text hover:bg-gray-50 transition-colors"
                    >
                      🏢 {project.name} ({team.name})
                    </button>
                  ))
                })}
              </div>
            )}
          </div>

          {/* Cancel & Save Buttons */}
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-base text-gray-600 hover:bg-gray-100 rounded transition-colors hebrew-text"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!taskTitle.trim()}
            className="px-4 py-1.5 text-base bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hebrew-text font-medium shadow-sm"
          >
            שמור
          </button>
        </div>
      </div>
    </div>
  )
}

export default InlineTaskEditor
