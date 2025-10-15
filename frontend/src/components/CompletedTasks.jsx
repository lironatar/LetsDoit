import { useState, useEffect } from 'react'
import { CheckCircleIcon, InboxIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { HashtagIcon } from '@heroicons/react/24/solid'
import { taskAPI } from '../services/api'

function CompletedTasks({ projects, currentUser, onNavigate, onOpenTaskDetail }) {
  const [completedTasks, setCompletedTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState('all') // 'all', 'inbox', or project name
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  // Hebrew day names
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
  
  // Hebrew month names
  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ]

  // Load completed tasks when component mounts
  useEffect(() => {
    loadCompletedTasks()
  }, [])

  const loadCompletedTasks = async () => {
    setLoading(true)
    try {
      // Fetch all tasks from API
      const allTasks = await taskAPI.getTasks()
      // Filter only completed tasks
      const completed = allTasks.filter(task => task.completed)
      setCompletedTasks(completed)
    } catch (error) {
      console.error('Failed to load completed tasks:', error)
      // Fallback: try to load from localStorage if API fails
      const username = localStorage.getItem('username') || ''
      const tasksKey = `${username}_todoist_tasks`
      const savedTasks = localStorage.getItem(tasksKey)
      if (savedTasks) {
        const tasks = JSON.parse(savedTasks)
        const completed = tasks.filter(task => task.completed)
        setCompletedTasks(completed)
      }
    } finally {
      setLoading(false)
    }
  }

  // Get filtered tasks based on selected filter
  const getFilteredTasks = () => {
    if (selectedFilter === 'all') {
      return completedTasks
    } else if (selectedFilter === 'inbox') {
      return completedTasks.filter(task => !task.project || task.project === '')
    } else {
      // Filter by specific project
      return completedTasks.filter(task => task.project === selectedFilter)
    }
  }

  // Format completion date for daily titles
  const formatCompletionDate = (completedAt) => {
    if (!completedAt) return ''
    
    const date = new Date(completedAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return `${date.getDate()} ${monthNames[date.getMonth()].substring(0, 3)} • היום • ${dayNames[date.getDay()]}`
    }
    
    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `${date.getDate()} ${monthNames[date.getMonth()].substring(0, 3)} • אתמול • ${dayNames[date.getDay()]}`
    }
    
    // For other dates, show the date with day name
    return `${date.getDate()} ${monthNames[date.getMonth()].substring(0, 3)} • ${dayNames[date.getDay()]}`
  }

  // Format completion time for individual tasks
  const formatCompletionTime = (completedAt) => {
    if (!completedAt) return ''
    
    try {
      const date = new Date(completedAt)
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid date:', completedAt)
        return ''
      }
      
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      
      // Format time as HH:MM
      const timeString = date.toLocaleTimeString('he-IL', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
      
      // Check if it's today
      if (date.toDateString() === today.toDateString()) {
        return `היום ב-${timeString}`
      }
      
      // Check if it's yesterday
      if (date.toDateString() === yesterday.toDateString()) {
        return `אתמול ב-${timeString}`
      }
      
      // For other dates, show date and time
      const dateString = date.toLocaleDateString('he-IL', { 
        day: 'numeric', 
        month: 'short' 
      })
      return `${dateString} ב-${timeString}`
    } catch (error) {
      console.error('Error formatting completion time:', error, completedAt)
      return ''
    }
  }

  // Group tasks by completion date
  const groupTasksByCompletionDate = () => {
    const filteredTasks = getFilteredTasks()
    
    // Group tasks by completion date
    const grouped = filteredTasks.reduce((groups, task) => {
      const completionDate = task.completed_at || task.created_at // fallback to created_at if no completion date
      const dateKey = new Date(completionDate).toDateString()
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: completionDate,
          title: formatCompletionDate(completionDate),
          tasks: []
        }
      }
      
      groups[dateKey].tasks.push(task)
      return groups
    }, {})
    
    // Convert to array and sort by date (newest first)
    return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  const getFilterLabel = () => {
    if (selectedFilter === 'all') return 'כל הפרויקטים'
    if (selectedFilter === 'inbox') return 'תיבת הדואר'
    return selectedFilter
  }

  const handleNavigateToProject = (task) => {
    if (task.project) {
      // Find project by name
      const project = projects.find(p => p.name === task.project)
      if (project) {
        onNavigate(`project-${project.id}`)
      }
    } else {
      onNavigate('inbox')
    }
  }

  const groupedTasks = groupTasksByCompletionDate()

  // Get user avatar
  const userAvatarUrl = localStorage.getItem(`${currentUser}_avatar_url`)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 hebrew-text">טוען משימות שהושלמו...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with Filter */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold hebrew-text text-primary">משימות שהושלמו</h1>
        
        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm hebrew-text text-gray-700">{getFilterLabel()}</span>
          </button>

          {/* Dropdown Menu */}
          {showFilterDropdown && (
            <div className="absolute left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-2 max-h-96 overflow-y-auto">
                {/* All Projects */}
                <button
                  onClick={() => {
                    setSelectedFilter('all')
                    setShowFilterDropdown(false)
                  }}
                  className={`w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md text-right ${
                    selectedFilter === 'all' ? 'bg-gray-100' : ''
                  }`}
                >
                  <HashtagIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm hebrew-text flex-1">כל הפרויקטים</span>
                  {selectedFilter === 'all' && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                </button>

                {/* Inbox */}
                <button
                  onClick={() => {
                    setSelectedFilter('inbox')
                    setShowFilterDropdown(false)
                  }}
                  className={`w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md text-right ${
                    selectedFilter === 'inbox' ? 'bg-gray-100' : ''
                  }`}
                >
                  <InboxIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm hebrew-text flex-1">תיבת הדואר</span>
                  {selectedFilter === 'inbox' && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                </button>

                {/* My Projects Header */}
                {projects.filter(p => !p.team).length > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-2 py-2 text-gray-500 cursor-default select-none">
                      {userAvatarUrl ? (
                        <div className="w-4 h-4 rounded-full overflow-hidden bg-green-500 flex items-center justify-center">
                          <img src={userAvatarUrl} alt="profile" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-gray-300" />
                      )}
                      <span className="text-sm font-medium hebrew-text">הפרוייקטים שלי</span>
                    </div>

                    {/* Project List */}
                    {projects.filter(p => !p.team).map((project) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setSelectedFilter(project.name)
                          setShowFilterDropdown(false)
                        }}
                        className={`w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md text-right ${
                          selectedFilter === project.name ? 'bg-gray-100' : ''
                        }`}
                      >
                        <HashtagIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm hebrew-text flex-1">{project.name}</span>
                        {selectedFilter === project.name && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Completed Tasks List */}
      {groupedTasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircleIcon className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="text-gray-500 hebrew-text">אין משימות שהושלמו</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedTasks.map((dayGroup, dayIndex) => (
            <div key={dayIndex}>
              {/* Daily Title with Bottom Border */}
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <h2 className="text-lg font-semibold hebrew-text text-gray-900">
                  {dayGroup.title}
                </h2>
                <span className="text-sm text-gray-500 hebrew-text">
                  {dayGroup.tasks.length} משימות
                </span>
              </div>

              {/* Tasks for this day */}
              <div className="space-y-3">
                {dayGroup.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-lg pt-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      {/* Profile Image with Checkmark */}
                      <div className="relative flex-shrink-0">
                        {userAvatarUrl ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                            <img src={userAvatarUrl} alt="profile" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300" />
                        )}
                        {/* Checkmark Badge */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        {/* Completion Text and Task Title on Same Line */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-500 hebrew-text">
                            השלמת משימה:
                          </span>
                          <button
                            onClick={() => {
                              if (onOpenTaskDetail) {
                                onOpenTaskDetail(task)
                              }
                            }}
                            className="text-base font-medium hebrew-text text-gray-700 underline hover:text-blue-600 transition-colors"
                          >
                            {task.title}
                          </button>
                        </div>

                        {/* Project Link (Left) and Completion Time (Right) */}
                        <div className="flex items-center justify-between">
                          {/* Project Link - Left side */}
                          <button
                            onClick={() => handleNavigateToProject(task)}
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {task.project ? (
                              <>
                                <HashtagIcon className="w-4 h-4" />
                                <span className="hebrew-text">{task.project}</span>
                              </>
                            ) : (
                              <>
                                <InboxIcon className="w-4 h-4" />
                                <span className="hebrew-text">תיבת הדואר</span>
                              </>
                            )}
                          </button>

                          {/* Completion Time - Right side */}
                          <div className="text-xs text-gray-400 hebrew-text">
                            {formatCompletionTime(task.completed_at || task.updated_at || task.created_at) || 'זמן לא זמין'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CompletedTasks
