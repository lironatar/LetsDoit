import React, { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import SidebarCssIcon from './components/icons/SidebarCssIcon'
import MainContent from './components/MainContent'
import CompletedTasks from './components/CompletedTasks'
import RegistrationForm from './components/RegistrationForm'
import EmailVerificationWelcome from './components/EmailVerificationWelcome'
import OnboardingFlow from './components/OnboardingFlow'
import GoogleLoginButton from './components/GoogleLoginButton'
import TaskCreationModal from './components/TaskCreationModal'
import TaskEditModal from './components/TaskEditModal'
import TaskDetailModal from './components/TaskDetailModal'
import ProjectCreationModal from './components/ProjectCreationModal'
import TeamCreationModal from './components/TeamCreationModal'
import TeamProjectModal from './components/TeamProjectModal'
import FriendListModal from './components/FriendListModal'
import SettingsModal from './components/SettingsModal'
import NotificationInbox from './components/NotificationInbox'
import ShareProjectModal from './components/ShareProjectModal'
import ToastContainer from './components/ToastContainer'
import { ToastProvider, useToast } from './contexts/ToastContext'
import { DarkModeProvider } from './contexts/DarkModeContext'
import { taskAPI, projectAPI, teamAPI, userAPI } from './services/api'
import './index.css'

// Helper function to get user-specific localStorage keys
const getUserStorageKey = (username, dataType) => {
  if (!username) return dataType
  return `${username}_${dataType}`
}

function AppContent() {
  // Clear any old global localStorage data on app start
  const clearOldGlobalData = () => {
    const oldKeys = ['todoist_tasks', 'todoist_projects', 'todoist_teams', 'user_avatar_url', 'projects-collapsed', 'sidebar-width', 'sidebar-visible']
    oldKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log('Clearing old global data:', key)
        localStorage.removeItem(key)
      }
    })
    
    // Clear any problematic onboarding-related keys that might interfere
    const allKeys = Object.keys(localStorage)
    const onboardingKeys = allKeys.filter(key => 
      key.includes('onboarding_completed') || 
      key.includes('first_time_login') ||
      key.includes('needs_onboarding')
    )
    
    onboardingKeys.forEach(key => {
      console.log('Clearing problematic onboarding key:', key)
      localStorage.removeItem(key)
    })
    
    // List all localStorage keys for debugging
    console.log('All localStorage keys:', Object.keys(localStorage))
  }
  
  const [currentUser, setCurrentUser] = useState(() => {
    // Clear old global data first
    clearOldGlobalData()
    
    // Get current username from localStorage
    const username = localStorage.getItem('username') || ''
    console.log('🔍 Initial currentUser:', username)
    console.log('🔍 user_authenticated flag:', localStorage.getItem('user_authenticated'))
    console.log('🔍 email_verified flag:', localStorage.getItem(`${username}_email_verified`))
    return username
  })
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user is authenticated by looking for a session flag
    return localStorage.getItem('user_authenticated') === 'true'
  })
  const [loginCredentials, setLoginCredentials] = useState({
    username: '',
    password: ''
  })
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)
  const [registrationMessage, setRegistrationMessage] = useState('')
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [emailVerificationStatus, setEmailVerificationStatus] = useState(null) // 'verifying', 'success', 'error'
  const [userEmailVerified, setUserEmailVerified] = useState(() => {
    // Initialize based on localStorage if available
    const username = localStorage.getItem('username') || ''
    if (username) {
      const verificationStatus = localStorage.getItem(`${username}_email_verified`)
      return verificationStatus === 'true'
    }
    return false // Default to false if no user data
  }) // Track if user's email is verified
  const [needsOnboarding, setNeedsOnboarding] = useState(false) // Track if user needs onboarding
  const [showOnboarding, setShowOnboarding] = useState(false) // Show onboarding flow
  const [currentView, setCurrentView] = useState('today')
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [teams, setTeams] = useState([])
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [initialTaskData, setInitialTaskData] = useState(null)
  const [isTaskEditModalOpen, setIsTaskEditModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState(null)
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false)
  const [taskToDetail, setTaskToDetail] = useState(null)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
  const [isTeamProjectModalOpen, setIsTeamProjectModalOpen] = useState(false)
  const [isFriendListModalOpen, setIsFriendListModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isNotificationInboxOpen, setIsNotificationInboxOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [projectToShare, setProjectToShare] = useState(null)
  const [isSidebarVisible, setIsSidebarVisible] = useState(() => {
    // Get sidebar visibility from localStorage, default to true
    const key = getUserStorageKey(currentUser, 'sidebar-visible')
    const saved = localStorage.getItem(key)
    return saved !== null ? JSON.parse(saved) : true
  })
  const [showReopenButton, setShowReopenButton] = useState(() => {
    // If sidebar is hidden on load, show the reopen button immediately
    const key = getUserStorageKey(currentUser, 'sidebar-visible')
    const saved = localStorage.getItem(key)
    const isHidden = saved !== null ? !JSON.parse(saved) : false
    return isHidden
  })

  // Responsive state management
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth)
  const [isAutoHidden, setIsAutoHidden] = useState(false)
  const [userPreferredSidebarVisible, setUserPreferredSidebarVisible] = useState(() => {
    // Track user's manual preference separate from auto-hide
    const key = getUserStorageKey(currentUser, 'sidebar-visible')
    const saved = localStorage.getItem(key)
    return saved !== null ? JSON.parse(saved) : true
  })
  const [userManuallyOpenedOnMobile, setUserManuallyOpenedOnMobile] = useState(false)
  
  const { showTaskCreated, showTaskCompleted, showSuccess } = useToast()

  // Responsive breakpoints - sidebar auto-hides when viewport is narrow
  const MOBILE_BREAKPOINT = 768   // Mobile phones
  const TABLET_BREAKPOINT = 1024  // Tablets and high zoom levels
  const DESKTOP_BREAKPOINT = 1280 // Normal desktop

  // Handle viewport width changes and responsive sidebar behavior
  const handleViewportChange = useCallback(() => {
    const width = window.innerWidth
    const prevWidth = viewportWidth
    setViewportWidth(width)

    // 📱 MOBILE/NARROW VIEWPORT (≤1024px)
    if (width <= TABLET_BREAKPOINT) {
      // Only auto-hide if:
      // 1. Sidebar is currently visible AND
      // 2. User hasn't manually opened it on mobile AND  
      // 3. Not already auto-hidden
      if (isSidebarVisible && !userManuallyOpenedOnMobile && !isAutoHidden) {
        setIsAutoHidden(true)
        setIsSidebarVisible(false)
        setShowReopenButton(true)
      }
    } 
    // 🖥️ WIDE VIEWPORT (>1024px) 
    else {
      // Clear mobile manual flag when going to desktop
      if (userManuallyOpenedOnMobile) {
        setUserManuallyOpenedOnMobile(false)
        console.log(`🖥️ Cleared mobile manual flag on desktop`)
      }
      
      // Restore sidebar if it was auto-hidden and user wants it visible
      if (isAutoHidden && userPreferredSidebarVisible) {
        setIsAutoHidden(false)
        setIsSidebarVisible(true)
        setShowReopenButton(false)
      }
    }
  }, [viewportWidth, isAutoHidden, isSidebarVisible, userPreferredSidebarVisible, userManuallyOpenedOnMobile])

  // Responsive viewport listener
  useEffect(() => {
    // Initial check
    handleViewportChange()

    // Add resize listener with debouncing for performance
    let timeoutId = null
    const debouncedHandler = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleViewportChange, 100)
    }

    window.addEventListener('resize', debouncedHandler)
    
    return () => {
      window.removeEventListener('resize', debouncedHandler)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [handleViewportChange])

  // Check for email verification token in URL on app load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const verifyToken = urlParams.get('verify')
    
    if (verifyToken) {
      console.log('🔗 Email verification token found in URL:', verifyToken)
      handleEmailVerification(verifyToken)
    }
  }, [])

  const handleGoogleLogin = async (googleData) => {
    try {
      // Clear current state before switching user
      setTasks([])
      setProjects([])
      setTeams([])
      
      // Set authentication state
      localStorage.setItem('user_authenticated', 'true')
      localStorage.setItem('username', googleData.user.email)
      
      // Store Google user data
      if (googleData.user.profile?.avatar_url) {
        localStorage.setItem(`${googleData.user.email}_avatar_url`, googleData.user.profile.avatar_url)
      }
      // Get display name from profile (account settings) - prioritize user's manually set name
      // Profile name comes from account settings and takes precedence over Google name
      const profileName = googleData.user.profile?.name || googleData.user.first_name || googleData.user.username
      const displayName = profileName || googleData.user.email
      console.log('📛 Frontend - Using display name from account settings:', { profileName, displayName })
      localStorage.setItem('user_display_name', displayName)
      // Broadcast so Sidebar updates immediately
      window.dispatchEvent(new CustomEvent('userNameUpdated', { detail: { newName: displayName } }))
      
      setCurrentUser(googleData.user.email)
      setIsAuthenticated(true)
      
      // Google users are always email verified
      setUserEmailVerified(true)
      localStorage.setItem(`${googleData.user.email}_email_verified`, 'true')
      
      // Check if this is first time login
      console.log('🔍 Google Login Frontend Debug:')
      console.log('   first_time_login from backend:', googleData.first_time_login)
      console.log('   user profile:', googleData.user.profile)
      
      if (googleData.first_time_login) {
        console.log('   → Showing onboarding flow')
        setNeedsOnboarding(true)
        setShowOnboarding(true)
      } else {
        console.log('   → Skipping onboarding, loading data')
        // Load data for returning users
        loadData()
      }
      
      showSuccess(`ברוך הבא ${displayName}!`, { duration: 3000 })
      
      console.log('Google user logged in successfully:', googleData.user.email)
      
    } catch (error) {
      console.error('Google login error:', error)
      showError('שגיאה בהתחברות עם Google')
    }
  }

  const handleLogout = () => {
    // Clear all user-specific localStorage data
    if (currentUser) {
      localStorage.removeItem(getUserStorageKey(currentUser, 'todoist_tasks'))
      localStorage.removeItem(getUserStorageKey(currentUser, 'todoist_projects'))
      localStorage.removeItem(getUserStorageKey(currentUser, 'todoist_teams'))
      localStorage.removeItem(getUserStorageKey(currentUser, 'sidebar-width'))
      localStorage.removeItem(getUserStorageKey(currentUser, 'sidebar-visible'))
      localStorage.removeItem(getUserStorageKey(currentUser, 'projects-collapsed'))
      localStorage.removeItem(getUserStorageKey(currentUser, 'avatar_url'))
      localStorage.removeItem(getUserStorageKey(currentUser, 'user_initialized'))
      localStorage.removeItem(`${currentUser}_email_verified`) // Clear email verification status
    }
    // Clear global authentication data
    localStorage.removeItem('user_authenticated') // Clear authentication flag
    localStorage.removeItem('username') // Clear username
    
    // Clear any old global data that might interfere
    localStorage.removeItem('todoist_tasks')
    localStorage.removeItem('todoist_projects')
    localStorage.removeItem('todoist_teams')
    localStorage.removeItem('user_avatar_url')
    
    // Reset all state to initial values
    setTasks([])
    setProjects([])
    setTeams([])
    setCurrentView('today')
    setCurrentUser('') // Reset current user
    setIsAuthenticated(false) // Set user as not authenticated
    setUserEmailVerified(true) // Reset email verification status
    setVerificationEmail('') // Clear verification email
    setShowOnboarding(false) // Reset onboarding state
    setNeedsOnboarding(false) // Reset onboarding need
    setShowReopenButton(false) // Reset reopen button state
    setIsAutoHidden(false) // Reset auto-hide state
    setUserPreferredSidebarVisible(true) // Reset sidebar preference
    setUserManuallyOpenedOnMobile(false) // Reset mobile manual flag
    
    // Reset login form
    setLoginCredentials({ username: '', password: '' })
    setLoginError('')
    
    // Close any open modals
    setIsTaskModalOpen(false)
    setIsTaskEditModalOpen(false)
    setIsTaskDetailModalOpen(false)
    setIsProjectModalOpen(false)
    setIsTeamModalOpen(false)
    setIsSettingsModalOpen(false)
    setTaskToEdit(null)
    setTaskToDetail(null)
    
    // Show success message
    showSuccess('התנתקת בהצלחה!', { duration: 3000 })
    
    console.log('User logged out successfully')
  }

  const handleLogin = async (e) => {
    e?.preventDefault()
    
    setIsLoggingIn(true)
    setLoginError('')
    
    // Demo credentials validation
    const demoCredentials = [
      { username: 'demo', password: 'demo123' },
      { username: 'admin', password: 'admin123' },
      { username: 'משתמש', password: '123456' },
      { username: 'developer', password: 'dev2024' }
    ]
    
    const isValidCredentials = demoCredentials.some(
      cred => cred.username === loginCredentials.username && cred.password === loginCredentials.password
    )
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (isValidCredentials) {
      // Demo user login
    localStorage.setItem('user_authenticated', 'true')
      localStorage.setItem('username', loginCredentials.username)
      
      // Set user-specific avatar (first letter of username)
      localStorage.setItem(`${loginCredentials.username}_avatar_url`, '')
      
      // Clear current state before switching user
      setTasks([])
      setProjects([])
      setTeams([])
      
      setCurrentUser(loginCredentials.username)
    setIsAuthenticated(true)
    
    // Load data after login
    loadData()
    
    // Show success message
      showSuccess(`ברוך הבא ${loginCredentials.username}!`, { duration: 3000 })
      
      // Reset form
      setLoginCredentials({ username: '', password: '' })
      
      console.log('Demo user logged in successfully:', loginCredentials.username)
    } else {
      // Try registered user login via API
      try {
        // First, get CSRF token from Django
        const csrfResponse = await fetch('http://localhost:8000/', {
          method: 'GET',
          credentials: 'include'
        })
        
        // Extract CSRF token from cookies
        const csrfToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('csrftoken='))
          ?.split('=')[1]
        
        const response = await fetch('http://localhost:8000/api/auth/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRFToken': csrfToken || ''
          },
          credentials: 'include', // Include cookies for session authentication
          body: JSON.stringify({
            email: loginCredentials.username.trim(),
            password: loginCredentials.password
          })
        })

        const data = await response.json()

        if (data.success) {
          // Registered user login successful
          localStorage.setItem('user_authenticated', 'true')
          localStorage.setItem('username', data.user.email)
          
          // Clear current state before switching user
          setTasks([])
          setProjects([])
          setTeams([])
          
          setCurrentUser(data.user.email)
          setIsAuthenticated(true)
          
          // Check verification and onboarding status
          setUserEmailVerified(data.email_verified)
          
          console.log('=== LOGIN FIRST TIME CHECK ===')
          console.log('Email:', data.user.email)
          console.log('Email verified:', data.email_verified)
          console.log('First time login:', data.first_time_login)
          console.log('shouldShowOnboarding:', data.email_verified && data.first_time_login)
          console.log('=== END LOGIN FIRST TIME CHECK ===')
          
          // Show onboarding only if email is verified AND it's the user's first time login
          const shouldShowOnboarding = data.email_verified && data.first_time_login
          setNeedsOnboarding(data.first_time_login)
          
          // Store verification status in localStorage
          localStorage.setItem(`${data.user.email}_email_verified`, data.email_verified ? 'true' : 'false')
          
          // Get display name from profile (account settings) or fallback to email
          const profileName = data.user.profile?.name || data.user.first_name || data.user.username
          const displayName = profileName || data.user.email
          localStorage.setItem('user_display_name', displayName)
          // Broadcast so Sidebar updates immediately
          window.dispatchEvent(new CustomEvent('userNameUpdated', { detail: { newName: displayName } }))
          
          // If email is not verified, show verification page
          if (!data.email_verified) {
            setVerificationEmail(data.user.email)
            // Don't load data yet - user needs to verify email first
          } else if (shouldShowOnboarding) {
            // Email verified but needs onboarding and hasn't completed it
            setShowOnboarding(true)
          } else {
            // Fully verified and onboarded - load data
            loadData()
          }
          
          showSuccess(`ברוך הבא ${displayName}!`, { duration: 3000 })
          setLoginCredentials({ username: '', password: '' })
          
          console.log('Registered user logged in successfully:', data.user.email, {
            emailVerified: data.email_verified,
            needsOnboarding: data.needs_onboarding
          })
        } else {
          setLoginError(data.message || 'שם משתמש או סיסמה שגויים')
        }
      } catch (error) {
        console.error('Login error:', error)
        setLoginError('שם משתמש או סיסמה שגויים')
      }
    }
    
    setIsLoggingIn(false)
  }

  const handleRegisterSuccess = (user, message, emailSent) => {
    setRegistrationMessage(message)
    setShowRegistration(false)
    
    if (emailSent) {
      // Auto-login the user after successful registration
      localStorage.setItem('user_authenticated', 'true')
      localStorage.setItem('username', user.email)
      // Mark email as not verified in localStorage
      localStorage.setItem(`${user.email}_email_verified`, 'false')
      
      // Set user state
      setCurrentUser(user.email)
      setIsAuthenticated(true)
      setUserEmailVerified(false) // Email not verified yet
      setVerificationEmail(user.email)
      
      // Clear any existing data
      setTasks([])
      setProjects([])
      setTeams([])
      
      // Don't load data yet - user needs to verify email first
      
      showSuccess('ההרשמה הצליחה! אנא בדוק את תיבת הדואר שלך לאימות החשבון', { duration: 7000 })
      console.log('User auto-logged in after registration:', user.email)
    } else {
      // Fallback to normal registration success
      showSuccess('ההרשמה הצליחה! כעת תוכל להתחבר', { duration: 5000 })
      setLoginCredentials({
        username: user.email,
        password: ''
      })
    }
  }

  const handleSwitchToLogin = () => {
    setShowRegistration(false)
    setShowEmailVerification(false)
    setRegistrationMessage('')
  }

  const handleSwitchToRegistration = () => {
    setShowRegistration(true)
    setShowEmailVerification(false)
    setLoginError('')
    setRegistrationMessage('')
  }

  const handleResendVerification = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/resend-verification/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // Include cookies for session authentication
        body: JSON.stringify({ email: verificationEmail })
      })

      const data = await response.json()

      if (data.success) {
        showSuccess('נשלח אימייל אימות חדש! אנא בדוק את תיבת הדואר שלך.', { duration: 5000 })
      } else {
        if (data.rate_limited) {
          showSuccess('נשלחו יותר מדי אימיילי אימות. אנא נסה שוב בעוד שעה.', { duration: 5000 })
        } else {
          showSuccess(data.message || 'שגיאה בשליחת אימייל האימות', { duration: 5000 })
        }
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      showSuccess('שגיאה בשליחת אימייל האימות. אנא נסה שוב.', { duration: 5000 })
    }
  }

  const handleEmailVerification = async (token) => {
    setEmailVerificationStatus('verifying')
    
    try {
      const response = await fetch(`http://localhost:8000/api/auth/verify-email/${token}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include' // Include cookies for session authentication
      })

      const data = await response.json()

      if (data.success) {
        setEmailVerificationStatus('success')
        setUserEmailVerified(true)
        
        // Store verification status in localStorage
        if (currentUser) {
          localStorage.setItem(`${currentUser}_email_verified`, 'true')
        }
        
        showSuccess('החשבון אומת בהצלחה!', { duration: 5000 })
        
        // Clear URL parameter
        const url = new URL(window.location)
        url.searchParams.delete('verify')
        window.history.replaceState({}, '', url)
        
        // Email verification API logs the user in, so update authentication state
        if (data.user) {
          setCurrentUser(data.user.email)
          setIsAuthenticated(true)
          localStorage.setItem('user_authenticated', 'true')
          localStorage.setItem('username', data.user.email)
        }
        
        // Show onboarding after email verification (user is now logged in)
        setTimeout(() => {
          setShowOnboarding(true)
          setEmailVerificationStatus(null)
        }, 2000)
      } else {
        // Handle already used token case
        if (data.already_used) {
          setEmailVerificationStatus('success')
          setUserEmailVerified(true)
          
          // Store verification status in localStorage
          if (currentUser) {
            localStorage.setItem(`${currentUser}_email_verified`, 'true')
          }
          
          showSuccess('החשבון כבר אומת!', { duration: 5000 })
          
          // Clear URL parameter
          const url = new URL(window.location)
          url.searchParams.delete('verify')
          window.history.replaceState({}, '', url)
          
          // For already used tokens, we need to check if user should see onboarding
          // by checking their first_time_login status from the backend
          setTimeout(async () => {
            try {
              const userResponse = await fetch(`http://localhost:8000/api/users/?email=${encodeURIComponent(currentUser)}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
              })
              
              if (userResponse.ok) {
                const userData = await userResponse.json()
                if (userData.exists && userData.user && userData.user.profile) {
                  const firstTimeLogin = userData.user.profile.first_time_login
                  if (firstTimeLogin) {
                    // User needs onboarding, but they're not logged in
                    // Redirect to login page
                    showSuccess('אנא התחבר כדי להמשיך', { duration: 3000 })
                  } else {
                    // User doesn't need onboarding, redirect to login
                    showSuccess('אנא התחבר כדי להמשיך', { duration: 3000 })
                  }
                }
              }
            } catch (error) {
              console.error('Error checking user status:', error)
            }
            
            setEmailVerificationStatus(null)
          }, 2000)
        } else {
          setEmailVerificationStatus('error')
          showSuccess(data.message || 'שגיאה באימות החשבון', { duration: 5000 })
        }
        
        // Clear URL parameter
        const url = new URL(window.location)
        url.searchParams.delete('verify')
        window.history.replaceState({}, '', url)
      }
    } catch (error) {
      console.error('Email verification error:', error)
      setEmailVerificationStatus('error')
      showSuccess('שגיאה באימות החשבון. אנא נסה שוב.', { duration: 5000 })
      
      // Clear URL parameter
      const url = new URL(window.location)
      url.searchParams.delete('verify')
      window.history.replaceState({}, '', url)
    }
  }

  const handleOnboardingComplete = (onboardingData) => {
    console.log('=== ONBOARDING COMPLETION HANDLER ===')
    console.log('Onboarding completed with data:', onboardingData)
    console.log('Current user:', currentUser)
    console.log('Skipped flag:', onboardingData.skipped)
    
    setShowOnboarding(false)
    setNeedsOnboarding(false)
    
    console.log('Onboarding completed - first_time_login will be set to false in backend')
    console.log('=== END ONBOARDING COMPLETION HANDLER ===')
    
    // Update user state with onboarding data
    if (onboardingData.name) {
      // Update display name if needed
    }
    
    // Load user data and redirect to main app
    loadData()
    
    if (onboardingData.skipped) {
      showSuccess('התהליך הושלם - דילגת על ההגדרה', { duration: 3000 })
    } else {
      showSuccess('ברוך הבא! החשבון שלך מוכן לשימוש.', { duration: 3000 })
    }
  }

  const toggleSidebar = () => {
    const newVisibility = !isSidebarVisible
    const isMobile = viewportWidth <= TABLET_BREAKPOINT
    
    console.log('🔄 Toggle sidebar clicked:', { 
      currentVisibility: isSidebarVisible, 
      newVisibility, 
      viewportWidth, 
      isMobile 
    })
    
    // User manually toggled - update their preference
    setUserPreferredSidebarVisible(newVisibility)
    const sidebarKey = getUserStorageKey(currentUser, 'sidebar-visible')
    localStorage.setItem(sidebarKey, JSON.stringify(newVisibility))
    
    if (newVisibility) {
      // 📱 OPENING SIDEBAR
      setIsAutoHidden(false) // Clear any auto-hide state
      setIsSidebarVisible(true)
      setShowReopenButton(false)
      
      // If on mobile/narrow viewport, mark as manually opened
      if (isMobile) {
        setUserManuallyOpenedOnMobile(true)
        console.log('📱 Mobile: User manually opened sidebar - will stay open')
      } else {
        console.log('🖥️ Desktop: Opening sidebar')
      }
    } else {
      // ❌ CLOSING SIDEBAR  
      setIsSidebarVisible(false)
      setShowReopenButton(false)
      
      // Clear mobile manual flag when user manually closes
      if (userManuallyOpenedOnMobile) {
        setUserManuallyOpenedOnMobile(false)
        console.log('📱 Mobile: User manually closed sidebar - cleared flag')
      } else {
        console.log(`${isMobile ? '📱 Mobile' : '🖥️ Desktop'}: Closing sidebar`)
      }
      
      // Show reopen button after animation
      setTimeout(() => setShowReopenButton(true), 300)
    }
  }

  // Load user profile data (name, avatar, etc.)
  const loadUserProfile = async () => {
    try {
      console.log('👤 Loading user profile for:', currentUser)
      const profile = await userAPI.getProfile()
      
      if (profile && profile.name) {
        // Store the user's display name from database and broadcast to UI
        localStorage.setItem('user_display_name', profile.name)
        window.dispatchEvent(new CustomEvent('userNameUpdated', { detail: { newName: profile.name } }))
        console.log('✅ User display name loaded:', profile.name)
      }
      
      if (profile && profile.avatar_url) {
        // Store the user's avatar URL
        localStorage.setItem(`${currentUser}_avatar_url`, profile.avatar_url)
        console.log('✅ User avatar loaded:', profile.avatar_url)
      }
    } catch (error) {
      console.log('⚠️ Could not load user profile, using fallback:', error.message)
      // If we can't load from database, try to use existing localStorage data
      const existingName = localStorage.getItem('user_display_name')
      if (!existingName && currentUser.includes('@')) {
        // Fallback: use email prefix as display name
        localStorage.setItem('user_display_name', currentUser.split('@')[0])
      }
    }
  }

  // Track which date ranges have been loaded (lazy loading approach)
  const [loadedRanges, setLoadedRanges] = React.useState([])
  const [isLoadingEvents, setIsLoadingEvents] = React.useState(false)
  
  // Auto-refresh for shared projects
  useEffect(() => {
    // Check if we're viewing a shared project
    if (!isAuthenticated || !currentView.startsWith('project-')) {
      return
    }

    const projectId = currentView.replace('project-', '')
    const project = projects.find(p => p.id === parseInt(projectId))
    
    // Only auto-refresh if it's a shared project
    if (!project || !project.is_shared) {
      return
    }

    console.log('🔄 Auto-refresh enabled for shared project:', project.name)

    // Refresh data every 5 seconds
    const interval = setInterval(async () => {
      try {
        console.log('🔄 Auto-refreshing data for shared project...')
        const [tasksRes, projectsRes] = await Promise.all([
          taskAPI.getTasks(),
          projectAPI.getProjects()
        ])
        setTasks(Array.isArray(tasksRes) ? tasksRes : [])
        setProjects(Array.isArray(projectsRes) ? projectsRes : [])
      } catch (error) {
        console.error('Auto-refresh failed:', error)
      }
    }, 5000) // Refresh every 5 seconds

    return () => {
      console.log('🛑 Auto-refresh disabled')
      clearInterval(interval)
    }
  }, [currentView, isAuthenticated, projects])
  
  // Check if a date range is already loaded
  const isRangeLoaded = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    return loadedRanges.some(range => {
      const rangeStart = new Date(range.start)
      const rangeEnd = new Date(range.end)
      return start >= rangeStart && end <= rangeEnd
    })
  }
  
  // Fetch Google Calendar events for a specific date range (LAZY LOADING)
  const fetchGoogleCalendarEvents = async (startDate, endDate) => {
    try {
      // Check if we already have this range loaded
      if (startDate && endDate && isRangeLoaded(startDate, endDate)) {
        console.log(`📅 Range ${startDate} to ${endDate} already loaded (using cache)`)
        return
      }
      
      setIsLoadingEvents(true)
      
      // Build URL with date range
      let url = 'http://localhost:8000/api/calendar/events/'
      if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`
        console.log(`📅 Lazy loading events: ${startDate} to ${endDate}`)
      } else {
        // Initial load: current month ± 1 month buffer
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1) // 1 month before
        const end = new Date(now.getFullYear(), now.getMonth() + 2, 0) // 1 month after
        const startStr = start.toISOString().split('T')[0]
        const endStr = end.toISOString().split('T')[0]
        url += `?start_date=${startStr}&end_date=${endStr}`
        console.log(`📅 Initial load: ${startStr} to ${endStr} (current month ± 1 month)`)
        startDate = startStr
        endDate = endStr
      }
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.events) {
          console.log(`📅 Loaded ${data.events.length} events for range`)
          
          // Merge new events with existing ones (avoid duplicates)
          setGoogleCalendarEvents(prev => {
            const existingIds = new Set(prev.map(e => e.id))
            const newEvents = data.events.filter(e => !existingIds.has(e.id))
            console.log(`📅 Added ${newEvents.length} new events, ${prev.length} existing`)
            return [...prev, ...newEvents]
          })
          
          // Mark this range as loaded
          setLoadedRanges(prev => [...prev, { start: startDate, end: endDate }])
        } else {
          console.log('📅 No events found for this range')
        }
      } else {
        console.log('📅 Google Calendar not connected or error:', response.status)
      }
    } catch (error) {
      console.log('📅 Error fetching events:', error)
    } finally {
      setIsLoadingEvents(false)
    }
  }
  
  // Expose function to CalendarView for on-demand loading
  const loadEventsForRange = React.useCallback((startDate, endDate) => {
    fetchGoogleCalendarEvents(startDate, endDate)
  }, [])

  // Load data from Django API or localStorage
  const loadData = async () => {
      try {
        console.log('🔄 Loading data from API...', { currentUser })
        console.log('📦 Current localStorage keys:', Object.keys(localStorage).filter(key => key.includes('todoist') || key.includes(currentUser)))
        
        // Load user profile first
        await loadUserProfile()

        // Load from API (persisted DB). If it fails, fall back to localStorage demo
        try {
          const [tasksRes, projectsRes, teamsRes] = await Promise.all([
            taskAPI.getTasks(),
            projectAPI.getProjects(),
            teamAPI.getTeams()
          ])
          setTasks(Array.isArray(tasksRes) ? tasksRes : [])
          setProjects(Array.isArray(projectsRes) ? projectsRes : [])
          setTeams(Array.isArray(teamsRes) ? teamsRes : [])
          
          // Fetch Google Calendar events after main data is loaded
          fetchGoogleCalendarEvents()
          return
        } catch (e) {
          console.error('API fetch failed, falling back to localStorage defaults', e)
        }

        // Skip API for demo mode - go straight to localStorage/default data
        console.log('🎯 DEMO MODE: Skipping API, using localStorage/default data for user:', currentUser)
          
          // Try to load from localStorage
        const tasksKey = getUserStorageKey(currentUser, 'todoist_tasks')
        const projectsKey = getUserStorageKey(currentUser, 'todoist_projects')
        const teamsKey = getUserStorageKey(currentUser, 'todoist_teams')
        console.log('📂 Loading from localStorage:', { tasksKey, projectsKey, teamsKey })
        const savedTasks = localStorage.getItem(tasksKey)
        const savedProjects = localStorage.getItem(projectsKey)
        const savedTeams = localStorage.getItem(teamsKey)
        
        if (savedTasks || savedProjects || savedTeams) {
          console.log('✅ Loading from localStorage for user:', currentUser)
          const tasks = savedTasks ? JSON.parse(savedTasks) : []
          const projects = savedProjects ? JSON.parse(savedProjects) : []
          const teams = savedTeams ? JSON.parse(savedTeams) : []
          console.log('📋 Loaded data:', { tasks: tasks.length, projects: projects.length, teams: teams.length })
          setTasks(tasks)
          setProjects(projects)
          setTeams(teams)
          } else {
          // Check if user has been initialized before
          const userInitializedKey = getUserStorageKey(currentUser, 'user_initialized')
          const isUserInitialized = localStorage.getItem(userInitializedKey) === 'true'
          
          if (!isUserInitialized) {
            console.log('🆕 First time login for user:', currentUser, 'loading user-specific defaults')
            const today = new Date().toISOString().split('T')[0]
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayStr = yesterday.toISOString().split('T')[0]
            
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            const tomorrowStr = tomorrow.toISOString().split('T')[0]

            // User-specific default data
            const getUserSpecificData = (username) => {
              console.log('🔍 getUserSpecificData called with username:', username, 'type:', typeof username)
              if (username === 'developer') {
                console.log('✅ Matched developer case')
                return {
                  tasks: [
                    {
                      id: 1,
                      title: 'פיתוח פיצ\'ר חדש',
                      description: 'הוספת פונקציונליות לחיפוש מתקדם',
                      priority: 1,
                      due_time: today,
                      completed: false,
                      project: 'פיתוח'
                    },
                    {
                      id: 2,
                      title: 'תיקון באג בקוד',
                      description: 'פתרון בעיה בתצוגת תאריכים',
                      priority: 2,
                      due_time: `${today}T16:00`,
                      completed: false,
                      project: 'תיקונים'
                    },
                    {
                      id: 3,
                      title: 'בדיקות יחידה',
                      description: 'כתיבת בדיקות לפונקציות חדשות',
                      priority: 3,
                      due_time: tomorrowStr,
                      completed: false,
                      project: 'בדיקות'
                    },
                    {
                      id: 4,
                      title: 'סקירת קוד',
                      description: 'ביקורת קוד של חבר צוות',
                      priority: 2,
                      due_time: `${today}T11:00`,
                      completed: false,
                      project: 'איכות'
                    }
                  ],
                  projects: [
                    {
                      id: 1,
                      name: 'פיתוח',
                      color: '#2563eb',
                      icon: '#',
                      tasks_count: 2,
                      team: null
                    },
                    {
                      id: 2,
                      name: 'תיקונים',
                      color: '#dc2626',
                      icon: '#',
                      tasks_count: 1,
                      team: null
                    },
                    {
                      id: 3,
                      name: 'בדיקות',
                      color: '#16a34a',
                      icon: '#',
                      tasks_count: 1,
                      team: null
                    },
                    {
                      id: 4,
                      name: 'איכות',
                      color: '#ca8a04',
                      icon: '#',
                      tasks_count: 1,
                      team: null
                    }
                  ],
                  teams: [
                    {
                      id: 1,
                      name: 'צוות פיתוח',
                      color: '#2563eb',
                      project_count: 3,
                      member_count: 4
                    },
                    {
                      id: 2,
                      name: 'QA ובדיקות',
                      color: '#16a34a',
                      project_count: 1,
                      member_count: 2
                    }
                  ]
                }
              } else if (username === 'admin') {
                console.log('✅ Matched admin case')
                return {
                  tasks: [
                    {
                      id: 1,
                      title: 'בדיקת אבטחה של המערכת',
                      description: 'סריקת פגיעויות ובדיקת הרשאות',
                      priority: 1,
                      due_time: today,
                      completed: false,
                      project: 'אבטחה'
                    },
                    {
                      id: 2,
                      title: 'פגישת צוות מנהלים',
                      description: 'דיון על תקציב ותכנון',
                      priority: 1,
                      due_time: `${today}T14:00`,
                      completed: false,
                      project: 'ניהול'
                    },
                    {
                      id: 3,
                      title: 'סקירת ביצועים חודשית',
                      description: '',
                      priority: 2,
                      due_time: tomorrowStr,
                      completed: false,
                      project: 'דוחות'
                    }
                  ],
                  projects: [
                    {
                      id: 1,
                      name: 'אבטחה',
                      color: '#e44332',
                      icon: '#',
                      tasks_count: 3,
                      team: null
                    },
                    {
                      id: 2,
                      name: 'ניהול',
                      color: '#ff9500',
                      icon: '#',
                      tasks_count: 2,
                      team: null
                    },
                    {
                      id: 3,
                      name: 'דוחות',
                      color: '#4073ff',
                      icon: '#',
                      tasks_count: 1,
                      team: null
                    }
                  ],
                  teams: [
                    {
                      id: 1,
                      name: 'צוות IT',
                      color: '#4073ff',
                      project_count: 2,
                      member_count: 5
                    },
                    {
                      id: 2,
                      name: 'מנהלים בכירים',
                      color: '#ff9500',
                      project_count: 1,
                      member_count: 3
                    }
                  ]
                }
              } else if (username === 'משתמש') {
                console.log('✅ Matched משתמש case')
                return {
                  tasks: [
                    {
                      id: 1,
                      title: 'קניית מצרכים לסוף השבוע',
                      description: 'חלב, לחם, ירקות',
                      priority: 3,
                      due_time: today,
                      completed: false,
                      project: 'קניות'
                    },
                    {
                      id: 2,
                      title: 'פגישה עם רופא המשפחה',
                      description: 'בדיקה תקופתית',
                      priority: 2,
                      due_time: `${today}T10:30`,
                      completed: false,
                      project: 'בריאות'
                    },
                    {
                      id: 3,
                      title: 'הכנת ארוחת ערב',
                      description: 'פסטה עם ירקות',
                      priority: 4,
                      due_time: `${today}T18:00`,
                      completed: false,
                      project: 'בית'
                    }
                  ],
                  projects: [
                    {
                      id: 1,
                      name: 'קניות',
                      color: '#7ecc49',
                      icon: '#',
                      tasks_count: 2,
                      team: null
                    },
                    {
                      id: 2,
                      name: 'בריאות',
                      color: '#e44332',
                      icon: '#',
                      tasks_count: 1,
                      team: null
                    },
                    {
                      id: 3,
                      name: 'בית',
                      color: '#fad000',
                      icon: '#',
                      tasks_count: 1,
                      team: null
                    }
                  ],
                  teams: [
                    {
                      id: 1,
                      name: 'משפחה',
                      color: '#7ecc49',
                      project_count: 2,
                      member_count: 4
                    }
                  ]
                }
              } else {
                console.log('✅ Matched default case (demo user)')
                // Default data for 'demo' user
                return {
                  tasks: [
              {
                id: 1,
                title: 'בדוק האם יש הודעות בתיבת הדואר',
                description: 'להתקשר ללקוח חשוב',
                priority: 4,
                due_time: yesterdayStr,
                completed: false,
                project: 'כושר'
              },
              {
                id: 2,
                title: 'פגישה עם הצוות',
                description: 'לדון על הפרויקט החדש',
                priority: 2,
                due_time: `${today}T17:00`,
                completed: false,
                project: 'תורים'
              },
              {
                id: 3,
                title: 'עשה 30 דקות יוגה',
                description: '',
                priority: 3,
                due_time: today,
                completed: false,
                project: 'כושר'
              },
              {
                id: 4,
                title: 'קנה מתנה לאמא',
                description: 'יום הולדת מחר',
                priority: 1,
                due_time: tomorrowStr,
                completed: false,
                project: 'קניות'
              },
              {
                id: 5,
                title: 'כתוב דוח חודשי',
                description: '',
                priority: 2,
                due_time: '',
                completed: false,
                project: 'תורים'
              }
                  ],
                  projects: [
              {
                id: 1,
                name: 'כושר',
                color: '#e44332',
                icon: '#',
                tasks_count: 3,
                team: null
              },
              {
                id: 2,
                name: 'קניות',
                color: '#fad000',
                icon: '#',
                tasks_count: 5,
                team: null
              },
              {
                id: 3,
                name: 'תורים',
                color: '#4073ff',
                icon: '#',
                tasks_count: 2,
                team: null
              }
                  ],
                  teams: [
              {
                id: 1,
                name: 'פיתוח מוצר',
                color: '#4073ff',
                project_count: 2,
                member_count: 3
              },
              {
                id: 2,
                name: 'צוות שיווק',
                color: '#7ECC49',
                project_count: 1,
                member_count: 4
              }
            ]
                }
              }
            }

            const userData = getUserSpecificData(currentUser)
            const defaultTasks = userData.tasks
            const defaultProjects = userData.projects
            const defaultTeams = userData.teams
            
            console.log('🎯 Loading default data for:', currentUser, { tasks: defaultTasks.length, projects: defaultProjects.length, teams: defaultTeams.length })
            console.log('📋 First few task titles:', defaultTasks.slice(0, 3).map(t => t.title))
            console.log('🏷️ Project names:', defaultProjects.map(p => p.name))
            
            setTasks(defaultTasks)
            setProjects(defaultProjects)
            setTeams(defaultTeams)
            
            // Save defaults to localStorage
            localStorage.setItem(getUserStorageKey(currentUser, 'todoist_tasks'), JSON.stringify(defaultTasks))
            localStorage.setItem(getUserStorageKey(currentUser, 'todoist_projects'), JSON.stringify(defaultProjects))
            localStorage.setItem(getUserStorageKey(currentUser, 'todoist_teams'), JSON.stringify(defaultTeams))
            
            // Mark user as initialized
            localStorage.setItem(getUserStorageKey(currentUser, 'user_initialized'), 'true')
          } else {
            console.log('🔄 User already initialized, loading empty data for:', currentUser)
            setTasks([])
            setProjects([])
            setTeams([])
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

  // Check user verification status when authenticated (for page refresh)
  useEffect(() => {
    const validateUserExists = async () => {
      if (isAuthenticated && currentUser) {
        try {
        // Try to validate user exists on backend
        console.log('🔍 Validating user exists on backend for:', currentUser)
        const response = await fetch(`http://localhost:8000/api/users/?email=${encodeURIComponent(currentUser)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          credentials: 'include' // Include cookies for session authentication
        })
        
        console.log('🔍 User validation response status:', response.status)
        console.log('🔍 User validation response ok:', response.ok)

          if (response.status === 404) {
            // User doesn't exist on backend - clear everything and logout
            console.log('User not found on backend (404), logging out')
            handleLogout()
            showSuccess('המשתמש לא קיים יותר במערכת', { duration: 3000 })
            return
          } else if (!response.ok) {
            // Other errors (like 401) - don't logout, just log the error
            console.log('User validation API error:', response.status, response.statusText)
            console.log('Not logging out user, continuing with localStorage data')
            
            // Continue with localStorage data instead of logging out
            const storedVerificationStatus = localStorage.getItem(`${currentUser}_email_verified`)
            if (storedVerificationStatus === 'true') {
              setUserEmailVerified(true)
              setNeedsOnboarding(false)
              loadData()
            } else {
              setUserEmailVerified(false)
              setVerificationEmail(currentUser)
              setNeedsOnboarding(false)
            }
            return
          }

          // User exists - check verification status
          const storedVerificationStatus = localStorage.getItem(`${currentUser}_email_verified`)
          
          if (storedVerificationStatus === 'true') {
            setUserEmailVerified(true)
            // For page refresh, we need to check the backend for first_time_login status
            // Make a quick API call to get the current first_time_login status
            try {
              const userResponse = await fetch(`http://localhost:8000/api/users/?email=${encodeURIComponent(currentUser)}`, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json'
                },
                credentials: 'include' // Include cookies for session authentication
              })
              
              if (userResponse.ok) {
                const userData = await userResponse.json()
                if (userData.exists && userData.user && userData.user.profile) {
                  const firstTimeLogin = userData.user.profile.first_time_login
                  setNeedsOnboarding(firstTimeLogin)
                  
                  if (firstTimeLogin) {
                    setShowOnboarding(true)
                  } else {
                    loadData()
                  }
                } else {
                  // Fallback: assume no onboarding needed
                  setNeedsOnboarding(false)
                  loadData()
                }
              } else {
                // Fallback: assume no onboarding needed
                setNeedsOnboarding(false)
                loadData()
              }
            } catch (error) {
              console.log('Error checking first_time_login status, assuming no onboarding needed')
              // Fallback: assume no onboarding needed
              setNeedsOnboarding(false)
              loadData()
            }
          } else {
            setUserEmailVerified(false)
            setVerificationEmail(currentUser)
            setNeedsOnboarding(false)
          }
        } catch (error) {
          console.log('Error validating user, assuming user exists')
          // If we can't validate, assume user exists and proceed
          const storedVerificationStatus = localStorage.getItem(`${currentUser}_email_verified`)
          
          if (storedVerificationStatus === 'true') {
            setUserEmailVerified(true)
            // If we can't check backend, assume no onboarding needed for safety
            setNeedsOnboarding(false)
            loadData()
          } else {
            setUserEmailVerified(false)
            setVerificationEmail(currentUser)
            setNeedsOnboarding(false)
          }
        }
      }
    }

    validateUserExists()
  }, [isAuthenticated, currentUser])

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated && userEmailVerified) {
      console.log('🚀 Authentication changed, loading data for:', currentUser)
      loadData()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, userEmailVerified])

  // Reload data when user changes (only after verification to avoid 403s)
  useEffect(() => {
    if (isAuthenticated && currentUser && userEmailVerified) {
      console.log('👤 User changed, reloading data for:', currentUser)
      console.log('📦 Available localStorage keys:', Object.keys(localStorage))
      console.log('🔍 User-specific keys:', Object.keys(localStorage).filter(key => key.startsWith(currentUser)))
      
      // Force clear state before loading new user data
      setTasks([])
      setProjects([])
      setTeams([])
      
      loadData()
    }
  }, [currentUser, userEmailVerified])

  const handleCreateTask = async (newTask) => {
    try {
      const createdTask = await taskAPI.createTask(newTask)
      setTasks(prev => [...prev, createdTask])
      showTaskCreated(newTask.title)
    } catch (error) {
      console.log('Failed to create task via API:', error.message)
    }
  }

  const handleCreateProject = async (projectData) => {
    // Optimistic update - add project immediately to UI
    const localProject = { ...projectData, id: Date.now() }
    setProjects(prevProjects => {
      const newProjects = [...prevProjects, localProject]
      localStorage.setItem(getUserStorageKey(currentUser, 'todoist_projects'), JSON.stringify(newProjects))
      return newProjects
    })

    // Show success toast
    showSuccess(`פרויקט "${projectData.name}" נוצר בהצלחה`)

    // Try to sync with API in background (non-blocking)
    try {
      const createdProject = await projectAPI.createProject(projectData)
      // Update with server response
      setProjects(prevProjects => {
        const updatedProjects = prevProjects.map(project => 
          project.id === localProject.id ? { ...project, ...createdProject } : project
        )
        localStorage.setItem(getUserStorageKey(currentUser, 'todoist_projects'), JSON.stringify(updatedProjects))
        return updatedProjects
      })
      console.log('Project synced with API:', createdProject)
    } catch (error) {
      console.log('API sync failed, project remains local:', error.message)
      // Project is already in local state, no need to do anything
    }
  }

  const handleRenameProject = async (projectId, newName) => {
    const trimmedName = (newName || '').trim()
    if (!trimmedName) return

    const existing = projects.find(p => p.id === projectId)
    if (!existing) return
    const oldName = existing.name
    if (oldName === trimmedName) return

    // Optimistically update projects
    setProjects(prev => {
      const updated = prev.map(p => p.id === projectId ? { ...p, name: trimmedName } : p)
      localStorage.setItem(getUserStorageKey(currentUser, 'todoist_projects'), JSON.stringify(updated))
      return updated
    })

    // Optimistically update tasks that belong to this project (by name match)
    setTasks(prev => {
      const updatedTasks = prev.map(t => t.project === oldName ? { ...t, project: trimmedName } : t)
      localStorage.setItem(getUserStorageKey(currentUser, 'todoist_tasks'), JSON.stringify(updatedTasks))
      return updatedTasks
    })

    // Try to sync with API in background
    try {
      await projectAPI.updateProject(projectId, { name: trimmedName })
    } catch (error) {
      console.log('Failed to update project name via API:', error.message)
      // Keep optimistic state; subsequent reload will resync
    }
  }

  const handleCreateTeam = async (teamData) => {
    // Optimistic update - add team immediately to UI
    const localTeam = { ...teamData, id: Date.now() }
    setTeams(prevTeams => {
      const newTeams = [...prevTeams, localTeam]
      localStorage.setItem(getUserStorageKey(currentUser, 'todoist_teams'), JSON.stringify(newTeams))
      return newTeams
    })

    // Show success toast
    showSuccess(`צוות "${teamData.name}" נוצר בהצלחה`)

    // Try to sync with API in background (non-blocking)
    try {
      const createdTeam = await teamAPI.createTeam(teamData)
      // Update with server response
      setTeams(prevTeams => {
        const updatedTeams = prevTeams.map(team => 
          team.id === localTeam.id ? { ...team, ...createdTeam } : team
        )
        localStorage.setItem(getUserStorageKey(currentUser, 'todoist_teams'), JSON.stringify(updatedTeams))
        return updatedTeams
      })
      console.log('Team synced with API:', createdTeam)
    } catch (error) {
      console.log('API sync failed, team remains local:', error.message)
      // Team is already in local state, no need to do anything
    }
  }

  const openTaskModal = (initialData = null) => {
    setInitialTaskData(initialData)
    setIsTaskModalOpen(true)
  }

  const closeTaskModal = () => {
    setIsTaskModalOpen(false)
    setInitialTaskData(null)
  }

  const openProjectModal = () => {
    setIsProjectModalOpen(true)
  }

  const closeProjectModal = () => {
    setIsProjectModalOpen(false)
  }

  const openTeamModal = () => {
    setIsTeamModalOpen(true)
  }

  const closeTeamModal = () => {
    setIsTeamModalOpen(false)
  }

  const openTeamProjectModal = () => {
    setIsTeamProjectModalOpen(true)
  }

  const closeTeamProjectModal = () => {
    setIsTeamProjectModalOpen(false)
  }

  const openFriendListModal = () => {
    setIsFriendListModalOpen(true)
  }

  const closeFriendListModal = () => {
    setIsFriendListModalOpen(false)
  }

  const openSettingsModal = () => {
    setIsSettingsModalOpen(true)
  }

  const closeSettingsModal = () => {
    setIsSettingsModalOpen(false)
  }

  const openNotificationInbox = () => {
    setIsNotificationInboxOpen(true)
  }

  const closeNotificationInbox = () => {
    setIsNotificationInboxOpen(false)
  }

  const openShareModal = (project) => {
    setProjectToShare(project)
    setIsShareModalOpen(true)
  }

  const closeShareModal = () => {
    setIsShareModalOpen(false)
    setProjectToShare(null)
  }

  const handleNavigateFromSearch = (navigateTo) => {
    // Parse navigation string and set appropriate view
    if (navigateTo.startsWith('project:')) {
      const projectName = navigateTo.replace('project:', '')
      setCurrentView(`project-${projectName}`)
    } else if (navigateTo.startsWith('team:')) {
      const teamId = navigateTo.replace('team:', '')
      setCurrentView(`team-${teamId}`)
    } else if (navigateTo === 'inbox') {
      setCurrentView('inbox')
    } else if (navigateTo === 'today') {
      setCurrentView('today')
    } else if (navigateTo === 'upcoming') {
      setCurrentView('upcoming')
    } else if (navigateTo === 'completed') {
      setCurrentView('completed')
    }
  }

  const handleSelectProject = (projectId) => {
    if (!projectId) return
    setCurrentView(`project-${projectId}`)
  }

  const openTaskEditModal = (task) => {
    setTaskToEdit(task)
    setIsTaskEditModalOpen(true)
  }

  const closeTaskEditModal = () => {
    setIsTaskEditModalOpen(false)
    setTaskToEdit(null)
  }

  const openTaskDetailModal = (task) => {
    setTaskToDetail(task)
    setIsTaskDetailModalOpen(true)
  }

  const closeTaskDetailModal = () => {
    setIsTaskDetailModalOpen(false)
    setTaskToDetail(null)
  }

  const handleUpdateTask = async (updatedTask) => {
    // Add timestamp for tracking local updates
    const taskWithTimestamp = {
      ...updatedTask,
      updated_at: new Date().toISOString()
    }
    
    // Optimistic update - update task immediately in UI
    setTasks(prevTasks => {
      const newTasks = prevTasks.map(task => 
        task.id === updatedTask.id ? { ...task, ...taskWithTimestamp } : task
      )
      localStorage.setItem(getUserStorageKey(currentUser, 'todoist_tasks'), JSON.stringify(newTasks))
      return newTasks
    })

    // Show success toast
    showSuccess(`משימה "${updatedTask.title}" עודכנה בהצלחה`)

    // Try to sync with API in background (non-blocking)
    try {
      const updatedTaskFromAPI = await taskAPI.updateTask(updatedTask.id, updatedTask)
      // Update with server response if different
      setTasks(prevTasks => {
        const newTasks = prevTasks.map(task => 
          task.id === updatedTask.id ? { ...task, ...updatedTaskFromAPI } : task
        )
        localStorage.setItem(getUserStorageKey(currentUser, 'todoist_tasks'), JSON.stringify(newTasks))
        return newTasks
      })
      console.log('Task synced with API:', updatedTaskFromAPI)
    } catch (error) {
      console.log('API sync failed, task update remains local:', error.message)
      // Task is already updated in local state, no need to do anything
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen main-bg flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-description hebrew-text text-base">טוען...</div>
        </div>
      </div>
    )
  }

  // Show different screens based on authentication and verification status
  
  // Onboarding flow will be handled inside MainContent now
  
  // Show main app with verification modal overlay if authenticated but email not verified
  // This will be handled in the main return statement below

  // Show login/registration screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen main-bg flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md mx-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
              ל
            </div>
            <h1 className="text-2xl font-bold text-primary hebrew-text mb-2">ברוכים הבאים ל-TodoFast</h1>
            <p className="text-description hebrew-text">
              {showRegistration ? 'הירשמו כדי להתחיל לנהל את המשימות שלכם' : 'התחברו כדי להתחיל לנהל את המשימות שלכם'}
            </p>
          </div>

          {/* Registration success message */}
          {registrationMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-600 text-sm hebrew-text">{registrationMessage}</p>
            </div>
          )}

          {/* Toggle between login, registration, and email verification */}
          {showEmailVerification ? (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 001.78 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 hebrew-text mb-2">בדוק את תיבת הדואר שלך</h2>
                <p className="text-gray-600 hebrew-text mb-4">
                  שלחנו אימייל אימות לכתובת:
                </p>
                <p className="text-lg font-medium text-blue-600 mb-6" dir="ltr">{verificationEmail}</p>
                <p className="text-sm text-gray-500 hebrew-text mb-6">
                  לחץ על הקישור באימייל כדי לאמת את החשבון שלך. אם לא רואה את האימייל, בדוק בתיקיית ספאם.
                </p>
              </div>

              <div className="space-y-4">
            <button
                  onClick={handleResendVerification}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-base font-medium hebrew-text"
                >
                  שלח שוב אימייל אימות
                </button>

                <button
                  onClick={handleSwitchToLogin}
                  className="w-full text-gray-600 hover:text-gray-800 py-2 px-4 transition-colors text-base hebrew-text"
                >
                  חזור לעמוד הכניסה
            </button>
          </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 hebrew-text">
                  <strong>טיפ:</strong> קישור האימות תקף ל-24 שעות. אם פג התוקף, תוכל לבקש קישור חדש.
                </p>
              </div>
            </div>
          ) : showRegistration ? (
            <RegistrationForm
              onRegisterSuccess={handleRegisterSuccess}
              onSwitchToLogin={handleSwitchToLogin}
              isLoading={isLoggingIn}
              setIsLoading={setIsLoggingIn}
            />
          ) : (
            <div>
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 hebrew-text mb-2">
                    שם משתמש או אימייל
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={loginCredentials.username}
                    onChange={(e) => setLoginCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent hebrew-text"
                    placeholder="הכנס שם משתמש או אימייל"
                    autoComplete="username"
                    required
                    disabled={isLoggingIn}
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 hebrew-text mb-2">
                    סיסמה
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={loginCredentials.password}
                    onChange={(e) => setLoginCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="הכנס סיסמה"
                    autoComplete="current-password"
                    required
                    disabled={isLoggingIn}
                  />
                </div>
                
                {loginError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm hebrew-text">{loginError}</p>
                  </div>
                )}
                
            <button
                  type="submit"
                  disabled={isLoggingIn || !loginCredentials.username || !loginCredentials.password}
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors text-base font-medium hebrew-text disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                      מתחבר...
                    </>
                  ) : (
                    'התחבר'
                  )}
            </button>
              </form>

              {/* Google Login Button */}
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500 hebrew-text">או</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <GoogleLoginButton 
                    onGoogleLogin={handleGoogleLogin}
                    disabled={isLoggingIn}
                  />
                </div>
              </div>

              {/* Switch to Registration */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 hebrew-text">
                  אין לך חשבון?{' '}
                  <button
                    type="button"
                    onClick={handleSwitchToRegistration}
                    className="text-red-600 hover:text-red-500 font-medium"
                    disabled={isLoggingIn}
                  >
                    הירשם כאן
                  </button>
                </p>
          </div>
            </div>
          )}

          {/* Demo credentials info - only show on login screen */}
          {!showRegistration && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 hebrew-text mb-3">פרטי התחברות לדמו:</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span className="hebrew-text">משתמש רגיל:</span>
                <span className="font-mono">demo / demo123</span>
          </div>
              <div className="flex justify-between">
                <span className="hebrew-text">מנהל:</span>
                <span className="font-mono">admin / admin123</span>
              </div>
              <div className="flex justify-between">
                <span className="hebrew-text">משתמש עברי:</span>
                <span className="font-mono">משתמש / 123456</span>
              </div>
              <div className="flex justify-between">
                <span className="hebrew-text">מפתח:</span>
                <span className="font-mono">developer / dev2024</span>
              </div>
            </div>
            <div className="mt-6 p-3 bg-red-50 rounded border border-red-200 space-y-3">
              <h4 className="text-sm font-medium text-red-700 hebrew-text">כלי פיתוח:</h4>
              <button
                onClick={() => {
                  console.log('Clearing ALL localStorage data...')
                  localStorage.clear()
                  alert('כל הנתונים נמחקו! העמוד יתרענן.')
                  window.location.reload()
                }}
                className="w-full py-2 px-3 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-100 hebrew-text"
              >
                🗑️ נקה את כל הנתונים
              </button>
              <button
                onClick={() => {
                  console.log('🧹 FORCE CLEARING ALL USER DATA...')
                  
                  // Get all localStorage keys
                  const allKeys = Object.keys(localStorage)
                  console.log('📋 All keys before cleanup:', allKeys)
                  
                  // Clear ALL data except authentication
                  allKeys.forEach(key => {
                    if (key !== 'user_authenticated' && key !== 'username' && key !== 'darkMode') {
                      localStorage.removeItem(key)
                      console.log('🗑️ Removed:', key)
                    }
                  })
                  
                  console.log('📋 Remaining keys after cleanup:', Object.keys(localStorage))
                  alert('🧹 כל הנתונים נמחקו לחלוטין! משתמשים יקבלו נתוני ברירת מחדל חדשים.')
                  window.location.reload()
                }}
                className="w-full py-2 px-3 text-sm text-orange-600 hover:text-orange-800 border border-orange-300 rounded hover:bg-orange-100 hebrew-text"
              >
                🔄 איפוס נתוני משתמשים
              </button>
              <button
                onClick={() => {
                  console.log('🎯 TESTING: Simulating first-time login for all users...')
                  
                  // Remove ONLY the user_initialized flags to force default data loading
                  const users = ['demo', 'admin', 'משתמש', 'developer']
                  users.forEach(user => {
                    const initKey = `${user}_user_initialized`
                    if (localStorage.getItem(initKey)) {
                      localStorage.removeItem(initKey)
                      console.log(`🗑️ Removed initialization flag for: ${user}`)
                    }
                  })
                  
                  alert('🧪 הוסרו דגלי האתחול! משתמשים יקבלו נתונים חדשים בהתחברות הבאה.')
                  window.location.reload()
                }}
                className="w-full py-2 px-3 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-100 hebrew-text"
              >
                🧪 בדיקה: איפוס דגלי משתמשים
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden main-bg flex flex-col" dir="rtl">
      {/* Email verification status overlay (only during verification process) */}
      {emailVerificationStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" dir="rtl">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
            {emailVerificationStatus === 'verifying' && (
              <>
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-700 hebrew-text">מאמת את החשבון...</p>
              </>
            )}
            {emailVerificationStatus === 'success' && (
              <>
                <div className="w-8 h-8 text-green-500 mx-auto mb-4">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-green-700 hebrew-text">האימות הושלם בהצלחה!</p>
              </>
            )}
            {emailVerificationStatus === 'error' && (
              <>
                <div className="w-8 h-8 text-red-500 mx-auto mb-4">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-red-700 hebrew-text">שגיאה באימות החשבון</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating sidebar toggle (only when sidebar is hidden and animation finished) */}
      {!isSidebarVisible && showReopenButton && (
        <button
          onClick={(e) => {
            console.log('🔘 Floating button clicked!', { 
              viewportWidth, 
              isSidebarVisible, 
              userManuallyOpenedOnMobile 
            })
            e.preventDefault()
            e.stopPropagation()
            toggleSidebar()
          }}
          title={`הצג סרגל צד (${viewportWidth}px) ${isAutoHidden ? '- סגירה אוטומטית' : '- סגירה ידנית'}`}
          className={`floating-sidebar-btn fixed z-[70] transition-all duration-300 ${
            viewportWidth <= MOBILE_BREAKPOINT 
              ? 'top-3 right-3 p-2 bg-transparent' 
              : viewportWidth <= TABLET_BREAKPOINT
              ? 'top-4 right-4 scale-110 bg-white/90 backdrop-blur-sm rounded-xl p-3'
              : 'top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-3'
          }`}
          style={{ direction: 'rtl' }}
        >
          <div className="relative">
            <SidebarCssIcon width={26} height={22} />
          </div>
          {/* Debug info for development */}
        </button>
      )}

      {/* Mobile Overlay - Show when sidebar is open on mobile */}
      {viewportWidth <= 767 && isSidebarVisible && (
        <div 
          className="sidebar-overlay fixed inset-0 bg-black bg-opacity-50 z-90"
          onClick={(e) => {
            console.log('🌑 Overlay clicked, closing sidebar', { userManuallyOpenedOnMobile })
            e.preventDefault()
            e.stopPropagation()
            toggleSidebar()
          }}
        />
      )}

      {/* Main App Container */}
      <div className="main-container flex w-full flex-1 min-h-0">
         <Sidebar 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          projects={projects}
          teams={teams}
          tasks={tasks}
          onOpenTaskModal={openTaskModal}
          onOpenProjectModal={openProjectModal}
          onOpenTeamModal={openTeamModal}
          onOpenFriendList={openFriendListModal}
          onOpenSettingsModal={openSettingsModal}
          onLogout={handleLogout}
          onToggleSidebar={toggleSidebar}
          isSidebarVisible={isSidebarVisible}
          viewportWidth={viewportWidth}
          isAutoHidden={isAutoHidden}
          currentUser={currentUser}
          userEmailVerified={userEmailVerified}
          onOpenNotificationInbox={openNotificationInbox}
         />
          
          {/* Conditionally render CompletedTasks or MainContent */}
          {currentView === 'completed' ? (
            <div className="flex-1 overflow-auto p-8">
              <CompletedTasks 
                projects={projects}
                currentUser={currentUser}
                onNavigate={setCurrentView}
                onOpenTaskDetail={openTaskDetailModal}
              />
            </div>
          ) : (
            <MainContent 
              currentView={currentView}
              tasks={tasks}
              setTasks={setTasks}
              projects={projects}
              teams={teams}
              googleCalendarEvents={googleCalendarEvents}
              onLoadEventsForRange={loadEventsForRange}
              onOpenTaskModal={openTaskModal}
              onOpenProjectModal={openProjectModal}
              onSelectProject={handleSelectProject}
              onCreateTask={handleCreateTask}
              onEditTask={openTaskEditModal}
              onUpdateTask={handleUpdateTask}
              onOpenTaskDetail={openTaskDetailModal}
              viewportWidth={viewportWidth}
              isSidebarVisible={isSidebarVisible}
              currentUser={currentUser}
              userEmailVerified={userEmailVerified}
              onResendVerification={handleResendVerification}
              showOnboarding={showOnboarding}
              onCompleteOnboarding={handleOnboardingComplete}
              onRenameProject={handleRenameProject}
              onOpenShareModal={openShareModal}
            />
          )}
      </div>

      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={isTaskModalOpen}
        onClose={closeTaskModal}
        onCreateTask={handleCreateTask}
        projects={projects}
        teams={teams}
        currentView={currentView}
        initialData={initialTaskData}
        currentUser={currentUser}
      />

      {/* Task Edit Modal */}
      <TaskEditModal
        isOpen={isTaskEditModalOpen}
        onClose={closeTaskEditModal}
        onUpdateTask={handleUpdateTask}
        task={taskToEdit ? tasks.find(t => t.id === taskToEdit.id) || taskToEdit : null}
        projects={projects}
        teams={teams}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={isTaskDetailModalOpen}
        task={taskToDetail ? tasks.find(t => t.id === taskToDetail.id) || taskToDetail : null}
        onClose={closeTaskDetailModal}
        onUpdateTask={handleUpdateTask}
        projects={projects}
        teams={teams}
      />

      {/* Project Creation Modal */}
      <ProjectCreationModal 
        isOpen={isProjectModalOpen}
        onClose={closeProjectModal}
        onCreateProject={handleCreateProject}
        teams={teams}
      />

      {/* Team Creation Modal */}
      <TeamCreationModal 
        isOpen={isTeamModalOpen}
        onClose={closeTeamModal}
        onCreateTeam={handleCreateTeam}
      />

      {/* Team Project Modal */}
      <TeamProjectModal 
        isOpen={isTeamProjectModalOpen}
        onClose={closeTeamProjectModal}
        onCreateProject={handleCreateProject}
        teams={teams}
      />

      {/* Friend List Modal */}
      <FriendListModal 
        isOpen={isFriendListModalOpen}
        onClose={closeFriendListModal}
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={closeSettingsModal}
        onNavigate={handleNavigateFromSearch}
        currentUser={currentUser}
      />

      <NotificationInbox
        isOpen={isNotificationInboxOpen}
        onClose={closeNotificationInbox}
        onProjectUpdate={loadData}
      />

      <ShareProjectModal
        isOpen={isShareModalOpen}
        onClose={closeShareModal}
        project={projectToShare}
        onShareComplete={loadData}
      />

      {/* Toast Container */}
      <ToastContainer />
      
    </div>
  )
}

function App() {
  return (
    <DarkModeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </DarkModeProvider>
  )
}

export default App