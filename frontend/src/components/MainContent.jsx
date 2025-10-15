import TaskList from './TaskList'
import ProjectsPage from './ProjectsPage'
import CalendarView from './CalendarView'
import OnboardingFlow from './OnboardingFlow'
import { taskAPI } from '../services/api'
import { UserGroupIcon } from '@heroicons/react/24/outline'
import { useToast } from '../contexts/ToastContext'
import { useState, useEffect, useRef } from 'react'
// Floating toggle lives in App; remove local icon

// Helper function to get user-specific localStorage keys
const getUserStorageKey = (username, dataType) => {
  if (!username) return dataType
  return `${username}_${dataType}`
}

function MainContent({ currentView, tasks, setTasks, projects, teams, googleCalendarEvents, onLoadEventsForRange, onOpenTaskModal, onOpenProjectModal, onSelectProject, onCreateTask, onEditTask, onUpdateTask, onOpenTaskDetail, viewportWidth = 1280, isSidebarVisible = true, currentUser = '', userEmailVerified = true, onResendVerification, showOnboarding = false, onCompleteOnboarding, onRenameProject, onOpenShareModal }) {
  const { showTaskCompleted } = useToast()

  const getViewTitle = () => {
    switch (currentView) {
      case 'today':
        return 'היום'
      case 'projects':
        return 'הפרויקטים שלי'
      case 'calendar':
        return 'לוח שנה'
      case 'upcoming':
        return 'הקרובים'
      case 'inbox':
        return 'תיבת הדואר'
      case 'filters':
        return 'מסנן ותגיות'
      case 'completed':
        return 'הושלמו'
      default:
        if (currentView.startsWith('project-')) {
          const projectId = currentView.replace('project-', '')
          const project = projects.find(p => p.id == projectId)
          return project ? project.name : 'פרויקט'
        }
        if (currentView.startsWith('team-')) {
          const teamId = currentView.replace('team-', '')
          const team = teams.find(t => t.id == teamId)
          return team ? team.name : 'צוות'
        }
        return 'היום'
    }
  }

  const getFilteredTasks = () => {
    switch (currentView) {
      case 'today':
        const d = new Date()
        const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        // Include both today's tasks AND overdue tasks
        return tasks.filter(task => 
          !task.completed && 
          task.due_time && 
          task.due_time <= today
        )
      case 'upcoming':
        const td = new Date()
        const todayDate = `${td.getFullYear()}-${String(td.getMonth()+1).padStart(2,'0')}-${String(td.getDate()).padStart(2,'0')}`
        return tasks.filter(task => !task.completed && task.due_time && task.due_time > todayDate)
      case 'inbox':
        return tasks.filter(task => !task.completed && (!task.project || task.project === ''))
      case 'completed':
        return tasks.filter(task => task.completed)
      case 'projects':
        return []
      default:
        if (currentView.startsWith('project-')) {
          const projectId = currentView.replace('project-', '')
          const project = projects.find(p => p.id == projectId)
          return tasks.filter(task => task.project === project?.name && !task.completed)
        }
        if (currentView.startsWith('team-')) {
          const teamId = currentView.replace('team-', '')
          const teamProjects = projects.filter(p => p.team?.id == teamId)
          const teamProjectNames = teamProjects.map(p => p.name)
          return tasks.filter(task => teamProjectNames.includes(task.project) && !task.completed)
        }
        return tasks.filter(task => !task.completed)
    }
  }

  const toggleTask = async (taskId) => {
    console.log('Toggling task:', taskId)
    
    // Find the task to get its title
    const task = tasks.find(t => t.id === taskId)
    const wasCompleted = task?.completed || false
    
    // Optimistic update - toggle immediately in UI
    setTasks(prevTasks => {
      const newTasks = prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, completed: !task.completed }
          : task
      )
      localStorage.setItem(getUserStorageKey(currentUser, 'todoist_tasks'), JSON.stringify(newTasks))
      console.log('Updated tasks (optimistic):', newTasks)
      return newTasks
    })

    // Show completion toast with undo option if task was just completed
    if (!wasCompleted && task) {
      const undoFunction = async () => {
        // Undo the completion
        setTasks(prevTasks => {
          const newTasks = prevTasks.map(t => 
            t.id === taskId 
              ? { ...t, completed: false }
              : t
          )
          localStorage.setItem(getUserStorageKey(currentUser, 'todoist_tasks'), JSON.stringify(newTasks))
          return newTasks
        })
        // Also undo in API
        try {
          await taskAPI.updateTaskCompletion(taskId, false)
          console.log('Task undo synced to API')
        } catch (error) {
          console.error('Failed to undo task in API:', error)
        }
      }
      
      showTaskCompleted(task.title, undoFunction)
    }

    // Try to sync with API in background (non-blocking)
    try {
      // Use the alternative update method instead of toggle
      const newCompletedState = !wasCompleted
      const result = await taskAPI.updateTaskCompletion(taskId, newCompletedState)
      console.log('✅ Task completion updated via API successfully:', result)
      
      // Update the task with the response from API to ensure consistency
      setTasks(prevTasks => {
        const newTasks = prevTasks.map(t => 
          t.id === taskId 
            ? { 
                ...t, 
                ...result, 
                completed: result.is_completed  // Map backend is_completed to frontend completed
              }
            : t
        )
        localStorage.setItem(getUserStorageKey(currentUser, 'todoist_tasks'), JSON.stringify(newTasks))
        return newTasks
      })
    } catch (error) {
      console.error('❌ API sync failed for task completion update:', error)
      console.error('Error details:', error.response?.data || error.message)
      
      // If API fails, revert the optimistic update
      setTasks(prevTasks => {
        const newTasks = prevTasks.map(t => 
          t.id === taskId 
            ? { ...t, completed: wasCompleted }
            : t
        )
        localStorage.setItem(getUserStorageKey(currentUser, 'todoist_tasks'), JSON.stringify(newTasks))
        return newTasks
      })
      
      // Show error toast
      console.error('Failed to sync task completion. Changes reverted.')
    }
  }

  // Responsive styling
  const MOBILE_PADDING = 'px-14' // Mobile padding for consistent centering
  
  const getResponsiveHeaderPadding = () => {
    if (viewportWidth <= 767) {
      return MOBILE_PADDING // Mobile: same padding as content for consistent centering
    } else if (viewportWidth <= 1024) {
      return 'px-8' // Tablet: medium padding
    } else {
      return 'pr-36 pl-8' // Desktop: move title/content further right (match ~9rem content padding)
    }
  }

  const getResponsiveContentPadding = () => {
    if (viewportWidth <= 767) {
      return `${MOBILE_PADDING} pt-2 pb-[40px]` // Mobile: centered with double bottom padding for better centering
    } else if (viewportWidth <= 1024) {
      return 'px-8 py-2' // Tablet: medium padding
    } else {
      return 'pr-36 pl-8 py-2' // Desktop: align with updated header padding
    }
  }

  // Align main content with title - no adaptive width adjustments
  const getAdaptiveMainStyles = () => {
    // Simply return full width with no right margin to align with title
    return {
      width: '100%',
      marginRight: '0',
      marginLeft: '0',
      transition: 'width 0.3s ease-out, margin-right 0.3s ease-out',
      willChange: 'width, margin-right'
    };
  }

  const getResponsiveTopSpacer = () => {
    // Use consistent 56px height across all screens
    return 'h-14' // 56px = h-14 in Tailwind (3.5rem = 56px)
  }

  return (
    <div 
      className="main-content flex-1 main-bg overflow-y-auto flex flex-col" 
      style={{ 
        WebkitOverflowScrolling: 'touch',
        // Smooth animation for main content expansion/contraction
        ...(viewportWidth > 767 && {
          transition: 'flex 700ms cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'flex',
          transform: 'translateZ(0)', // Force hardware acceleration
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        })
      }}
    >
      <div className="flex-1 flex flex-col" style={getAdaptiveMainStyles()}>
        {/* Top Spacer */}
        <div className={getResponsiveTopSpacer()}></div>
        
        {/* Modern Header - hidden during verification, onboarding, or calendar view */}
        {userEmailVerified && !showOnboarding && currentView !== 'calendar' && (
          <div className={`${getResponsiveHeaderPadding()} main-bg pb-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="ml-3">
                  {typeof currentView === 'string' && currentView.startsWith('project-') ? (
                    <InlineEditableProjectTitle 
                      currentView={currentView}
                      projects={projects}
                      onRenameProject={onRenameProject}
                      viewportWidth={viewportWidth}
                    />
                  ) : (
                    <h1 className={`font-bold text-primary hebrew-text ${
                      viewportWidth <= 767 ? 'text-xl' : 'text-2xl'
                    }`} style={{ fontSize: viewportWidth <= 767 ? '26px' : '26px' }}>
                      {getViewTitle()}
                    </h1>
                  )}
                  {currentView === 'today' && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className="w-3.5 h-3.5 circle-none rounded-full flex items-center justify-center" style={{ borderColor: 'var(--color-text-description)' }}>
                        <svg className="w-2 h-2" fill="var(--color-text-description)" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="hebrew-text text-base text-description">
                        {getFilteredTasks().length} משימות
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {/* Hide some buttons on mobile to save space */}
              {viewportWidth > 767 && (
                <div className="flex items-center space-x-3 space-x-reverse">
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                  <button className="px-4 text-base text-gray-600 hover:bg-gray-100 rounded-lg hebrew-text transition-colors">
                    תצוגה
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`${currentView === 'calendar' ? 'p-0 h-full' : 'p-0'} main-bg flex-1 task-list`}>
          {showOnboarding ? (
            <div className="flex items-center justify-center h-full p-4" dir="rtl">
              <OnboardingFlow 
                userEmail={currentUser} 
                onComplete={onCompleteOnboarding}
              />
            </div>
          ) : !userEmailVerified ? (
            <div className="flex items-center justify-center h-full" dir="rtl">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
                {/* Success Illustration */}
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="relative">
                    {/* Envelope */}
                    <div className="w-16 h-12 bg-yellow-400 rounded-lg relative">
                      <div className="absolute inset-1 bg-yellow-300 rounded-sm"></div>
                      <div className="absolute top-1 left-2 right-2 h-0.5 bg-yellow-600"></div>
                      <div className="absolute top-2 left-1 right-1 h-0.5 bg-yellow-600"></div>
                      <div className="absolute top-3 left-3 right-3 h-0.5 bg-yellow-600"></div>
                    </div>
                    {/* Checkmark */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {/* Sparkles */}
                    <div className="absolute -top-2 -left-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <div className="absolute -bottom-1 -right-2 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                    <div className="absolute top-1 -left-3 w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-4 hebrew-text">
                  אתה בפנים! עוד צעד אחרון...
                </h1>

                {/* Instructions */}
                <p className="text-gray-600 mb-6 hebrew-text leading-relaxed">
                  כדי להתחיל להשתמש ב-TodoFast, אנא לחץ על הקישור ששלחנו לכתובת האימייל שלך:
                </p>

                {/* Email Display */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-lg font-medium text-blue-600" dir="ltr">{currentUser}</p>
                  <button 
                    onClick={() => {
                      // Handle logout/change account
                      if (window.confirm('האם אתה בטוח שברצונך להתנתק?')) {
                        // Clear authentication and redirect to login
                        localStorage.removeItem('user_authenticated')
                        localStorage.removeItem('username')
                        localStorage.removeItem(`${currentUser}_email_verified`)
                        window.location.reload()
                      }
                    }}
                    className="text-sm text-blue-500 hover:text-blue-700 mt-1 hebrew-text"
                  >
                    שנה חשבון / התנתק
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => {
                      if (onResendVerification) {
                        onResendVerification()
                      }
                    }}
                    className="w-full bg-white border-2 border-red-500 text-red-500 py-3 px-6 rounded-lg hover:bg-red-50 transition-colors font-medium hebrew-text"
                  >
                    שלח שוב אימייל
                  </button>

                  <button
                    onClick={() => {
                      // Try to open email client
                      const mailtoLink = `mailto:${currentUser}`
                      window.open(mailtoLink, '_blank')
                    }}
                    className="w-full bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 transition-colors font-medium hebrew-text"
                  >
                    פתח תיבת דואר
                  </button>
                </div>

                {/* Footer Note */}
                <div className="text-xs text-gray-500 hebrew-text">
                  <p>אם האימייל לא מופיע, בדוק בתיקיית הספאם!</p>
                </div>
              </div>
            </div>
          ) : currentView === 'projects' ? (
            <div className={getResponsiveContentPadding()}>
              <ProjectsPage projects={projects} onOpenProjectModal={onOpenProjectModal} onSelectProject={onSelectProject} />
            </div>
          ) : (
            <div className={`task-list-container ${getResponsiveContentPadding()} ${currentView === 'calendar' ? 'hidden' : ''}`}>
              <TaskList 
                tasks={getFilteredTasks()}
                allTasks={tasks}
                onToggleTask={toggleTask}
                onEditTask={onEditTask}
                onUpdateTask={onUpdateTask}
                projects={projects}
                onOpenTaskModal={onOpenTaskModal}
                onCreateTask={onCreateTask}
                currentView={currentView}
                teams={teams}
                setTasks={setTasks}
                onOpenTaskDetail={onOpenTaskDetail}
                viewportWidth={viewportWidth}
                currentUser={currentUser}
                onOpenShareModal={onOpenShareModal}
              />
            </div>
          )}
          
          {/* Keep CalendarView mounted but hidden to avoid re-processing events */}
          <div className={`w-full h-full ${currentView === 'calendar' ? 'block' : 'hidden'}`}>
            <CalendarView 
              tasks={tasks} 
              projects={projects} 
              googleCalendarEvents={googleCalendarEvents}
              onLoadEventsForRange={onLoadEventsForRange}
              onOpenTaskModal={onOpenTaskModal} 
              onEditTask={onEditTask} 
              onOpenTaskDetail={onOpenTaskDetail} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainContent

function InlineEditableProjectTitle({ currentView, projects, onRenameProject, viewportWidth }) {
  const inputRef = useRef(null)
  const [isEditing, setIsEditing] = useState(false)
  const projectId = currentView.replace('project-', '')
  const project = projects.find(p => p.id == projectId)
  const [value, setValue] = useState(project ? project.name : '')

  useEffect(() => {
    setValue(project ? project.name : '')
  }, [project?.name])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      // Place cursor at end (RTL friendly)
      const len = inputRef.current.value.length
      inputRef.current.setSelectionRange(len, len)
    }
  }, [isEditing])

  const commit = () => {
    const trimmed = (value || '').trim()
    if (!trimmed || !project) {
      setIsEditing(false)
      setValue(project ? project.name : '')
      return
    }
    if (trimmed === project.name) {
      setIsEditing(false)
      return
    }
    onRenameProject && onRenameProject(project.id, trimmed)
    setIsEditing(false)
  }

  if (!project) {
    return (
      <h1 className={`font-bold text-primary hebrew-text ${viewportWidth <= 767 ? 'text-xl' : 'text-2xl'}`} style={{ fontSize: viewportWidth <= 767 ? '26px' : '26px' }}>
        פרויקט
      </h1>
    )
  }

  return (
    <div className="flex items-center">
      {isEditing ? (
        <input
          ref={inputRef}
          dir="rtl"
          className="font-bold text-primary hebrew-text bg-white border border-gray-300 rounded-lg shadow-sm outline-none px-1 py-1 w-auto inline-block text-2xl"
          style={{ fontSize: viewportWidth <= 767 ? '26px' : '26px' }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') { setIsEditing(false); setValue(project.name) }
          }}
          onBlur={() => setIsEditing(false)}
        />
      ) : (
        <h1
          className={`font-bold text-primary hebrew-text cursor-text ${viewportWidth <= 767 ? 'text-xl' : 'text-2xl'}`}
          style={{ fontSize: viewportWidth <= 767 ? '26px' : '26px' }}
          onClick={() => setIsEditing(true)}
          title="לחץ כדי לערוך שם פרויקט"
        >
          {project.name}
        </h1>
      )}
    </div>
  )
}
