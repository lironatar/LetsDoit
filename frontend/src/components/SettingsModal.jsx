import React, { useState, useRef, useEffect } from 'react'
import { 
  XMarkIcon,
  UserIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  SunIcon,
  MoonIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import api, { taskAPI, projectAPI, teamAPI, userAPI } from '../services/api'
import { useDarkMode } from '../contexts/DarkModeContext'
import { useToast } from '../contexts/ToastContext'
import SidebarCssIcon from './icons/SidebarCssIcon'
import CalendarSettings from './CalendarSettings'

function SettingsModal({ isOpen, onClose, onNavigate, currentUser = '' }) {
  const [activeTab, setActiveTab] = useState('account')
  const [userName, setUserName] = useState('')
  const [userLastName, setUserLastName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  // Keep initial values to detect changes in Account tab
  const [initialUserName, setInitialUserName] = useState('לירון עטאר')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const modalRef = useRef(null)
  const searchRef = useRef(null)
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { showSuccess } = useToast()
  // Mobile-only settings sidebar behavior
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280)
  const [isSettingsSidebarVisible, setIsSettingsSidebarVisible] = useState(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1280
    return width > 767
  })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setViewportWidth(width)
      if (width > 767) {
        setIsSettingsSidebarVisible(true)
      } else {
        setIsSettingsSidebarVisible(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSettingsSidebar = () => {
    if (viewportWidth <= 767) {
      setIsSettingsSidebarVisible(prev => !prev)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Load existing user data when modal opens
  useEffect(() => {
    if (!isOpen) return
    
    // Load user data from database
    ;(async () => {
      try {
        const profile = await userAPI.getProfile()
        
        if (profile && profile.name) {
          setUserName(profile.name)
          setInitialUserName(profile.name)
          // Also save to localStorage for sidebar
          localStorage.setItem('user_display_name', profile.name)
        } else {
          // Fallback: load from localStorage
          const savedName = localStorage.getItem('user_display_name')
          if (savedName) {
            setUserName(savedName)
            setInitialUserName(savedName)
          }
        }

        if (profile && typeof profile.last_name === 'string') {
          setUserLastName(profile.last_name || '')
        }
        if (profile && typeof profile.email === 'string') {
          setUserEmail(profile.email || '')
        }
        
        if (profile && profile.avatar_url) {
          setAvatarPreview(profile.avatar_url)
          const key = currentUser ? `${currentUser}_avatar_url` : 'user_avatar_url'
          localStorage.setItem(key, profile.avatar_url)
        } else {
          // Fallback: load from localStorage
          const key = currentUser ? `${currentUser}_avatar_url` : 'user_avatar_url'
          const cached = localStorage.getItem(key)
          if (cached) {
            setAvatarPreview(cached)
          }
        }
      } catch (error) {
        console.log('⚠️ Could not load user profile, using localStorage fallback')
        // Fallback: load from localStorage
        const savedName = localStorage.getItem('user_display_name')
        if (savedName) {
          setUserName(savedName)
          setInitialUserName(savedName)
        }
        
        const key = currentUser ? `${currentUser}_avatar_url` : 'user_avatar_url'
        const cached = localStorage.getItem(key)
        if (cached) {
          setAvatarPreview(cached)
        }
      }
    })()
  }, [isOpen])

  // Capture baseline values when opening or switching to account tab
  useEffect(() => {
    if (isOpen && activeTab === 'account') {
      setInitialUserName(userName)
    }
  }, [isOpen, activeTab])

  // Derived state: whether any account field was changed
  const hasAccountChanges = (userName !== initialUserName)

  const handleAccountCancel = () => {
    setUserName(initialUserName)
  }

  const handleAccountUpdate = async () => {
    try {
      // Save user name to database with flag indicating manual edit
      await userAPI.updateProfile({ 
        name: userName,
        last_name: userLastName,
        name_manually_edited: true 
      })
      console.log('✅ User name updated in database:', userName)
      
      // Save user name to localStorage and notify Sidebar immediately
      localStorage.setItem('user_display_name', userName)
      window.dispatchEvent(new CustomEvent('userNameUpdated', { detail: { newName: userName } }))
      setInitialUserName(userName)
      
      // Show success notification
      showSuccess('השם עודכן בהצלחה!', { duration: 3000 })
      
      // Trigger real-time update (duplicate-safe)
      window.dispatchEvent(new CustomEvent('userNameUpdated', { detail: { newName: userName } }))
      
    } catch (error) {
      console.error('❌ Failed to update user name in database:', error)
      // Still save to localStorage as fallback and broadcast
      localStorage.setItem('user_display_name', userName)
      setInitialUserName(userName)
      window.dispatchEvent(new CustomEvent('userNameUpdated', { detail: { newName: userName } }))
      // Show success notification even for localStorage fallback
      showSuccess('השם עודכן בהצלחה!', { duration: 3000 })
      
      // Trigger real-time update (duplicate-safe)
      window.dispatchEvent(new CustomEvent('userNameUpdated', { detail: { newName: userName } }))
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2.5 * 1024 * 1024) {
      alert('הקובץ גדול מדי (מקסימום 2.5MB)')
      return
    }
    setAvatarFile(file)
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  const uploadAvatar = async () => {
    if (!avatarFile) return
    try {
      const form = new FormData()
      form.append('avatar', avatarFile)
      const res = await api.post('/users/upload_avatar/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res && res.status >= 200 && res.status < 300) {
        const data = res.data
        if (data.avatar_url) setAvatarPreview(data.avatar_url)
        if (data.avatar_url) {
          const key = currentUser ? `${currentUser}_avatar_url` : 'user_avatar_url'
          localStorage.setItem(key, data.avatar_url)
          // Notify listeners (e.g., Sidebar) to update immediately
          window.dispatchEvent(new CustomEvent('userAvatarUpdated', {
            detail: { avatarUrl: data.avatar_url, key }
          }))
        }
        setAvatarFile(null)
      } else {
        alert('העלאת תמונה נכשלה')
      }
    } catch (err) {
      console.error(err)
      alert('שגיאה בהעלאת תמונה')
    }
  }

  // Search functionality
  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowSuggestions(false)
      return
    }

    setIsSearching(true)
    
    try {
      const [tasks, projects, teams] = await Promise.all([
        taskAPI.getTasks(),
        projectAPI.getProjects(),
        teamAPI.getTeams()
      ])

      const results = []

      // Search tasks
      tasks.forEach(task => {
        if (task.title && task.title.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            id: task.id,
            type: 'task',
            title: task.title,
            subtitle: task.project || 'תיבת הדואר',
            navigateTo: task.project ? `project:${task.project}` : 'inbox'
          })
        }
      })

      // Search projects
      projects.forEach(project => {
        if (project.name && project.name.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            id: project.id,
            type: 'project',
            title: project.name,
            subtitle: 'פרויקט',
            navigateTo: `project:${project.name}`
          })
        }
      })

      // Search teams
      teams.forEach(team => {
        if (team.name && team.name.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            id: team.id,
            type: 'team',
            title: team.name,
            subtitle: 'צוות',
            navigateTo: `team:${team.id}`
          })
        }
      })

      setSearchResults(results.slice(0, 5)) // Limit to 5 results
      setShowSuggestions(results.length > 0)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
      setShowSuggestions(false)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleSuggestionClick(searchResults[0])
    }
  }

  const handleSuggestionClick = (result) => {
    if (onNavigate) {
      onNavigate(result.navigateTo)
    }
    onClose()
    setSearchQuery('')
    setShowSuggestions(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div 
        ref={modalRef}
        className="main-bg rounded-lg shadow-xl w-full max-w-4xl h-[85vh] flex overflow-hidden relative"
      >
        {/* Mobile overlay for settings sidebar */}
        {viewportWidth <= 767 && isSettingsSidebarVisible && (
          <div 
            className="absolute inset-0 bg-black bg-opacity-30 z-40"
            onClick={(e) => { e.stopPropagation(); setIsSettingsSidebarVisible(false) }}
          />
        )}
        {/* Left Sidebar */}
        <div 
          className="w-65 sidebar-bg border-l border-gray-200 flex flex-col"
          style={viewportWidth <= 767 ? {
            position: 'absolute',
            top: 0,
            right: isSettingsSidebarVisible ? 0 : -260,
            height: '100%',
            zIndex: 50,
            transition: 'right 220ms cubic-bezier(0.4, 0, 0.2, 1)'
          } : {}}
        >
          {/* Header */}
          <div className="pt-4 px-6 pb-2">
            <h2 className="text-lg font-medium text-primary hebrew-text">הגדרות</h2>
          </div>

          {/* Search */}
          <div className="px-6 pb-4">
            <div className="relative" ref={searchRef}>
              <input 
                type="text" 
                placeholder="חיפוש משימות, פרויקטים וצוותים"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                className="w-full pl-3 pr-10 py-2 bg-transparent border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hebrew-text text-base"
              />
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {isSearching && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              )}
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchResults.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSuggestionClick(result)}
                      className={`w-full px-4 py-3 text-right hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${
                        index === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      } ${index === 0 ? 'rounded-t-lg' : ''} ${index === searchResults.length - 1 ? 'rounded-b-lg' : ''}`}
                    >
                      <div className="flex-1 text-right">
                        <div className="text-base font-medium text-primary hebrew-text">
                          {result.title}
                        </div>
                        <div className="text-sm text-gray-500 hebrew-text">
                          {result.subtitle}
                        </div>
                      </div>
                      <div className="mr-3">
                        {result.type === 'task' && (
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span className="text-sm text-blue-600 dark:text-blue-400">T</span>
                          </div>
                        )}
                        {result.type === 'project' && (
                          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <span className="text-sm text-green-600 dark:text-green-400">P</span>
                          </div>
                        )}
                        {result.type === 'team' && (
                          <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                            <span className="text-sm text-purple-600 dark:text-purple-400">C</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* No Results Message */}
              {showSuggestions && searchQuery && searchResults.length === 0 && !isSearching && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 px-4 py-3">
                  <div className="text-base text-gray-500 hebrew-text text-center">
                    לא נמצאו תוצאות עבור "{searchQuery}"
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-4">
            <div className="space-y-1">
              <button
                onClick={() => { setActiveTab('account'); if (viewportWidth <= 767) setIsSettingsSidebarVisible(false) }}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-base ${
                  activeTab === 'account' 
                    ? 'bg-secondary text-selected' 
                    : 'text-primary hover:bg-secondary-hover'
                }`}
              >
                <UserIcon className={`w-5 h-5 flex-shrink-0 ${
                  activeTab === 'account' ? 'text-selected-icon' : 'text-gray-500'
                }`} />
                <span className="hebrew-text flex-1 text-right mr-3">חשבון</span>
              </button>

              <button
                onClick={() => { setActiveTab('theme'); if (viewportWidth <= 767) setIsSettingsSidebarVisible(false) }}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-base ${
                  activeTab === 'theme' 
                    ? 'bg-secondary text-selected' 
                    : 'text-primary hover:bg-secondary-hover'
                }`}
              >
                <PaintBrushIcon className={`w-5 h-5 flex-shrink-0 ${
                  activeTab === 'theme' ? 'text-selected-icon' : 'text-gray-500'
                }`} />
                <span className="hebrew-text flex-1 text-right mr-3">עיצוב</span>
              </button>

              <button
                onClick={() => { setActiveTab('calendar'); if (viewportWidth <= 767) setIsSettingsSidebarVisible(false) }}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-base ${
                  activeTab === 'calendar' 
                    ? 'bg-secondary text-selected' 
                    : 'text-primary hover:bg-secondary-hover'
                }`}
              >
                <CalendarDaysIcon className={`w-5 h-5 flex-shrink-0 ${
                  activeTab === 'calendar' ? 'text-selected-icon' : 'text-gray-500'
                }`} />
                <span className="hebrew-text flex-1 text-right mr-3">יומן</span>
              </button>
            </div>
          </div>

          {/* Bottom spacer matching footer height with top border to align lines */}
          <div className="mt-auto border-t border-gray-200 h-14"></div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pt-4 px-6 pb-2 border-b border-gray-200">
            {/* Right side: icon next to title (mobile only icon) */}
            <div className="flex items-center">
              {viewportWidth <= 767 && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSettingsSidebar() }}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  title={isSettingsSidebarVisible ? 'הסתר תפריט' : 'הצג תפריט'}
                  aria-label={isSettingsSidebarVisible ? 'הסתר תפריט' : 'הצג תפריט'}
                >
                  <SidebarCssIcon size={16} />
                </button>
              )}
              <h1 className="text-lg font-medium text-primary hebrew-text mr-2">
                {activeTab === 'account' ? 'חשבון' : activeTab === 'theme' ? 'עיצוב' : 'יומן'}
              </h1>
            </div>
            {/* Left side: close button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'account' && (
              <div className="p-6 space-y-4">

                 {/* Photo Section */}
                 <div className="pb-4">
                   <h3 className="text-base font-bold text-primary hebrew-text mb-2">תמונה</h3>
                  <div className="flex items-center space-x-4 space-x-reverse mb-2">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-green-500 flex items-center justify-center text-white text-2xl font-medium">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>ל</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-3 space-x-reverse mb-2">
                    <label className="px-4 py-2 text-base bg-secondary-hover rounded-md hebrew-text cursor-pointer">
                      שנה תמונה
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                    {avatarFile && (
                      <button onClick={uploadAvatar} className="px-4 py-2 text-base bg-red-600 text-white rounded-md hover:bg-red-700 hebrew-text">
                        עדכן תמונה
                      </button>
                    )}
                    <button className="px-4 py-2 text-base text-red-600 border border-red-200 rounded-md hover:bg-red-50 hebrew-text">
                      הסר תמונה
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 hebrew-text">בחר תמונה עד 2.5MB. תמונת הפרופיל שלך תהיה ציבורית.</p>
                </div>

                 {/* Name Section */}
                 <div className="pb-4">
                   <h3 className="text-base font-bold text-primary hebrew-text mb-2">שם</h3>
                  <div className="mb-2">
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-80 px-3 py-2 main-bg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hebrew-text text-base"
                    />
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="שם משפחה"
                      value={userLastName}
                      onChange={(e) => setUserLastName(e.target.value)}
                      className="w-80 px-3 py-2 main-bg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hebrew-text text-base"
                    />
                  </div>
                </div>

                {/* Email Section */}
                <div className="pb-4">
                  <h3 className="text-base font-bold text-primary hebrew-text mb-2">אימייל</h3>
                  <div className="mb-2">
                    <p className="text-base text-primary font-normal">{userEmail || currentUser}</p>
                  </div>
                  {/* Email change not supported for Google users */}
                </div>

                {/* Password Section */}
                <div className="pb-4">
                  <h3 className="text-base font-bold text-primary hebrew-text mb-2">סיסמה</h3>
                  <div className="mb-2">
                    <div className="text-base text-primary font-normal">לא נקבעה סיסמה</div>
                  </div>
                  <button className="px-4 py-2 text-base bg-secondary-hover rounded-md hebrew-text">
                    הוסף סיסמה
                  </button>
                </div>

                {/* Footer buttons moved to sticky footer below */}
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="p-6">
                {/* Theme Settings */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-primary hebrew-text mb-4">מצב תצוגה</h3>
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between p-5">
                        {/* Toggle Switch - Right side for RTL */}
                        <div className="relative">
                          <button
                            onClick={toggleDarkMode}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              isDarkMode 
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg' 
                                : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
                                isDarkMode ? 'translate-x-1' : 'translate-x-6'
                              }`}
                            />
                          </button>
                        </div>
                        
                        {/* Content - Left side for RTL */}
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-100 dark:bg-blue-900' : 'bg-yellow-100'}`}>
                            {isDarkMode ? (
                              <MoonIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <SunIcon className="w-6 h-6 text-yellow-600" />
                            )}
                          </div>
                          <div>
                            <div className="text-base font-medium text-primary hebrew-text">
                              {isDarkMode ? 'מצב כהה' : 'מצב בהיר'}
                            </div>
                            <div className="text-base text-gray-500 hebrew-text mt-1">
                              {isDarkMode ? 'נושא כהה מופעל' : 'נושא בהיר מופעל'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Future theme settings can be added here */}
                  <div>
                    <h3 className="text-base font-bold text-primary hebrew-text mb-2">הגדרות נוספות</h3>
                    <div className="text-center py-8">
                      <PaintBrushIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-base text-gray-500 hebrew-text">הגדרות עיצוב נוספות יתווספו כאן בקרוב</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="p-6">
                <CalendarSettings currentUser={currentUser} />
              </div>
            )}
          </div>

          {/* Sticky Footer - visible when there are changes */}
          {activeTab === 'account' && hasAccountChanges && (
            <div className="border-t border-gray-200 bg-white px-6 h-14 flex items-center justify-end space-x-3 space-x-reverse">
              <button
                onClick={handleAccountCancel}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-base hebrew-text"
              >
                ביטול
              </button>
              <button
                onClick={handleAccountUpdate}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-base hebrew-text"
              >
                עדכן
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
