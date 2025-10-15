import { 
  CalendarIcon,
  CalendarDaysIcon,
  InboxIcon,
  FunnelIcon,
  UserGroupIcon,
  PlusIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect, useRef, useCallback } from 'react'
import TodayIcon from './icons/TodayIcon'
import SidebarCssIcon from './icons/SidebarCssIcon'
import NotificationBell from './NotificationBell'
// Removed inline toggle; using global floating toggle in App

function Sidebar({ currentView, setCurrentView, projects, teams, tasks, onOpenTaskModal, onOpenProjectModal, onOpenTeamModal, onOpenSettingsModal, onOpenFriendList, onLogout, onToggleSidebar, isSidebarVisible, viewportWidth = 1280, isAutoHidden = false, currentUser = '', userEmail = '', userEmailVerified = true, onOpenNotificationInbox }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [areProjectsCollapsed, setAreProjectsCollapsed] = useState(() => localStorage.getItem(`${currentUser}_projects-collapsed`) === '1')
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('user_display_name') || (currentUser.includes('@') ? currentUser.split('@')[0] : currentUser) || 'משתמש')
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(`${currentUser}_sidebar-width`)
    return saved ? parseInt(saved) : 320 // Default 320px (w-80)
  })
  const [isResizing, setIsResizing] = useState(false)
  const [showResizeHandle, setShowResizeHandle] = useState(false)
  const userMenuRef = useRef(null)
  const sidebarRef = useRef(null)
  
  // Responsive breakpoints  
  const MOBILE_BREAKPOINT = 768
  const TABLET_BREAKPOINT = 1024

  // Dynamic resize limits based on viewport
  const getResponsiveLimits = () => {
    if (viewportWidth <= MOBILE_BREAKPOINT) {
      return { min: 240, max: Math.min(viewportWidth - 80, 320) } // Leave 80px for main content
    } else if (viewportWidth <= TABLET_BREAKPOINT) {
      return { min: 260, max: Math.min(viewportWidth - 200, 380) } // Leave 200px for main content
    } else {
      return { min: 280, max: 480 } // Normal desktop limits
    }
  }

  const { min: MIN_WIDTH, max: MAX_WIDTH } = getResponsiveLimits()

  // Responsive sidebar width management
  const getResponsiveSidebarWidth = () => {
    const saved = parseInt(localStorage.getItem(`${currentUser}_sidebar-width`) || '320')
    
    if (viewportWidth <= MOBILE_BREAKPOINT) {
      return Math.min(saved, Math.min(viewportWidth - 80, 280)) // Mobile: narrower sidebar
    } else if (viewportWidth <= TABLET_BREAKPOINT) {
      return Math.min(saved, Math.min(viewportWidth - 200, 350)) // Tablet: medium sidebar
    } else {
      return saved // Desktop: user preference
    }
  }

  // Save width to localStorage
  const saveWidth = useCallback((width) => {
    localStorage.setItem(`${currentUser}_sidebar-width`, width.toString())
  }, [currentUser])

  // Update sidebar width when viewport changes
  useEffect(() => {
    const responsiveWidth = getResponsiveSidebarWidth()
    if (responsiveWidth !== sidebarWidth) {
      setSidebarWidth(responsiveWidth)
    }
  }, [viewportWidth, sidebarWidth])

  // Handle mouse down on resize handle
  const handleResizeStart = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Resize started')
    setIsResizing(true)
    setShowResizeHandle(true) // Keep handle visible during resize
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  // Handle mouse move during resize
  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !sidebarRef.current) return
    
    const sidebarRect = sidebarRef.current.getBoundingClientRect()
    // For RTL, calculate width from right edge
    const newWidth = sidebarRect.right - e.clientX
    
    console.log('Resizing:', newWidth, 'Min:', MIN_WIDTH, 'Max:', MAX_WIDTH)
    
    if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
      setSidebarWidth(newWidth)
    }
  }, [isResizing])

  // Handle mouse up to end resize
  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      console.log('Resize ended, saving width:', sidebarWidth)
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      saveWidth(sidebarWidth)
    }
  }, [isResizing, sidebarWidth, saveWidth])

  // Add global mouse event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      return () => {
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  // Persist projects collapsed state
  useEffect(() => {
    localStorage.setItem(`${currentUser}_projects-collapsed`, areProjectsCollapsed ? '1' : '0')
  }, [areProjectsCollapsed, currentUser])

  // Listen for real-time updates from settings (name/avatar)
  useEffect(() => {
    const handleNameUpdate = (event) => {
      const { newName } = event.detail || {}
      if (newName) {
        setDisplayName(newName)
      }
    }
    const handleAvatarUpdate = (event) => {
      const key = `${currentUser}_avatar_url`
      const url = (event.detail && event.detail.avatarUrl) || localStorage.getItem(key)
      if (url) {
        // Ensure localStorage has the latest and trigger a rerender
        localStorage.setItem(key, url)
        setDisplayName((prev) => prev)
      }
    }

    window.addEventListener('userNameUpdated', handleNameUpdate)
    window.addEventListener('userAvatarUpdated', handleAvatarUpdate)
    
    return () => {
      window.removeEventListener('userNameUpdated', handleNameUpdate)
      window.removeEventListener('userAvatarUpdated', handleAvatarUpdate)
    }
  }, [currentUser])
  
  // Calculate task counts dynamically (using local date, not UTC)
  const getTaskCounts = () => {
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    
    return {
      // Include overdue + today
      today: tasks.filter(task => !task.completed && task.due_time && task.due_time <= today).length,
      upcoming: tasks.filter(task => !task.completed && task.due_time && task.due_time > today).length,
      inbox: tasks.filter(task => !task.completed && (!task.project || task.project === '')).length,
      completed: tasks.filter(task => task.completed).length
    }
  }

  const taskCounts = getTaskCounts()

  const todayNumber = new Date().getDate()

  const renderNavIcon = (item, isActive) => {
    if (item.id === 'today') {
      // Smaller Today icon for compact layout
      return <TodayIcon active={isActive} className="ml-2" size={21} />
    }
    return (
      <item.icon className={`w-[21px] h-[21px] ml-2 ${
        isActive ? 'text-selected-icon' : 'text-gray-500'
      }`} />
    )
  }

  const mainItems = [
    { id: 'today', name: 'היום', icon: CalendarIcon, count: taskCounts.today },
//    { id: 'upcoming', name: 'הקרובים', icon: CalendarDaysIcon, count: taskCounts.upcoming },
    { id: 'calendar', name: 'לוח שנה', icon: CalendarDaysIcon, count: 0 },
    { id: 'inbox', name: 'תיבת הדואר', icon: InboxIcon, count: taskCounts.inbox },
    { id: 'filters', name: 'מסנן ותגיות', icon: FunnelIcon },
    { id: 'completed', name: 'הושלמו', icon: CheckCircleIcon, count: taskCounts.completed }
  ]

  // Calculate project task counts
  const getProjectTaskCount = (projectName) => {
    return tasks.filter(task => task.project === projectName && !task.completed).length
  }

  // Calculate team task counts
  const getTeamTaskCount = (teamId) => {
    const teamProjects = projects.filter(p => p.team?.id === teamId)
    const teamProjectNames = teamProjects.map(p => p.name)
    return tasks.filter(task => teamProjectNames.includes(task.project) && !task.completed).length
  }

  const handleUserMenuClick = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
  }

  const handleSettings = () => {
    onOpenSettingsModal()
    setIsUserMenuOpen(false)
    // Close sidebar when opening settings (useful on mobile/narrow viewports)
    if (viewportWidth <= 767 && isSidebarVisible) {
      onToggleSidebar()
    }
  }

  const handleLogout = () => {
    // Call the logout function passed from App component
    onLogout()
    setIsUserMenuOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        // Use setTimeout to allow other click handlers to execute first
        setTimeout(() => {
          setIsUserMenuOpen(false)
        }, 0)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isUserMenuOpen])


  // Debug mobile sidebar state
  if (viewportWidth <= 767) {
    console.log('📱 Sidebar render:', { 
      isSidebarVisible, 
      viewportWidth, 
      hasVisibleClass: isSidebarVisible ? 'visible' : 'hidden',
      sidebarWidth,
      isAutoHidden 
    })
  }

  return (
    <div 
      className={`sidebar group h-screen flex flex-col sidebar-bg ${isResizing ? 'sidebar-resizing' : ''} ${
        viewportWidth <= 767 ? (isSidebarVisible ? 'visible' : '') : ''
      }`}
      ref={sidebarRef}
      style={{ 
        width: `${sidebarWidth}px`,
        minWidth: viewportWidth > 767 ? `${MIN_WIDTH}px` : 'auto',
        maxWidth: viewportWidth > 767 ? `${MAX_WIDTH}px` : 'auto',
        overflow: 'hidden',
        // Desktop positioning - smooth sliding animation (RTL direction)
        ...(viewportWidth > 767
          ? {
              position: isSidebarVisible ? 'relative' : 'absolute',
              right: isSidebarVisible ? '0' : `-${sidebarWidth}px`,
              zIndex: 1,
              transition: isResizing ? 'none' : 'right 500ms cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'right',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }
          // Mobile positioning - fast but smooth sliding animation (RTL direction)
          : {
              position: 'fixed',
              top: 0,
              right: isSidebarVisible ? '0' : `-${sidebarWidth}px`,
              zIndex: 40,
              height: '100vh',
              transition: isResizing ? 'none' : 'right 220ms cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'right',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }
        )
      }}
      onMouseEnter={() => {
        // Don't show handle on sidebar hover anymore
      }}
      onMouseLeave={() => {
        // Don't hide handle on sidebar leave anymore
      }}
    >
      {/* User Section */}
      <div className="px-4" style={{ paddingTop: '0.5rem' }}>
        <div className="flex items-center justify-between mb-2" ref={userMenuRef}>
          <div className="flex items-center">
            <button 
              onClick={handleUserMenuClick}
              className="flex items-center px-1 py-2 rounded-lg hover:bg-secondary-hover transition-colors"
            >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-green-500 flex items-center justify-center text-white text-sm font-medium">
                {/* User-specific avatar */}
                {localStorage.getItem(`${currentUser}_avatar_url`) ? (
                  <img src={localStorage.getItem(`${currentUser}_avatar_url`)} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser ? currentUser.charAt(0).toUpperCase() : 'ל'}</span>
                )}
              </div>
              <span className="mr-2 ml-2 hebrew-text text-base font-medium text-primary">
                {displayName}
              </span>
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            {onOpenNotificationInbox && <NotificationBell onClick={onOpenNotificationInbox} />}
            
            {/* Close sidebar button placed at LEFT side of the row */}
            <button 
              onClick={(e) => {
                console.log('❌ Sidebar close button clicked!', { 
                  viewportWidth, 
                  isSidebarVisible, 
                  isAutoHidden 
                })
                e.preventDefault()
                e.stopPropagation()
                onToggleSidebar()
              }}
              className={`px-2 py-1 hover:bg-secondary-hover rounded text-gray-500 ${
                viewportWidth <= 767 ? 'bg-gray-100 border border-gray-200' : ''
              }`}
              title={isSidebarVisible ? 'הסתר סרגל צד' : 'הצג סרגל צד'}
              aria-label={isSidebarVisible ? 'הסתר סרגל צד' : 'הצג סרגל צד'}
            >
              <SidebarCssIcon width={26} height={22} />
            </button>
          </div>
        </div>

        {/* User Dropdown Menu */}
        {isUserMenuOpen && (
          <div className="absolute left-6 top-20 w-64 dropdown-menu rounded-lg shadow-lg border border-gray-200 z-50">
            {/* User Info */}
            <div className="flex items-center px-4 pt-3 pb-4">
              <ChartBarIcon className="w-6 h-6 text-gray-500 flex-shrink-0" />
              <div className="mr-3">
                <div className="hebrew-text text-base font-medium text-primary">{displayName}</div>
                <div className="text-sm text-gray-500">{tasks.filter(t => t.completed).length}/{tasks.length} משימות</div>
              </div>
            </div>

            {/* Full width divider line */}
            <div className="border-b border-gray-200"></div>

            {/* Menu Items */}
            <div className="px-4 py-3 space-y-1">
              <button 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSettings()
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                }}
                className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-base"
              >
                <Cog6ToothIcon className="w-6 h-6 text-gray-500 flex-shrink-0" />
                <span className="hebrew-text text-primary mr-3">הגדרות</span>
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-base"
              >
                <ArrowRightOnRectangleIcon className="w-6 h-6 text-gray-500 flex-shrink-0" />
                <span className="hebrew-text text-primary mr-3">התנתק</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Task Button */}
      <div className="px-4">
        <button 
          onClick={() => onOpenTaskModal()}
          disabled={!userEmailVerified}
          className={`w-full flex items-center justify-start py-1.5 transition-colors text-base font-semibold hebrew-text ${
            userEmailVerified 
              ? 'text-selected-icon hover:opacity-80 cursor-pointer' 
              : 'text-gray-400 cursor-not-allowed'
          }`}
          style={{ pointerEvents: userEmailVerified ? 'auto' : 'none' }}
          title={!userEmailVerified ? 'אמת את האימייל שלך כדי להוסיף משימות' : ''}
        >
          <span className={`ml-1 mr-1 inline-flex items-center justify-center w-6 h-6 rounded-full ${
            userEmailVerified ? '' : 'bg-gray-400'
          }`} style={{ 
            paddingRight: '0px',
            backgroundColor: userEmailVerified ? 'var(--color-add-task-icon)' : ''
          }}>
            <PlusIcon className="w-5 h-5 text-white" />
          </span>
          הוסף משימה
        </button>
      </div>

      {/* Show minimal content for unverified users */}
      {!userEmailVerified ? (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 mt-8">
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <p className="text-gray-500 hebrew-text text-lg">
                כאן יהיו המשימות שלך
              </p>
              <p className="text-gray-400 hebrew-text text-sm mt-2">
                אמת את האימייל שלך כדי להתחיל
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Navigation Container */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4">
              
              {/* Search Button - styled like other nav items */}
              <button className="group w-full flex items-center px-1 rounded-lg transition-colors text-base text-primary hover:bg-secondary-hover" style={{ height: '34px' }}>
                <svg className="w-[21px] h-[21px] ml-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hebrew-text flex-1 text-right text-gray-500">חיפוש</span>
              </button>
              
              {/* Main Navigation Items */}
              {mainItems.map((item) => {
                const isActive = currentView === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id)
                      if (viewportWidth <= 767) {
                        onToggleSidebar()
                      }
                    }}
                    className={`group w-full flex items-center px-1 rounded-lg transition-colors text-base ${
                      isActive 
                        ? 'bg-secondary text-selected' 
                        : 'text-primary hover:bg-secondary-hover'
                    }`}
                    style={{ height: '34px' }}
                  >
                    {renderNavIcon(item, isActive)}
                    <span className="hebrew-text flex-1 text-right">{item.name}</span>
                    {item.count > 0 && item.id !== 'upcoming' && item.id !== 'completed' && (
                        <span className={`text-sm ${
                          isActive ? 'text-selected' : 'text-gray-400'
                        }`}>
                          {item.count}
                        </span>
                    )}
                  </button>
                )
              })}

              {/* Projects and Teams Section (explicit spacers instead of py-3) */}
              <div className="">
                {/* Spacer above My Projects */}
                <div className="sidebar-section-spacer"></div>
                {/* Projects Header Button */}
                <div className="relative">
                  {/* Collapse toggle */}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAreProjectsCollapsed(prev => !prev) }}
                    className="absolute left-0 top-2 opacity-0 group-hover:opacity-70 transition-opacity rounded-lg hover:bg-black/5 text-gray-600 z-10"
                    title={areProjectsCollapsed ? 'הצג פרויקטים' : 'הסתר פרויקטים'}
                    aria-label={areProjectsCollapsed ? 'הצג פרויקטים' : 'הסתר פרויקטים'}
                  >
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${areProjectsCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                  </button>
                  
                  <button
                    onClick={() => {
                      setCurrentView('projects')
                      if (viewportWidth <= 767) {
                        onToggleSidebar()
                      }
                    }}
                    className={`group/projects w-full flex items-center px-0 py-2 rounded-lg transition-colors text-base ${
                      currentView === 'projects' ? 'bg-secondary text-selected' : 'text-primary hover:bg-secondary-hover'
                    }`}
                    title="הצג את כל הפרויקטים"
                  >
                    <div className="sidebar-icon-wrapper sidebar-item-ml">
                      {localStorage.getItem(`${currentUser}_avatar_url`) ? (
                        <div className="sidebar-rect-icon overflow-hidden bg-green-500 flex items-center justify-center text-white text-sm font-medium">
                          <img src={localStorage.getItem(`${currentUser}_avatar_url`)} alt="profile" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <UserGroupIcon className="sidebar-rect-icon text-gray-500" />
                      )}
                    </div>
                    <span className="hebrew-text flex-1 text-right">הפרויקטים שלי</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className={`sidebar-item-ml opacity-0 group-hover/projects:opacity-70 transition-all text-gray-600 px-2.5 py-1.5 rounded-lg hover:${
                        currentView === 'projects' 
                          ? 'bg-black/10 shadow-sm'
                          : 'bg-black/5 shadow-sm'
                      }`}
                      onClick={(e) => { e.stopPropagation(); onOpenProjectModal(); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onOpenProjectModal(); } }}
                      title="הוסף פרויקט"
                      aria-label="הוסף פרויקט"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </span>
                  </button>
                </div>

                {/* Individual Projects */}
                {!areProjectsCollapsed && projects.filter(project => !project.team).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setCurrentView(`project-${project.id}`)
                      if (viewportWidth <= 767) {
                        onToggleSidebar()
                      }
                    }}
                    className={`w-full flex items-center px-1 py-2 rounded-lg transition-colors text-base ${
                      currentView === `project-${project.id}` ? 'bg-secondary text-selected' : 'text-primary hover:bg-secondary-hover'
                    }`}
                  >
                    <span className="sidebar-item-ml flex items-center justify-center w-7">
                      <span className="hashtag-icon" />
                    </span>
                    <span className="hebrew-text flex-1 text-right">{project.name}</span>
                    {project.is_shared && (
                      <UserGroupIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-1" />
                    )}
                    <span className={`text-sm ${
                      currentView === `project-${project.id}` ? 'text-selected' : 'text-gray-400'
                    }`}>
                      {getProjectTaskCount(project.name)}
                    </span>
                  </button>
                ))}

                {/* Spacer above My Teams */}
                {!areProjectsCollapsed && teams.length > 0 && (
                  <div className="sidebar-section-spacer"></div>
                )}

                {/* Teams Header Button */}
                {!areProjectsCollapsed && teams.length > 0 && (
                  <button 
                    className={`w-full flex items-center px-1 py-2 rounded-lg transition-colors text-base ${
                      currentView === 'teams' ? 'bg-secondary text-selected' : 'text-primary hover:bg-secondary-hover'
                    }`}
                    onClick={() => {
                      setCurrentView('teams')
                      if (viewportWidth <= 767) {
                        onToggleSidebar()
                      }
                    }}
                  >
                    <div className="sidebar-icon-wrapper sidebar-item-ml">
                      <UserGroupIcon className="sidebar-rect-icon text-blue-500" />
                    </div>
                    <span className="hebrew-text flex-1 text-right">הצוותים שלי</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onOpenTeamModal(); }}
                      className="sidebar-item-ml p-1 hover:bg-gray-100 rounded text-gray-400"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  </button>
                )}

                {/* Team Items */}
                {!areProjectsCollapsed && teams.map((team) => (
                  <button 
                    key={team.id}
                    className={`w-full flex items-center px-1 py-2 rounded-lg transition-colors text-base ${
                      currentView === `team-${team.id}` ? 'bg-secondary text-selected' : 'text-primary hover:bg-secondary-hover'
                    }`}
                    onClick={() => {
                      setCurrentView(`team-${team.id}`)
                      if (viewportWidth <= 767) {
                        onToggleSidebar()
                      }
                    }}
                  >
                    <div className="sidebar-item-ml flex items-center justify-center w-7">
                      <span className="hashtag-icon" />
                    </div>
                    <span className="hebrew-text flex-1 text-right">{team.name}</span>
                    <span className={`text-sm ${
                      currentView === `team-${team.id}` ? 'text-selected' : 'text-blue-600'
                    }`}>
                      {getTeamTaskCount(team.id)}
                    </span>
                  </button>
                ))}

                {/* Team Projects */}
                {!areProjectsCollapsed && teams.map((team) => 
                  projects.filter(project => project.team?.id === team.id).map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setCurrentView(`project-${project.id}`)
                        if (viewportWidth <= 767) {
                          onToggleSidebar()
                        }
                      }}
                      className={`w-full flex items-center px-1 py-2 rounded-lg transition-colors text-base ${
                        currentView === `project-${project.id}` ? 'bg-secondary text-selected' : 'text-primary hover:bg-secondary-hover'
                      }`}
                    >
                      <span className="sidebar-item-ml flex items-center justify-center w-7">
                        <span className="hashtag-icon" />
                      </span>
                      <span className="hebrew-text flex-1 text-right">{project.name}</span>
                      <span className={`text-sm ${
                        currentView === `project-${project.id}` ? 'text-selected' : 'text-gray-400'
                      }`}>
                        {getProjectTaskCount(project.name)}
                      </span>
                    </button>
                  ))
                )}

                {/* Add Team Button */}
                {!areProjectsCollapsed && (
                  <button
                    onClick={onOpenTeamModal}
                    className="w-full flex items-center px-1 py-2 rounded-lg transition-colors text-base text-primary hover:bg-secondary-hover border-2 border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-500"
                  >
                    <div className="sidebar-icon-wrapper sidebar-item-ml">
                      <UserGroupIcon className="sidebar-rect-icon text-gray-400" />
                    </div>
                    <span className="hebrew-text flex-1 text-right">הוסף צוות</span>
                  </button>
                )}

                {/* Spacer above Friend List */}
                {!areProjectsCollapsed && (
                  <div className="sidebar-section-spacer"></div>
                )}

                {/* Friend List Button */}
                {!areProjectsCollapsed && (
                  <button
                    onClick={() => {
                      if (onOpenFriendList) {
                        onOpenFriendList()
                      }
                    }}
                    className="w-full flex items-center px-1 py-2 rounded-lg transition-colors text-base text-primary hover:bg-secondary-hover"
                  >
                    <div className="sidebar-icon-wrapper sidebar-item-ml">
                      <UsersIcon className="sidebar-rect-icon text-selected-icon" />
                    </div>
                    <span className="hebrew-text flex-1 text-right">רשימת חברים</span>
                  </button>
                )}
              </div>


            </div>
          </div>
        </>
      )}

      {/* Resize Handle */}
      <div
        className={`sidebar-resize-handle ${isResizing ? 'active' : ''}`}
        style={{
          opacity: showResizeHandle ? 0.6 : 0,
          transition: isResizing ? 'none' : 'opacity 0.2s ease',
          display: 'block'
        }}
        onMouseDown={handleResizeStart}
        onMouseEnter={() => {
          setShowResizeHandle(true)
        }}
        onMouseLeave={() => {
          if (!isResizing) {
            setShowResizeHandle(false)
          }
        }}
        title="Drag to resize sidebar"
      />

    </div>
  )
}

export default Sidebar
