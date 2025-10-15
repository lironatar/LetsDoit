import { useState, useRef, useEffect } from 'react'
import { 
  CalendarIcon, 
  FlagIcon, 
  BellIcon, 
  ChevronDownIcon,
  InboxIcon,
  HashtagIcon,
  UserGroupIcon,
  UserIcon,
  CheckIcon,
  EllipsisHorizontalIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import SendIcon from './icons/SendIcon'
import CloseButtonIcon from './icons/CloseButtonIcon'
import PrioritySelector from './PrioritySelector'
import DatePickerDropdown from './DatePickerDropdown'

function TodoistTaskCreator({ 
  isOpen, 
  onClose, 
  onCreateTask, 
  onCancel, 
  currentView, 
  projects = [], 
  teams = [],
  timeSlot = null,
  currentUser = ''
}) {
  const [taskTitle, setTaskTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showDescription, setShowDescription] = useState(false)
  const [selectedProject, setSelectedProject] = useState('תיבת הדואר')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [priority, setPriority] = useState(4)
  const [hasToday, setHasToday] = useState(currentView === 'today' || !!timeSlot)
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [selectedDates, setSelectedDates] = useState([])
  const [selectedTime, setSelectedTime] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showTimeDropdown, setShowTimeDropdown] = useState(false)
  const [duration, setDuration] = useState('No duration')
  const [timeZone, setTimeZone] = useState('Floating time')
  const [repeatType, setRepeatType] = useState('No repeat')
  const [showRepeatPicker, setShowRepeatPicker] = useState(false)
  const [datePickerPosition, setDatePickerPosition] = useState('bottom')
  
  const inputRef = useRef(null)
  const projectDropdownRef = useRef(null)
  const datePickerRef = useRef(null)

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

  // Get date button display text
  const getDateText = () => {
    if (selectedDates.length === 0) return 'תאריך'
    if (selectedDates.length === 1) {
      const date = selectedDates[0]
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      const currentYear = today.getFullYear()
      
      // Create date strings in DD/MM/YYYY format
      const todayStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`
      const tomorrowStr = `${String(tomorrow.getDate()).padStart(2,'0')}/${String(tomorrow.getMonth()+1).padStart(2,'0')}/${tomorrow.getFullYear()}`
      
      if (date.format) {
        const dateString = date.format()
        
        // Check for special dates first
        if (dateString === todayStr) {
          return 'היום'
        } else if (dateString === tomorrowStr) {
          return 'מחר'
        }
        
        // Parse DD/MM/YYYY format correctly for regular dates
        const parts = dateString.split('/')
        if (parts.length === 3) {
          const day = parseInt(parts[0])
          const month = parseInt(parts[1])
          const year = parseInt(parts[2])
          const dateObj = new Date(year, month - 1, day)
          const selectedYear = dateObj.getFullYear()
          
          if (selectedYear === currentYear) {
            return date.format('DD/MM')
          } else {
            return date.format('DD/MM/YYYY')
          }
        }
        
        return date.format('DD/MM/YYYY')
      }
      return 'תאריך'
    }
    return `${selectedDates.length} תאריכים`
  }

  // Convert date format from DD/MM/YYYY to YYYY-MM-DD
  const convertToYYYYMMDD = (date) => {
    if (!date || !date.format) return ''
    const dateString = date.format()
    const parts = dateString.split('/')
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }
    return ''
  }

  // Function to detect if dropdown should open above or below
  const detectDropdownPosition = () => {
    if (datePickerRef.current) {
      const rect = datePickerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const dropdownHeight = 400 // Approximate height of DatePickerDropdown
      
      // If there's not enough space below (less than 450px), open above
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDatePickerPosition('top')
      } else {
        setDatePickerPosition('bottom')
      }
    }
  }

  // Auto-focus when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Close project dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target)) {
        setShowProjectDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
      setSelectedTeam(teamId)
      // Auto-select first team project
      const teamProjects = projects.filter(p => p.team?.id == teamId)
      if (teamProjects.length > 0) {
        setSelectedProject(teamProjects[0].name)
      }
    } else {
      setSelectedProject('תיבת הדואר')
    }
  }, [currentView, projects])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!taskTitle.trim()) return

    const newTask = {
      id: Date.now(),
      title: taskTitle.trim(),
      description: description.trim(),
      priority,
      due_time: selectedDates.length > 0 
        ? convertToYYYYMMDD(selectedDates[0])
        : (timeSlot ? timeSlot.due_date : (currentView === 'today' ? (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() : '')),
      due_date: selectedDates.length > 0 
        ? convertToYYYYMMDD(selectedDates[0])
        : (timeSlot ? timeSlot.due_date : (currentView === 'today' ? (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() : '')),
      start_time: timeSlot ? timeSlot.due_time : '',
      end_time: timeSlot ? timeSlot.end_time : '',
      estimated_duration: timeSlot ? 30 : undefined, // 30 minutes for calendar tasks
      completed: false,
      project: selectedProject === 'תיבת הדואר' ? '' : selectedProject,
      team_id: selectedTeam || null,
    }

    onCreateTask(newTask)
    handleCancel()
  }

  const handleCancel = () => {
    setTaskTitle('')
    setDescription('')
    setShowDescription(false)
    setSelectedProject('תיבת הדואר')
    setSelectedTeam('')
    setPriority(4)
    setHasToday(true)
    setShowProjectDropdown(false)
    setSelectedDates([])
    setSelectedTime('')
    setShowDatePicker(false)
    setShowTimePicker(false)
    setShowTimeDropdown(false)
    setDuration('No duration')
    setTimeZone('Floating time')
    setRepeatType('No repeat')
    setShowRepeatPicker(false)
    onCancel()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const getSelectedProjectName = () => {
    return selectedProject
  }

  const getSelectedTeamName = () => {
    if (!selectedTeam) return ''
    const team = teams.find(t => t.id == selectedTeam)
    return team ? team.name : ''
  }

  const getPriorityColor = () => {
    switch (priority) {
      case 1: return 'var(--color-text-description)'
      case 2: return '#246fe0'
      case 3: return '#eb8909'
      case 4: return 'var(--color-selected-icon)'
      default: return 'var(--color-text-description)'
    }
  }

  const getPriorityName = () => {
    switch (priority) {
      case 1: return 'נמוכה'
      case 2: return 'בינונית'
      case 3: return 'גבוהה'
      case 4: return 'דחופה'
      default: return 'נמוכה'
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => onClose()}
        className="group flex items-start py-2 transition-colors w-full"
      >
        <div className="w-5 h-5 ml-3 mt-0.5 flex items-center justify-center transition-all duration-200">
          <div className="w-5 h-5 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ backgroundColor: 'var(--color-add-task-icon)' }}>
            <PlusIcon className="w-3 h-3" />
          </div>
          <PlusIcon className="w-5 h-5 absolute group-hover:opacity-0 transition-opacity duration-200" style={{ color: 'var(--color-add-task-icon)' }} />
        </div>
        <span className="hebrew-text text-base mr-5 group-hover:text-selected-icon transition-colors" style={{ color: 'var(--color-text-description)' }}>הוסף משימה</span>
      </button>
    )
  }

  return (
    <div className="main-bg border border-gray-200 rounded-lg shadow-sm " dir="rtl" style={{ backgroundColor: 'var(--color-main-bg)', borderColor: 'var(--color-secondary-hover)' }}>
      <form onSubmit={handleSubmit}>
        {/* Top Section: title, description, and action buttons */}
        <div className="pt-2 pr-2 pl-2">
          {/* Task Title */}
          <div>
            <input
              ref={inputRef}
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="שם המשימה"
              className="w-full text-lg font-medium border-none outline-none placeholder-gray-400 hebrew-text"
              style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-main-bg)' }}
              autoFocus
            />
          </div>

          {/* Task Description */}
          <div className="pb-1">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="תיאור"
              className="w-full text-sm text-gray-600 border-none outline-none placeholder-gray-400 hebrew-text"
              style={{ color: 'var(--color-text-description)', backgroundColor: 'var(--color-main-bg)' }}
            />
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 mb-4">
            {/* Date Button */}
            <div className="relative" ref={datePickerRef}>
            <button
              type="button"
                onClick={() => {
                  if (!showDatePicker) {
                    detectDropdownPosition()
                  }
                  setShowDatePicker(!showDatePicker)
                }}
              className="flex items-center gap-1.5 px-2.5 text-sm rounded-md transition-colors hebrew-text"
              style={{ 
                height: '28px',
                color: 'var(--color-text-primary)',
                backgroundColor: 'var(--color-main-bg)',
                borderColor: 'var(--color-secondary-hover)',
                border: '1px solid'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-secondary-hover)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-main-bg)'}
            >
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm hebrew-text">{getDateText()}</span>
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
                position={datePickerPosition}
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
              className="flex items-center gap-1.5 px-2.5 text-sm rounded-md transition-colors hebrew-text"
              style={{ 
                height: '28px',
                color: 'var(--color-text-primary)',
                backgroundColor: 'var(--color-main-bg)',
                borderColor: 'var(--color-secondary-hover)',
                border: '1px solid'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-secondary-hover)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-main-bg)'}
            >
              <BellIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm hebrew-text">תזכורות</span>
            </button>

            {/* More Options Button */}
            <button
              type="button"
              onClick={() => setShowDescription(!showDescription)}
              className="flex items-center gap-1.5 px-2.5 text-sm rounded-md transition-colors hebrew-text"
              style={{ 
                height: '28px',
                color: 'var(--color-text-primary)',
                backgroundColor: 'var(--color-main-bg)',
                borderColor: 'var(--color-secondary-hover)',
                border: '1px solid'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-secondary-hover)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-main-bg)'}
            >
              <EllipsisHorizontalIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Bottom Section: project selector and main action buttons with top border */}
        <div className="p-2 border-t" style={{ borderColor: 'var(--color-secondary-hover)' }}>
          <div className="flex items-center justify-between">
            {/* Left side: Project selector */}
            <div className="flex items-center gap-2">
              {/* Project Selector */}
              <div className="relative" ref={projectDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors hebrew-text font-medium ${
                    showProjectDropdown ? 'bg-gray-100' : ''
                  }`}
                >
                  {selectedProject === 'תיבת הדואר' ? (
                    <InboxIcon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <HashtagIcon className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="hebrew-text text-sm font-medium">{getSelectedProjectName()}</span>
                  <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                </button>

                {/* Project Dropdown */}
                {showProjectDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-1.5 max-h-80 overflow-y-auto">
                      {/* Inbox button */}
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
                        {selectedProject === 'תיבת הדואר' && <CheckIcon className="w-4 h-4 text-selected-icon" />}
                      </button>

                      {/* My Projects header */}
                      {projects.filter(p => !p.team).length > 0 && (
                        <>
                          <div className="flex items-center gap-2 px-2 py-1 mt-2 text-gray-500 cursor-default select-none">
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
                              className={`w-full flex items-center gap-1.5 p-1.5 hover:bg-gray-100 rounded-md text-sm ${
                                selectedProject === project.name ? 'bg-gray-100' : ''
                              }`}
                            >
                              <HashtagIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm hebrew-text flex-1 text-right">{project.name}</span>
                              {selectedProject === project.name && <CheckIcon className="w-4 h-4 text-selected-icon" />}
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
                                className={`w-full flex items-center gap-1.5 p-1.5 hover:bg-gray-100 rounded-md text-sm ${
                                  selectedProject === project.name ? 'bg-gray-100' : ''
                                }`}
                              >
                                <HashtagIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm hebrew-text flex-1 text-right">{project.name}</span>
                                {selectedProject === project.name && <CheckIcon className="w-4 h-4 text-selected-icon" />}
                              </button>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Cancel & Add Task Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="w-8 h-8 md:w-auto md:h-auto md:px-3 md:py-1.5 flex items-center justify-center rounded-md transition-colors hebrew-text font-medium"
                style={{ 
                  color: 'var(--color-text-primary)',
                  backgroundColor: 'var(--color-secondary-hover)'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-secondary)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-secondary-hover)'}
              >
                {/* Mobile: Show icon, Desktop: Show text */}
                <span className="md:hidden">
                  <CloseButtonIcon className="w-4 h-4" />
                </span>
                <span className="hidden md:inline text-sm">ביטול</span>
              </button>
              <button
                type="submit"
                disabled={!taskTitle.trim()}
                className="w-8 h-8 md:w-auto md:h-auto md:px-3 md:py-1 flex items-center justify-center text-white text-xs font-semibold rounded hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hebrew-text"
                style={{ backgroundColor: 'var(--color-selected-icon)' }}
              >
                {/* Mobile: Show icon, Desktop: Show text */}
                <span className="md:hidden">
                  <SendIcon className="w-4 h-4" />
                </span>
                <span className="hidden md:inline text-xs">הוסף משימה</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default TodoistTaskCreator
