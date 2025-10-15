import { useState, useRef, useEffect } from 'react'
import { CalendarIcon, ClockIcon, PencilIcon, EllipsisHorizontalIcon, CheckIcon, ChevronRightIcon, ChevronDownIcon, ChevronLeftIcon, InboxIcon, HashtagIcon } from '@heroicons/react/24/outline'
import InlineTaskEditor from './InlineTaskEditor'
import HebrewCalendar from './HebrewCalendar'
import CommentIcon from './icons/CommentIcon'

function Task({ task, onToggle, onEdit, onUpdateTask, projects = [], teams = [], isOverdue = false, onOpenTaskDetail, isSubtask = false, currentView = 'inbox', onToggleSubtasks, isSubtasksExpanded = true }) {
  const [isEditing, setIsEditing] = useState(false)
  const [showQuickCalendar, setShowQuickCalendar] = useState(false)
  const calendarRef = useRef(null)
  const formatDate = (dateString) => {
    if (!dateString) return { text: '', type: 'other' }
    
    // Parse date string as local date (YYYY-MM-DD format)
    const dateParts = dateString.split('T')[0].split('-')
    const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
    
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return { text: 'היום', type: 'today' }
    }
    
    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return { text: 'מחר', type: 'tomorrow' }
    }
    
    // Check if it's next week
    if (date.toDateString() === nextWeek.toDateString()) {
      return { text: 'שבוע הבא', type: 'nextWeek' }
    }
    
    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return { text: 'אתמול', type: 'yesterday' }
    }
    
    // Check if it's this week
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday
    
    if (date >= startOfWeek && date <= endOfWeek) {
      // Get day of the week in Hebrew
      const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
      const dayOfWeek = dayNames[date.getDay()]
      
      return { 
        text: dayOfWeek, 
        type: 'thisWeek' 
      }
    }
    
    // Format as Hebrew date for other dates
    const currentYear = today.getFullYear()
    const selectedYear = date.getFullYear()
    
    if (selectedYear === currentYear) {
      return { 
        text: date.toLocaleDateString('he-IL', { 
          day: 'numeric', 
          month: 'short' 
        }), 
        type: 'other' 
      }
    } else {
      return { 
        text: date.toLocaleDateString('he-IL', { 
          day: 'numeric', 
          month: 'short',
          year: 'numeric'
        }), 
        type: 'other' 
      }
    }
  }

  const getProjectInfo = () => {
    // Inbox if no project assigned
    if (!task.project) {
      return { name: 'תיבת הדואר', color: null, isTeam: false, isInbox: true }
    }

    const project = projects.find(p => p.name === task.project)
    if (!project) {
      return {
        name: task.project,
        color: '#808080',
        isTeam: false,
        isInbox: false
      }
    }

    return {
      name: project.name,
      color: project.color,
      isTeam: !!project.team,
      isInbox: false
    }
  }

  const projectInfo = getProjectInfo()

  const getDateColor = (dateType, isOverdueDate = false) => {
    if (isOverdueDate) return 'var(--color-overdue)' // CSS variable for overdue
    // Use the tasklist color for all date types
    return 'var(--color-icon-and-date-tasklist)'
  }

  const getPriorityColor = () => {
    if (task.completed) return null // No color for completed tasks
    
    switch (task.priority) {
      case 1: return '#D1453B' // Red
      case 2: return '#EB8909' // Orange
      case 3: return '#246FE0' // Blue
      case 4: return null // White/default (no special color)
      default: return null
    }
  }

  const priorityColor = getPriorityColor()

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleSaveEdit = (updatedTask) => {
    if (onUpdateTask) {
      onUpdateTask(updatedTask)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleQuickDateSelect = (selectedDate) => {
    const updatedTask = {
      ...task,
      due_time: selectedDate
    }
    if (onUpdateTask) {
      onUpdateTask(updatedTask)
    }
    setShowQuickCalendar(false)
  }

  // Handle outside click to close calendar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowQuickCalendar(false)
      }
    }

    if (showQuickCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showQuickCalendar])

  // If editing, show the inline editor
  if (isEditing) {
    return (
      <InlineTaskEditor
        task={task}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
        projects={projects}
        teams={teams}
      />
    )
  }

  const handleTaskClick = (e) => {
    // Don't open modal if clicking on interactive elements
    if (e.target.closest('button') || e.target.closest('.calendar-popup')) {
      return
    }
    if (onOpenTaskDetail) {
      onOpenTaskDetail(task)
    }
  }

  return (
    <div 
      className={`flex items-start group cursor-pointer pr-0 relative ${
        isSubtask ? 'opacity-80' : ''
      }`}
      onClick={handleTaskClick}
    >
      {/* Arrow outside - positioned exactly like Todoist */}
      {task.has_subtasks && (
        <div 
          className="absolute flex items-center"
          style={{
            right: '-23px',
            top: '7px',
            width: '51px',
            display: 'flex',
            paddingLeft: '3px',
            paddingTop: '5px'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (onToggleSubtasks) {
                onToggleSubtasks(task.id)
              }
            }}
            className="hover:bg-gray-100 rounded transition-colors" style={{ padding: '0.250rem' }}
          >
            {isSubtasksExpanded ? (
              <ChevronDownIcon className="w-3 h-3 text-gray-900" />
            ) : (
              <ChevronLeftIcon className="w-3 h-3 text-gray-900" />
            )}
          </button>
        </div>
      )}

      {/* Task Checkbox */}
      <div className="relative mt-0.5 ml-3">
        <button
          onClick={onToggle}
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors mr-0 ${
            task.completed 
              ? 'bg-[#999999] border-[#999999]' 
              : ''
          }`}
          style={{
            borderColor: task.completed ? '#999999' : (priorityColor || '#d1d5db'),
            backgroundColor: task.completed 
              ? '#999999' 
              : priorityColor 
                ? `${priorityColor}15` 
                : '#ffffff'
          }}
        >
          {/* Always show checkmark when completed */}
          {task.completed && (
            <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />
          )}
          
          {/* Show checkmark on hover when not completed - appears when touching any part of circle */}
          {!task.completed && (
            <CheckIcon 
              className="w-3 h-3 opacity-0 hover:opacity-100 transition-opacity" 
              strokeWidth={3}
              style={{ color: priorityColor || '#9ca3af' }}
            />
          )}
        </button>
      </div>

      {/* Task Content */}
      <div className="flex-1 min-w-0 ml-3">
        {/* Task Title */}
        <div>
          <div className="flex items-center justify-between relative">
            <span className={`hebrew-text text-base font-medium leading-relaxed ${
              task.completed 
                ? 'line-through text-gray-500' 
                : 'text-primary'
            }`}>
              {task.title}
            </span>
            
            {/* Hover Actions - On title row */}
            <div className="hidden group-hover:flex items-center space-x-1 space-x-reverse" style={{maxHeight: '22.75px'}}>
              {/* Edit/Rename */}
              <button 
                onClick={handleEditClick}
                className="hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                title="Edit task"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              
              {/* Calendar */}
              <div className="relative" ref={calendarRef}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowQuickCalendar(!showQuickCalendar)
                  }}
                  className="hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                  title="Set due date"
                >
                  <CalendarIcon className="w-4 h-4" />
                </button>

                {/* Quick Calendar Popup */}
                {showQuickCalendar && (
                  <div className="calendar-popup absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <HebrewCalendar
                      selectedDate={task.due_time}
                      onSelectDate={handleQuickDateSelect}
                      onClose={() => setShowQuickCalendar(false)}
                    />
                  </div>
                )}
              </div>
              
              {/* More options */}
              <button 
                className="hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                title="More actions"
              >
                <EllipsisHorizontalIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="">
            <span className={`text-base hebrew-text leading-relaxed ${
              task.completed
                ? 'line-through text-gray-400'
                : 'text-description'
            }`}>
              {task.description}
            </span>
          </div>
        )}

        {/* Date and Project info - only show if there's content to display and not a subtask */}
        {!isSubtask && (task.due_time || task.has_subtasks || projectInfo) && (
          <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center space-x-3 space-x-reverse ml-1">
              {/* Date Badge */}
              {task.due_time && !(currentView === 'today' && !isOverdue) && (() => {
                const dateInfo = formatDate(task.due_time)
                const d = new Date()
                const todayLocal = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
                const isOverdueDate = task.due_time < todayLocal
                const dateColor = getDateColor(dateInfo.type, isOverdueDate)
                return (
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <CalendarIcon className="w-4 h-4" style={{ color: dateColor }} />
                    <span className="text-sm hebrew-text font-medium" style={{ color: dateColor }}>
                      {dateInfo.text}
                    </span>
                  </div>
                )
              })()}
              
              {/* Subtask count with icon */}
              {task.has_subtasks && !isSubtask && (
                <div className="flex items-center space-x-1 space-x-reverse">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-400 hebrew-text">
                    {task.completed_subtasks_count || 0}/{task.subtasks_count || 0}
                  </span>
                </div>
              )}

              {/* Comment count with icon */}
              {task.comments && task.comments.length > 0 && !isSubtask && (
                <div className="flex items-center space-x-1 space-x-reverse">
                  <CommentIcon size={16} color="#9ca3af" />
                  <span className="text-sm text-gray-400 hebrew-text">
                    {task.comments.length}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              {/* Project/Inbox Info - Right side (only for main tasks) */}
              {projectInfo && !isSubtask && currentView !== 'inbox' && !currentView.startsWith('project-') && (
                <span className="text-sm text-gray-500 hebrew-text flex items-center">
                  {projectInfo.isInbox ? (
                    <>
                      <InboxIcon className="w-4 h-4 text-gray-400" />
                      <span className="ml-1">{projectInfo.name}</span>
                    </>
                  ) : (
                    <>
                      <HashtagIcon className="w-4 h-4 text-gray-400" />
                      <span className="ml-1">{projectInfo.name}</span>
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Task