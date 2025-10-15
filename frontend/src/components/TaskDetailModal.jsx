import { useState, useRef, useEffect } from 'react'
import { 
  XMarkIcon, 
  EllipsisHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  CalendarIcon,
  FlagIcon,
  TagIcon,
  ClockIcon,
  MapPinIcon,
  CheckIcon,
  PlusIcon,
  InboxIcon,
  HashtagIcon,
  UserIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import HebrewCalendar from './HebrewCalendar'
import { taskAPI } from '../services/api'
import TodoistTaskCreator from './TodoistTaskCreator'
import DatePickerDropdown from './DatePickerDropdown'
import PrioritySelector from './PrioritySelector'

function TaskDetailModal({ isOpen, task, onClose, onUpdateTask, projects, teams, currentUser = '' }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task?.title || '')
  const [editDescription, setEditDescription] = useState(task?.description || '')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [subtasks, setSubtasks] = useState([])
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(true)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [isCommentExpanded, setIsCommentExpanded] = useState(false)
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [selectedDates, setSelectedDates] = useState([])
  const [selectedTime, setSelectedTime] = useState('')
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showTimeDropdown, setShowTimeDropdown] = useState(false)
  const [duration, setDuration] = useState('No duration')
  const [timeZone, setTimeZone] = useState('Floating time')
  const [repeatType, setRepeatType] = useState('No repeat')
  const [showRepeatPicker, setShowRepeatPicker] = useState(false)
  const modalRef = useRef(null)
  const datePickerRef = useRef(null)
  const projectDropdownRef = useRef(null)

  useEffect(() => {
    if (task) {
      setEditTitle(task.title || '')
      setEditDescription(task.description || '')
      // Load sub-tasks if they exist
      if (task.subtasks) {
        setSubtasks(task.subtasks)
      } else {
        setSubtasks([])
      }
      
      // Load comments if they exist
      if (task.comments) {
        setComments(task.comments)
      } else {
        setComments([])
      }
    }
  }, [task])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false)
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target)) {
        setShowProjectDropdown(false)
      }
    }

    if (showDatePicker || showProjectDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDatePicker, showProjectDropdown])

  useEffect(() => {
    const handleModalClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleModalClickOutside)
      return () => document.removeEventListener('mousedown', handleModalClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen || !task) return null

  const formatDate = (dateString) => {
    if (!dateString) return 'ללא תאריך'
    
    // Parse date string as local date (YYYY-MM-DD format)
    const dateParts = dateString.split('T')[0].split('-')
    const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
    
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'היום'
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'מחר'
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'אתמול'
    }
    
    return date.toLocaleDateString('he-IL', { 
      day: 'numeric', 
      month: 'short' 
    })
  }

  const getProjectInfo = () => {
    if (task.team) {
      const team = teams?.find(t => t.name === task.team)
      return { name: task.team, isTeam: true, team }
    }
    if (task.project && task.project !== 'תיבת הדואר') {
      const project = projects?.find(p => p.name === task.project)
      return { name: task.project, isTeam: false, project }
    }
    return { name: 'תיבת הדואר', isTeam: false, project: null }
  }

  const projectInfo = getProjectInfo()

  const handleSave = () => {
    const updatedTask = {
      ...task,
      title: editTitle.trim(),
      description: editDescription.trim()
    }
    onUpdateTask(updatedTask)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(task.title || '')
    setEditDescription(task.description || '')
    setIsEditing(false)
  }

  const handleDateSelect = (selectedDate) => {
    const updatedTask = {
      ...task,
      due_time: selectedDate
    }
    onUpdateTask(updatedTask)
    setShowDatePicker(false)
  }

  // Helper functions for DatePickerDropdown
  const generateTimeOptions = () => {
    const defaultTime = getDefaultTime()
    const options = []
    options.push(defaultTime)
    const [defaultHour, defaultMinute] = defaultTime.split(':').map(Number)
    const defaultTimeInMinutes = defaultHour * 60 + defaultMinute
    for (let i = 1; i <= 15; i++) {
      const nextTimeInMinutes = defaultTimeInMinutes + (i * 15)
      const nextHour = Math.floor(nextTimeInMinutes / 60) % 24
      const nextMinute = nextTimeInMinutes % 60
      const nextTimeString = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`
      options.push(nextTimeString)
    }
    return options
  }

  const getDefaultTime = () => {
    const now = new Date()
    const minutes = now.getMinutes()
    const roundedMinutes = Math.ceil(minutes / 15) * 15
    const hour = roundedMinutes >= 60 ? now.getHours() + 1 : now.getHours()
    const finalHour = hour >= 24 ? 0 : hour
    const finalMinutes = roundedMinutes >= 60 ? 0 : roundedMinutes
    return `${finalHour.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`
  }

  const handleProjectChange = (projectName) => {
    const updatedTask = {
      ...task,
      project: projectName === 'תיבת הדואר' ? '' : projectName
    }
    onUpdateTask(updatedTask)
    setShowProjectDropdown(false)
  }

  const handlePriorityChange = (newPriority) => {
    const updatedTask = {
      ...task,
      priority: newPriority
    }
    onUpdateTask(updatedTask)
  }

  const getPriorityText = (priority) => {
    switch (priority) {
      case 1: return 'נמוכה'
      case 2: return 'רגילה'
      case 3: return 'גבוהה'
      case 4: return 'דחופה'
      default: return 'רגילה'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'text-gray-600'
      case 2: return 'text-blue-600'
      case 3: return 'text-orange-600'
      case 4: return 'text-red-600'
      default: return 'text-blue-600'
    }
  }

  const handleAddSubtask = async (subtaskData) => {
    try {
      // Create subtask using regular task creation with parent_task field
      const newSubtask = await taskAPI.createTask({
        title: subtaskData.title,
        description: subtaskData.description || '',
        priority: subtaskData.priority || 4,
        due_time: subtaskData.due_time || '',
        due_date: subtaskData.due_date || '',
        project_name: task.project || '',
        parent_task: task.id,  // This makes it a subtask
        completed: false
      })

      setSubtasks(prev => [...prev, newSubtask])
      setIsAddingSubtask(false)
      
      // Update parent task to reflect the new sub-task
      const updatedTask = { ...task, subtasks: [...subtasks, newSubtask] }
      onUpdateTask(updatedTask)
    } catch (error) {
      console.error('Error creating sub-task:', error)
    }
  }

  const handleSubtaskToggle = async (subtaskId) => {
    try {
      const updatedSubtask = await taskAPI.toggleSubtask(subtaskId)
      setSubtasks(prev => 
        prev.map(subtask => 
          subtask.id === subtaskId ? updatedSubtask : subtask
        )
      )
    } catch (error) {
      console.error('Error toggling sub-task:', error)
    }
  }

  const handleSubtaskUpdate = async (subtaskId, updatedData) => {
    try {
      const updatedSubtask = await taskAPI.updateTask(subtaskId, updatedData)
      setSubtasks(prev => 
        prev.map(subtask => 
          subtask.id === subtaskId ? updatedSubtask : subtask
        )
      )
    } catch (error) {
      console.error('Error updating sub-task:', error)
    }
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment = {
      id: Date.now(),
      text: newComment.trim(),
      author: 'לירון', // Current user name
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    }

    const updatedComments = [...comments, comment]
    setComments(updatedComments)
    setNewComment('')
    setIsCommentExpanded(false)

    // Update the task with the new comment
    const updatedTask = {
      ...task,
      comments: updatedComments
    }
    onUpdateTask(updatedTask)
  }

  const handleCancelComment = () => {
    setNewComment('')
    setIsCommentExpanded(false)
  }

  const formatCommentTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) {
      return 'כרגע'
    } else if (diffInMinutes < 60) {
      return `לפני ${diffInMinutes} דקות`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `לפני ${hours} שעות`
    } else {
      return date.toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 md:flex md:items-center md:justify-center z-[9999]" dir="rtl">
      <style>
        {`
          .priority-no-border button {
            border: none !important;
            padding-right: 0 !important;
          }
        `}
      </style>
      <div 
        ref={modalRef}
        className="bg-white md:rounded-lg shadow-xl w-full md:max-w-4xl h-full md:h-[80vh] flex flex-col overflow-hidden z-[9999]"
      >
        {/* Header - Full Width */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            {/* Mobile: Show Inbox icon with text */}
            <div className="md:hidden flex items-center gap-2">
              <InboxIcon className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600 hebrew-text">{projectInfo.name}</span>
            </div>
            {/* Desktop: Original layout */}
            <div className="hidden md:flex items-center space-x-3 space-x-reverse">
            <div className="w-4 h-4 bg-gray-400 rounded-full flex-shrink-0"></div>
            <span className="text-base text-gray-500 hebrew-text">
              {projectInfo.isTeam ? '🏢' : '📝'} {projectInfo.name}
            </span>
          </div>
          </div>
          <div className="flex items-center gap-1 md:space-x-2 md:space-x-reverse">
            {/* Mobile: Show only necessary buttons */}
            <button className="hidden md:block p-2 hover:bg-gray-100 rounded-md transition-colors">
              <ChevronUpIcon className="w-5 h-5 text-gray-500" />
            </button>
            <button className="hidden md:block p-2 hover:bg-gray-100 rounded-md transition-colors">
              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
              <EllipsisHorizontalIcon className="w-5 h-5 text-gray-500" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" style={{ strokeWidth: 1.5 }} />
            </button>
          </div>
        </div>

        {/* Body - Main Content + Sidebar */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-white">
            {/* Content */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
              <div className="max-w-2xl">
                {/* Task Completion Circle + Unified Edit Box */}
                <div className="flex items-start space-x-3 space-x-reverse mb-6">
                  {/* Completion Circle */}
                  <button
                    onClick={() => {
                      const updatedTask = { ...task, completed: !task.completed }
                      onUpdateTask(updatedTask)
                    }}
                    className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors mt-1 ${
                      task.completed 
                        ? 'bg-[#999999] border-[#999999]' 
                        : 'border-gray-400 bg-white'
                    }`}
                  >
                    {task.completed && (
                      <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />
                    )}
                  </button>

                  {/* Unified Edit Box */}
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="border-2 border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full text-xl font-semibold text-gray-900 hebrew-text bg-transparent border-none px-3 py-2 focus:outline-none"
                          placeholder="כותרת המשימה"
                          autoFocus
                        />
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full text-gray-600 hebrew-text bg-transparent border-none px-3 py-1 pb-2 focus:outline-none resize-none"
                          placeholder="תיאור"
                          rows={2}
                        />
                      </div>
                    ) : (
                      <div 
                        onClick={() => setIsEditing(true)}
                        className="cursor-pointer hover:bg-gray-50 rounded-md transition-colors border border-transparent hover:border-gray-200"
                      >
                        <h1 className="text-xl font-semibold text-primary hebrew-text mb-1">
                          {task.title}
                        </h1>
                        <p className="text-primary hebrew-text text-sm font-normal">
                          {task.description || 'תיאור'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit Actions */}
                {isEditing && (
                  <div className="flex space-x-3 space-x-reverse mb-6">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-base hebrew-text"
                    >
                      שמור
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-base hebrew-text"
                    >
                      ביטול
                    </button>
                  </div>
                )}

                {/* Mobile: Inline metadata (Project, Date, Priority) */}
                <div className="md:hidden mb-6">
                  {/* Project Selector */}
                  <div className="relative" ref={projectDropdownRef}>
                    <button
                      onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                      className="w-full flex items-center gap-2 py-3 hover:bg-gray-50 rounded-md cursor-pointer"
                    >
                      {projectInfo.name === 'תיבת הדואר' ? (
                        <InboxIcon className="w-5 h-5 text-gray-500" />
                      ) : (
                        <HashtagIcon className="w-5 h-5 text-gray-500" />
                      )}
                      <span className="text-sm text-gray-700 hebrew-text flex-1 text-right">{projectInfo.name}</span>
                      <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                    </button>

                    {/* Project Dropdown */}
                    {showProjectDropdown && (
                      <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                        <div className="p-1.5">
                          {/* Inbox */}
                          <button
                            onClick={() => handleProjectChange('תיבת הדואר')}
                            className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md"
                          >
                            <InboxIcon className="w-5 h-5 text-gray-500" />
                            <span className="text-sm hebrew-text flex-1 text-right">תיבת הדואר</span>
                            {projectInfo.name === 'תיבת הדואר' && <CheckIcon className="w-4 h-4 text-red-500" />}
                          </button>

                          {/* My Projects */}
                          {projects && projects.filter(p => !p.team).length > 0 && (
                            <>
                              <div className="flex items-center gap-2 px-2 py-1 mt-2 text-gray-500">
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
                                  onClick={() => handleProjectChange(project.name)}
                                  className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md"
                                >
                                  <HashtagIcon className="w-5 h-5 text-gray-400" />
                                  <span className="text-sm hebrew-text flex-1 text-right">{project.name}</span>
                                  {projectInfo.name === project.name && <CheckIcon className="w-4 h-4 text-red-500" />}
                                </button>
                              ))}
                            </>
                          )}

                          {/* Teams */}
                          {teams && teams.map((team) => {
                            const teamProjects = projects?.filter(p => p.team?.id === team.id) || []
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
                                    onClick={() => handleProjectChange(project.name)}
                                    className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md"
                                  >
                                    <HashtagIcon className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm hebrew-text flex-1 text-right">{project.name}</span>
                                    {projectInfo.name === project.name && <CheckIcon className="w-4 h-4 text-red-500" />}
                                  </button>
                                ))}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <hr className="border-gray-200" />

                  {/* Date Picker */}
                  <div className="relative" ref={datePickerRef}>
                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="w-full flex items-center gap-2 py-3 hover:bg-gray-50 rounded-md cursor-pointer"
                    >
                      <CalendarIcon className="w-5 h-5 text-red-600" />
                      <span className="text-sm text-red-600 hebrew-text flex-1 text-right">{formatDate(task.due_time)}</span>
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

                  {/* Divider */}
                  <hr className="border-gray-200" />

                  {/* Priority Selector */}
                  <div className="flex items-center gap-2 ">
                    <div className="priority-no-border">
                      <PrioritySelector
                        value={task.priority || 4}
                        onChange={handlePriorityChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Gray divider above sub-tasks (mobile only, only if subtasks exist) */}
                {subtasks.length > 0 && (
                  <div className="md:hidden mb-4" style={{ height: '8px', backgroundColor: '#f3f3f3', width: 'calc(100% + 3rem)', marginLeft: '-1.5rem', marginRight: '-1.5rem' }}></div>
                )}

                {/* Sub-tasks Section */}
                <div className="mb-6">
                  {/* Existing Sub-tasks */}
                  {subtasks.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 space-x-reverse mb-3 relative">
                        <button
                          onClick={() => setIsSubtasksExpanded(!isSubtasksExpanded)}
                          className="hover:bg-gray-100 rounded transition-colors" 
                          style={{ padding: '0.250rem' }}
                        >
                          {isSubtasksExpanded ? (
                            <ChevronDownIcon className="w-3 h-3 text-gray-900" />
                          ) : (
                            <ChevronLeftIcon className="w-3 h-3 text-gray-900" />
                          )}
                        </button>
                        <span className="text-base font-medium text-gray-700 hebrew-text">
                          תת-משימות {subtasks.filter(s => s.is_completed).length}/{subtasks.length}
                        </span>
                      </div>
                      
                      {isSubtasksExpanded && (
                        <div className="space-y-3 mr-6">
                          {subtasks.map((subtask) => (
                            <div key={subtask.id} className="flex items-center space-x-3 space-x-reverse relative pb-2">
                              <button
                                onClick={() => handleSubtaskToggle(subtask.id)}
                                className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
                                  subtask.is_completed 
                                    ? 'bg-[#999999] border-[#999999]' 
                                    : 'border-gray-400 bg-white'
                                }`}
                              >
                                {subtask.is_completed && (
                                  <CheckIcon className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                )}
                              </button>
                              <span className={`text-base hebrew-text flex-1 ${
                                subtask.is_completed 
                                  ? 'line-through text-gray-500' 
                                  : 'text-gray-700'
                              }`}>
                                {subtask.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add New Sub-task */}
                    <div className="mr-6">
                    <TodoistTaskCreator
                      isOpen={isAddingSubtask}
                      onClose={() => setIsAddingSubtask(true)}
                      onCreateTask={handleAddSubtask}
                      onCancel={() => setIsAddingSubtask(false)}
                      currentView="subtask"
                      projects={projects}
                      teams={teams}
                      currentUser=""
                        />
                      </div>
                </div>

                {/* Comments Section */}
                <div className="">

                  
                  {/* Existing Comments */}
                  {comments.length > 0 && (
                    <div className="space-y-4 mb-6">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-3 space-x-reverse">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {comment.author?.charAt(0) || 'ל'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 space-x-reverse mb-1">
                              <span className="text-sm font-medium text-gray-900 hebrew-text">
                                {comment.author || 'לירון'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatCommentTime(comment.timestamp || comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 hebrew-text break-words">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Comment - Compact Design */}
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      ל
                    </div>
                    <div className="flex-1 min-w-0">
                      {!isCommentExpanded ? (
                        /* Compact State */
                        <div 
                          onClick={() => setIsCommentExpanded(true)}
                          className="border border-gray-200 rounded-lg px-3 py-2 cursor-text hover:border-gray-300 transition-colors"
                        >
                          <span className="text-sm text-gray-400 hebrew-text">הערה</span>
                        </div>
                      ) : (
                        /* Expanded State */
                        <div className="border border-gray-200 rounded-lg bg-white">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="הערה"
                            className="w-full px-3 py-2 text-sm border-none bg-transparent text-gray-700 hebrew-text focus:outline-none resize-none"
                            rows={3}
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                handleAddComment()
                              }
                            }}
                          />
                          <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                              </button>
                              <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                              </button>
                              <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <button
                                onClick={handleCancelComment}
                                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors hebrew-text"
                              >
                                ביטול
                              </button>
                              <button
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hebrew-text"
                              >
                                הערה
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar (appears on right in RTL) - Hidden on mobile */}
          <div 
            className="hidden md:block w-80 border-l border-gray-200 p-6 overflow-y-auto"
            style={{ backgroundColor: 'var(--modal-sidebar-bg)' }}
          >
            <div className={`space-y-6 ${isEditing ? 'opacity-50' : ''}`}>
              {/* Project Selector */}
              <div className="relative" ref={projectDropdownRef}>
                <label className="block text-xs font-medium text-gray-700 hebrew-text mb-2">
                  פרויקט
                </label>
                <button
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                >
                  {projectInfo.name === 'תיבת הדואר' ? (
                    <InboxIcon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <HashtagIcon className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="text-xs text-gray-600 hebrew-text flex-1 text-right">{projectInfo.name}</span>
                  <ChevronDownIcon className="w-3 h-3 text-gray-500" />
                </button>

                {/* Project Dropdown */}
                {showProjectDropdown && (
                  <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    <div className="p-1.5">
                      {/* Inbox */}
                      <button
                        onClick={() => handleProjectChange('תיבת הדואר')}
                        className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md"
                      >
                        <InboxIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-xs hebrew-text flex-1 text-right">תיבת הדואר</span>
                        {projectInfo.name === 'תיבת הדואר' && <CheckIcon className="w-3 h-3 text-red-500" />}
                      </button>

                      {/* My Projects */}
                      {projects && projects.filter(p => !p.team).length > 0 && (
                        <>
                          <div className="flex items-center gap-2 px-2 py-1 mt-2 text-gray-500">
                            {localStorage.getItem(`${currentUser}_avatar_url`) ? (
                              <div className="w-3 h-3 rounded-full overflow-hidden bg-green-500 flex items-center justify-center">
                                <img src={localStorage.getItem(`${currentUser}_avatar_url`)} alt="profile" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <UserIcon className="w-3 h-3" />
                            )}
                            <span className="text-xs font-medium hebrew-text">הפרוייקטים שלי</span>
                          </div>
                          {projects.filter(p => !p.team).map((project) => (
                            <button
                              key={project.id}
                              onClick={() => handleProjectChange(project.name)}
                              className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md"
                            >
                              <HashtagIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-xs hebrew-text flex-1 text-right">{project.name}</span>
                              {projectInfo.name === project.name && <CheckIcon className="w-3 h-3 text-red-500" />}
                            </button>
                          ))}
                        </>
                      )}

                      {/* Teams */}
                      {teams && teams.map((team) => {
                        const teamProjects = projects?.filter(p => p.team?.id === team.id) || []
                        if (teamProjects.length === 0) return null
                        return (
                          <div key={team.id}>
                            <div className="flex items-center gap-2 px-2 py-1 mt-2">
                              <UserGroupIcon className="w-3 h-3 text-blue-500" />
                              <span className="text-xs font-medium text-gray-500">{team.name}</span>
                            </div>
                            {teamProjects.map((project) => (
                              <button
                                key={project.id}
                                onClick={() => handleProjectChange(project.name)}
                                className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md"
                              >
                                <HashtagIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-xs hebrew-text flex-1 text-right">{project.name}</span>
                                {projectInfo.name === project.name && <CheckIcon className="w-3 h-3 text-red-500" />}
                              </button>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                </div>
                )}
              </div>

              {/* Date Picker */}
              <div className="relative" ref={datePickerRef}>
                <label className="block text-xs font-medium text-gray-700 hebrew-text mb-2">
                  תאריך
                </label>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center space-x-2 space-x-reverse p-2 rounded-md hover:bg-gray-100 transition-colors w-full text-right"
                >
                  <CalendarIcon className="w-4 h-4 text-red-600" />
                  <span className="text-xs text-red-600 hebrew-text">
                    {formatDate(task.due_time)}
                  </span>
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

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-gray-700 hebrew-text mb-2">
                  עדיפות
                </label>
                <PrioritySelector
                  value={task.priority || 4}
                  onChange={handlePriorityChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskDetailModal
