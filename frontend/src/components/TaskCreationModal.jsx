import React, { useState, useEffect, useRef } from 'react'
import { XMarkIcon, CalendarIcon, FlagIcon, BellIcon, EllipsisHorizontalIcon, ChevronDownIcon, CheckIcon, InboxIcon, HashtagIcon, UserGroupIcon, UserIcon } from '@heroicons/react/24/outline'
import DatePicker, { Calendar, DateObject } from 'react-multi-date-picker'
import DatePickerDropdown from './DatePickerDropdown'
import PrioritySelector from './PrioritySelector'


function TaskCreationModal({ isOpen, onClose, onCreateTask, projects = [], teams = [], currentView = 'today', initialData = null, currentUser = '' }) {
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [selectedProject, setSelectedProject] = useState('תיבת הדואר')
  const [selectedDates, setSelectedDates] = useState([])
  const [showDateTag, setShowDateTag] = useState(true)
  const [selectedTime, setSelectedTime] = useState('')
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  
  // Generate 15-minute interval options with default time at top and next intervals
  const generateTimeOptions = () => {
    const defaultTime = getDefaultTime()
    const options = []
    
    // Add default time first
    options.push(defaultTime)
    
    // Parse default time to get hour and minute
    const [defaultHour, defaultMinute] = defaultTime.split(':').map(Number)
    const defaultTimeInMinutes = defaultHour * 60 + defaultMinute
    
    // Add next 15 intervals (next 3.75 hours)
    for (let i = 1; i <= 15; i++) {
      const nextTimeInMinutes = defaultTimeInMinutes + (i * 15)
      const nextHour = Math.floor(nextTimeInMinutes / 60) % 24
      const nextMinute = nextTimeInMinutes % 60
      const nextTimeString = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`
      options.push(nextTimeString)
    }
    
    return options
  }
  
  // Get current time rounded up to next 15-minute interval
  const getDefaultTime = () => {
    const now = new Date()
    const minutes = now.getMinutes()
    const roundedMinutes = Math.ceil(minutes / 15) * 15
    const hour = roundedMinutes >= 60 ? now.getHours() + 1 : now.getHours()
    const finalHour = hour >= 24 ? 0 : hour
    const finalMinutes = roundedMinutes >= 60 ? 0 : roundedMinutes
    
    return `${finalHour.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`
  }
  const [priority, setPriority] = useState(4)
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showTimeDropdown, setShowTimeDropdown] = useState(false)
  const [duration, setDuration] = useState('No duration')
  const [timeZone, setTimeZone] = useState('Floating time')
  const [showRepeatPicker, setShowRepeatPicker] = useState(false)
  const [repeatType, setRepeatType] = useState('No repeat')
  const projectDropdownRef = useRef(null)
  const datePickerRef = useRef(null)

  // Auto-select project based on current view
  useEffect(() => {
    if (currentView.startsWith('project-')) {
      const projectId = currentView.replace('project-', '')
      const currentProject = projects.find(p => p.id == projectId)
      if (currentProject) {
        setSelectedProject(currentProject.name)
      }
    } else {
      setSelectedProject('תיבת הדואר')
    }
  }, [currentView, projects])

  // Use initial data from calendar or set default time only
  useEffect(() => {
    if (isOpen) {
      if (initialData && initialData.due_date) {
        // Convert YYYY-MM-DD to DD/MM/YYYY format for date selection
        const dateParts = initialData.due_date.split('-')
        if (dateParts.length === 3) {
          const year = dateParts[0]
          const month = dateParts[1]
          const day = dateParts[2]
          const formattedDate = `${day}/${month}/${year}`
          
          // Create date object with proper format function
          setSelectedDates([{ 
            format: (formatStr) => {
              if (formatStr === 'DD/MM') {
                return `${day}/${month}`
              } else if (formatStr === 'DD/MM/YYYY') {
                return formattedDate
              }
              return formattedDate
            }
          }])
        } else {
          setSelectedDates([{ format: () => initialData.due_date }])
        }
        setShowDateTag(true)
        if (initialData.due_time) {
          setSelectedTime(initialData.due_time)
        } else {
          // Set default time if no specific time from calendar
          setSelectedTime(getDefaultTime())
        }
      } else {
        // Set default time only (no default date)
        setSelectedTime(getDefaultTime())
      }
    }
  }, [isOpen, initialData])

  // Reset showDateTag when selectedDates changes
  useEffect(() => {
    if (selectedDates.length > 0) {
      setShowDateTag(true)
    }
  }, [selectedDates])

  // Handle modal visibility for smooth animation
  useEffect(() => {
    if (isOpen) {
      // Show modal immediately, then trigger animation
      setModalVisible(true)
    } else {
      // Reset state when modal closes
      setModalVisible(false)
    }
  }, [isOpen])

  // Close project dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target)) {
        setShowProjectDropdown(false)
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false)
      }
    }

    if (showProjectDropdown || showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProjectDropdown, showDatePicker])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!taskTitle.trim()) return

    // Helper function to convert DD/MM/YYYY to YYYY-MM-DD
    const convertToYYYYMMDD = (date) => {
      if (!date) return ''
      
      if (date.format) {
        // For our custom date objects, get the DD/MM/YYYY string
        const dateString = date.format()
        const parts = dateString.split('/')
        if (parts.length === 3) {
          const day = parts[0]
          const month = parts[1]
          const year = parts[2]
          return `${year}-${month}-${day}`
        }
      }
      
      // For regular date strings or objects
      if (typeof date === 'string') {
        const parts = date.split('/')
        if (parts.length === 3) {
          const day = parts[0]
          const month = parts[1]
          const year = parts[2]
          return `${year}-${month}-${day}`
        }
      }
      
      return date
    }

    // If multiple dates are selected, create multiple tasks
    if (selectedDates.length > 1) {
      selectedDates.forEach((date, index) => {
        const newTask = {
          id: Date.now() + index,
          title: taskTitle,
          description: taskDescription,
          priority,
          due_time: convertToYYYYMMDD(date),
          completed: false,
          project_name: selectedProject || 'תיבת הדואר'
        }
        onCreateTask(newTask)
      })
    } else {
      // Single task
      const newTask = {
        id: Date.now(),
        title: taskTitle,
        description: taskDescription,
        priority,
        due_time: selectedDates.length > 0 
          ? convertToYYYYMMDD(selectedDates[0])
          : (currentView === 'today' ? (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() : ''),
        completed: false,
        project_name: selectedProject === 'תיבת הדואר' ? '' : selectedProject
      }
      onCreateTask(newTask)
    }

    resetForm()
    onClose()
  }

  const resetForm = () => {
    setTaskTitle('')
    setTaskDescription('')
    setSelectedProject('תיבת הדואר')
    setSelectedDates([])
    setShowDateTag(true)
    setSelectedTime(getDefaultTime())
    setPriority(4)
    setShowProjectDropdown(false)
    setShowDatePicker(false)
    setShowTimePicker(false)
    setShowTimeDropdown(false)
    setDuration('No duration')
    setTimeZone('Floating time')
    setRepeatType('No repeat')
    setShowDiscardConfirm(false)
    setIsAnimatingOut(false)
    setModalVisible(false)
  }

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    return taskTitle.trim() || 
           taskDescription.trim() || 
           selectedDates.length > 0 || 
           priority !== 4 || 
           selectedProject !== 'תיבת הדואר'
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleCloseWithConfirmation = () => {
    if (hasUnsavedChanges()) {
      setShowDiscardConfirm(true)
    } else {
      handleClose()
    }
  }

  const confirmDiscard = () => {
    setShowDiscardConfirm(false)
    setIsAnimatingOut(true)
    
    // Wait for animation to complete before closing
    setTimeout(() => {
      handleClose()
    }, 300) // 300ms matches the CSS transition duration
  }

  const cancelDiscard = () => {
    setShowDiscardConfirm(false)
  }

  const getDateText = () => {
    if (selectedDates.length === 0) return 'תאריך'
    if (selectedDates.length === 1) {
      const date = selectedDates[0]
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      const currentYear = today.getFullYear()
      
      // Create date strings in DD/MM/YYYY format
      const todayStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`
      const tomorrowStr = `${String(tomorrow.getDate()).padStart(2,'0')}/${String(tomorrow.getMonth()+1).padStart(2,'0')}/${tomorrow.getFullYear()}`
      const nextWeekStr = `${String(nextWeek.getDate()).padStart(2,'0')}/${String(nextWeek.getMonth()+1).padStart(2,'0')}/${nextWeek.getFullYear()}`
      
      if (date.format) {
        const dateString = date.format()
        
        // Check for special dates first
        if (dateString === todayStr) {
        return 'היום'
        } else if (dateString === tomorrowStr) {
        return 'מחר'
        } else if (dateString === nextWeekStr) {
          return 'שבוע הבא'
        }
        
        // Parse DD/MM/YYYY format correctly for regular dates
        const parts = dateString.split('/')
        if (parts.length === 3) {
          const day = parseInt(parts[0])
          const month = parseInt(parts[1])
          const year = parseInt(parts[2])
          const dateObj = new Date(year, month - 1, day) // month is 0-indexed
          const selectedYear = dateObj.getFullYear()
          
          if (selectedYear === currentYear) {
            return date.format('DD/MM')
      } else {
            return date.format('DD/MM/YYYY')
          }
        }
        
        // Fallback to original format if parsing fails
        return date.format('DD/MM/YYYY')
      }
      return 'תאריך'
    }
    return `${selectedDates.length} תאריכים`
  }

  const getTitlePlaceholder = () => {
    if (selectedDates.length === 0) return 'הקלד שם משימה...'
    
    const dateText = getDateText()
    return `${dateText} • הקלד שם משימה...`
  }


  const getDateButtonColors = () => {
    if (selectedDates.length === 0) return { 
      borderColor: '', 
      bgColor: '', 
      textColor: '', 
      iconColor: 'text-gray-500' 
    }
    
    if (selectedDates.length === 1) {
      const date = selectedDates[0]
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      
      // Create date strings in DD/MM/YYYY format
      const todayStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`
      const tomorrowStr = `${String(tomorrow.getDate()).padStart(2,'0')}/${String(tomorrow.getMonth()+1).padStart(2,'0')}/${tomorrow.getFullYear()}`
      const nextWeekStr = `${String(nextWeek.getDate()).padStart(2,'0')}/${String(nextWeek.getMonth()+1).padStart(2,'0')}/${nextWeek.getFullYear()}`
      
      if (date.format) {
        const dateString = date.format()
        
        // Check for special dates first
        if (dateString === todayStr) {
          return { 
            borderColor: 'border-green-300', 
            bgColor: 'bg-green-50', 
            textColor: 'text-green-700', 
            iconColor: 'text-green-700' 
          }
        } else if (dateString === tomorrowStr) {
          return { 
            borderColor: 'border-yellow-300', 
            bgColor: 'bg-yellow-50', 
            textColor: 'text-yellow-700', 
            iconColor: 'text-yellow-700' 
          }
        } else if (dateString === nextWeekStr) {
          return { 
            borderColor: 'border-purple-300', 
            bgColor: 'bg-purple-50', 
            textColor: 'text-purple-700', 
            iconColor: 'text-purple-700' 
          }
        }
      }
    }
    
    // Default gray colors for regular dates (original color)
    return { 
      borderColor: '', 
      bgColor: '', 
      textColor: 'text-[#808080]', 
      iconColor: 'text-[#808080]' 
    }
  }


  if (!isOpen) {
    return null
  }
  
  return (
    <>
    <div 
      className="fixed inset-0 bg-transparent flex items-start justify-center z-[9999] pt-[12vh]"
        onClick={handleCloseWithConfirmation}
    >
       <div 
         className={`rounded-lg shadow-2xl shadow-[0_0_30px_rgba(0,0,0,0.15)] w-[400px] max-h-[80vh] overflow-visible modal-container ${
           isAnimatingOut 
             ? 'opacity-0 transform translate-y-8 scale-95 transition-all duration-300 ease-out' 
             : modalVisible
             ? 'modal-visible'
             : ''
         }`}
        dir="rtl"
        style={{ backgroundColor: 'var(--color-main-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Form */}
          <form onSubmit={handleSubmit} className="" dir="rtl">
            {/* Top Section: title, description, quick actions */}
            <div className="pt-4 pr-4 pl-4 pb-1">
          {/* Task Title */}
            <div className="relative flex items-center w-full" dir="rtl">
              {selectedDates.length > 0 && showDateTag && (
                <span
                  className="bg-orange-100 hover:bg-orange-200 rounded-md font-medium transition-colors cursor-pointer select-none ml-2 flex-shrink-0"
                  style={{ 
                    color: '#202020',
                    padding: '4px',
                    fontSize: '14px'
                  }}
                  onClick={() => setShowDateTag(false)}
                >
                  {getDateText()}
                </span>
              )}
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="הקלד שם משימה..."
                className="flex-1 text-lg font-medium border-none outline-none placeholder-gray-400 hebrew-text"
                style={{ 
                  color: 'var(--color-text-primary)',
                  backgroundColor: 'var(--color-main-bg)'
                }}
              autoFocus
            />
          </div>

          {/* Task Description */}
          <div className="pb-1">
            <input
              type="text"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="תיאור"
              className="w-full text-sm text-gray-600 border-none outline-none placeholder-gray-400 hebrew-text"
              style={{ 
                color: 'var(--color-text-description)',
                backgroundColor: 'var(--color-main-bg)'
              }}
            />
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 mb-4">
            {/* Date Button */}
              <div className="relative" ref={datePickerRef}>
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`task-action-btn flex items-center justify-between focus:outline-none ${(() => {
                    const colors = getDateButtonColors()
                    return selectedDates.length > 0 
                      ? `${colors.borderColor} ${colors.bgColor}` 
                      : ''
                  })()}`}
                  style={{ height: '28px' }}
                >
                      <div className="flex items-center gap-2">
                    <CalendarIcon className={`w-3.5 h-3.5 ${getDateButtonColors().iconColor}`} />
                    <span className={`text-[13px] hebrew-text ${getDateButtonColors().textColor}`}>{getDateText()}</span>
                        </div>
                  {selectedDates.length > 0 && (
                          <div
                            onClick={(e) => {
                        e.stopPropagation()
                              setSelectedDates([])
                            }}
                      className="p-0.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0 mr-1 cursor-pointer"
                          >
                      <XMarkIcon className="w-3 h-3 text-gray-500" />
                          </div>
                  )}
                                  </button>

                {/* Date Picker Dropdown */}
                <DatePickerDropdown
                  isOpen={showDatePicker}
                  onClose={() => setShowDatePicker(false)}
                  selectedDates={selectedDates}
                  setSelectedDates={setSelectedDates}
                  selectedTime={selectedTime}
                  setSelectedTime={setSelectedTime}
                  showTimePicker={showTimePicker}
                  setShowTimePicker={setShowTimePicker}
                  showTimeDropdown={showTimeDropdown}
                  setShowTimeDropdown={setShowTimeDropdown}
                  generateTimeOptions={generateTimeOptions}
                  getDefaultTime={getDefaultTime}
                  duration={duration}
                  setDuration={setDuration}
                  timeZone={timeZone}
                  setTimeZone={setTimeZone}
                  repeatType={repeatType}
                  setRepeatType={setRepeatType}
                  showRepeatPicker={showRepeatPicker}
                  setShowRepeatPicker={setShowRepeatPicker}
                />
            </div>

            {/* Priority Selector */}
            <PrioritySelector
              value={priority}
              onChange={(p) => setPriority(p)}
            />

            {/* Reminders Button */}
            <button
              type="button"
                className="task-action-btn focus:outline-none"
                style={{ height: '28px' }}
            >
              <BellIcon className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-[13px] hebrew-text" style={{ color: 'var(--color-text-description)' }}>תזכורות</span>
            </button>

            {/* More Options Button */}
            <button
              type="button"
                className="task-action-btn focus:outline-none"
                style={{ height: '28px' }}
            >
              <EllipsisHorizontalIcon className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>

            </div>

            {/* Bottom Section: project selector and action buttons */}
            <div className="p-4 pt-3 border-t" style={{ borderColor: 'var(--color-secondary-hover)' }}>
          <div className="flex items-center justify-between ">
            {/* Project Selector */}
              <div className="relative" ref={projectDropdownRef}>
              <button
                type="button"
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  className={`flex items-center gap-1.5 px-2.5 text-[13px] text-gray-700 hover:bg-gray-100 rounded-md transition-colors focus:outline-none ${
                    showProjectDropdown ? 'bg-gray-100' : ''
                  }`}
                  style={{ height: '32px' }}
                >
                  {selectedProject === 'תיבת הדואר' ? (
                    <InboxIcon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <HashtagIcon className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="hebrew-text text-[13px]" style={{ color: '#666666' }}>{selectedProject}</span>
                <ChevronDownIcon className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {/* Project Dropdown */}
              {showProjectDropdown && (
                  <div className="absolute top-full right-0  w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-1.5 max-h-80 overflow-y-auto">
                    <input
                      type="text"
                      placeholder="הקלד שם פרויקט"
                      className="w-full p-1.5 border border-gray-300 rounded-md text-sm mb-1.5"
                    />
                    
                    {/* Inbox */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProject('תיבת הדואר')
                        setShowProjectDropdown(false)
                      }}
                        className={`w-full flex items-center gap-1.5 p-1.5 hover:bg-gray-100 rounded-md text-sm ${
                          selectedProject === 'תיבת הדואר' ? 'bg-gray-100' : ''
                        }`}
                    >
                        <InboxIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm hebrew-text flex-1 text-right">תיבת הדואר</span>
                      {selectedProject === 'תיבת הדואר' && <CheckIcon className="w-3.5 h-3.5 text-red-500" />}
                    </button>

                      {/* My Projects (header non-selectable) */}
                    {projects.filter(p => !p.team).length > 0 && (
                      <>
                          <div className="flex items-center gap-2 px-2  text-gray-500 cursor-default select-none">
                            {localStorage.getItem(`${currentUser}_avatar_url`) ? (
                              <div className="w-4 h-4 rounded-full overflow-hidden bg-green-500 flex items-center justify-center">
                                <img src={localStorage.getItem(`${currentUser}_avatar_url`)} alt="profile" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <UserIcon className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium hebrew-text">הפרוייקטים שלי</span>
                          </div>
                        {projects.filter(p => !p.team).map((project) => (
                          <button
                            key={project.id}
                            type="button"
                            onClick={() => {
                              setSelectedProject(project.name)
                              setShowProjectDropdown(false)
                            }}
                              className={`w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md ${
                                selectedProject === project.name ? 'bg-gray-100' : ''
                              }`}
                          >
                              <HashtagIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-base hebrew-text flex-1 text-right">{project.name}</span>
                            {selectedProject === project.name && <CheckIcon className="w-4 h-4 text-red-500" />}
                          </button>
                        ))}
                      </>
                    )}

                    {/* Team Projects */}
                    {teams.map((team) => {
                      const teamProjects = projects.filter(p => p.team?.id === team.id)
                      if (teamProjects.length === 0) return null

                      return (
                        <div key={team.id}>
                          <div className="flex items-center gap-2 px-2 py-1 mt-2">
                              <UserGroupIcon className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-gray-500">{team.name}</span>
                          </div>
                          {teamProjects.map((project) => (
                            <button
                              key={project.id}
                              type="button"
                              onClick={() => {
                                setSelectedProject(project.name)
                                setShowProjectDropdown(false)
                              }}
                                className={`w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md ${
                                  selectedProject === project.name ? 'bg-gray-100' : ''
                                }`}
                            >
                                <HashtagIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-base hebrew-text flex-1 text-right">{project.name}</span>
                              {selectedProject === project.name && <CheckIcon className="w-4 h-4 text-red-500" />}
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                  onClick={handleCloseWithConfirmation}
                  className="px-3 text-[13px] rounded-md transition-colors hebrew-text flex items-center focus:outline-none"
                  style={{ 
                    height: '32px', 
                    color: 'var(--color-text-primary)',
                    backgroundColor: 'var(--color-secondary-hover)'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-secondary)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-secondary-hover)'}
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={!taskTitle.trim()}
                  className="px-3 text-white text-[13px] font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed hebrew-text flex items-center hover:opacity-90 focus:outline-none"
                  style={{ 
                    height: '32px',
                    backgroundColor: 'var(--color-selected-icon)'
                  }}
                  onMouseEnter={(e) => {
                    if (!e.target.disabled) {
                      e.target.style.opacity = '0.9'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.target.disabled) {
                      e.target.style.opacity = '1'
                    }
                  }}
              >
                {selectedDates.length > 1 ? `הוסף ${selectedDates.length} משימות` : 'הוסף משימה'}
              </button>
            </div>
            </div>
          </div>
        </form>
      </div>
    </div>

      {/* Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] animate-fade-in">
          <div 
            className="rounded-lg shadow-2xl w-[320px] p-6 animate-scale-in"
            style={{ backgroundColor: 'var(--color-main-bg)' }}
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <h3 className="text-lg font-semibold mb-2 hebrew-text" style={{ color: 'var(--color-text-primary)' }}>
              לבטל שינויים שלא נשמרו?
            </h3>
            
            {/* Description */}
            <p className="mb-6 hebrew-text" style={{ color: 'var(--color-text-description)' }}>
              השינויים שלא נשמרו יבוטלו.
            </p>
            
            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={cancelDiscard}
                className="px-4 py-2 text-sm rounded-md transition-colors hebrew-text focus:outline-none"
                style={{ 
                  color: 'var(--color-text-primary)',
                  backgroundColor: 'var(--color-secondary-hover)'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-secondary)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-secondary-hover)'}
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={confirmDiscard}
                className="px-4 py-2 text-sm text-white font-medium rounded-md transition-colors hebrew-text focus:outline-none"
                style={{ backgroundColor: 'var(--color-selected-icon)' }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '1'
                }}
              >
                בטל
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TaskCreationModal