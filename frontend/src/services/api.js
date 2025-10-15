import axios from 'axios'

// Base URL for your Django API - Environment aware
const getAPIBaseURL = () => {
  // If accessing via ngrok, use the backend ngrok URL
  // NOTE: Update this URL each time you restart ngrok, or use localhost for development
  if (window.location.hostname.includes('ngrok')) {
    return 'https://00b0433173cf.ngrok-free.app/api'  // Update this when ngrok URL changes
  }
  // Check if we're in production (when served from Django)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Production: Use the same origin as the current page
    return `${window.location.protocol}//${window.location.host}/api`
  }
  // Development: Use localhost Django server (RECOMMENDED for daily work)
  return 'http://localhost:8000/api'
}

const API_BASE_URL = getAPIBaseURL()

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout for email operations
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Helper function to get CSRF token from cookie
function getCsrfToken() {
  const name = 'csrftoken='
  const decodedCookie = decodeURIComponent(document.cookie)
  const ca = decodedCookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') {
      c = c.substring(1)
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length)
    }
  }
  return null
}

// Fetch CSRF token once on app initialization
let csrfTokenPromise = null
async function ensureCsrfToken() {
  if (!csrfTokenPromise) {
    console.log('🔐 Fetching CSRF token...')
    csrfTokenPromise = axios.get(`${API_BASE_URL}/csrf-token/`, {
      withCredentials: true
    }).then(response => {
      console.log('✅ CSRF token endpoint response:', response.data)
      const token = getCsrfToken()
      console.log('🔑 CSRF token from cookie:', token)
      console.log('🍪 All cookies:', document.cookie)
      return response
    }).catch(error => {
      console.error('❌ Failed to fetch CSRF token:', error)
      csrfTokenPromise = null // Reset on error so it can retry
      throw error
    })
  }
  return csrfTokenPromise
}

// Initialize CSRF token immediately
ensureCsrfToken()

// Add request interceptor for CSRF token
api.interceptors.request.use(
  (config) => {
    // Get CSRF token from cookie
    const csrfToken = getCsrfToken()
    
    // Add CSRF token to headers for non-GET requests
    if (csrfToken && config.method !== 'get') {
      config.headers['X-CSRFToken'] = csrfToken
      console.log(`🔒 Adding CSRF token to ${config.method.toUpperCase()} ${config.url}`)
    } else if (!csrfToken && config.method !== 'get') {
      console.warn(`⚠️  No CSRF token available for ${config.method.toUpperCase()} ${config.url}`)
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to retry on CSRF failure
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // If CSRF error and not already retried
    if (error.response?.status === 403 && 
        error.response?.data?.detail?.includes('CSRF') &&
        !originalRequest._retry) {
      originalRequest._retry = true
      
      // Reset and fetch new CSRF token
      csrfTokenPromise = null
      await ensureCsrfToken()
      
      // Wait a bit for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Get the new token and add to request
      const newCsrfToken = getCsrfToken()
      if (newCsrfToken) {
        originalRequest.headers['X-CSRFToken'] = newCsrfToken
      }
      
      // Retry the request
      return api(originalRequest)
    }
    
    return Promise.reject(error)
  }
)

// API functions
export const taskAPI = {
  // Get all tasks
  getTasks: async () => {
    const response = await api.get('/tasks/')
    return response.data
  },

  // Create new task
  createTask: async (taskData) => {
    try {
      // Map frontend-friendly fields to backend expectations
      const payload = { ...taskData }

      // Remove fields not accepted by the backend serializer
      delete payload.id
      delete payload.start_time
      delete payload.end_time
      delete payload.estimated_duration
      delete payload.team_id

      // Omit empty date fields to avoid validation issues
      if (payload.due_date === '' || payload.due_date === undefined || payload.due_date === null) {
        delete payload.due_date
      }
      if (payload.due_time === '' || payload.due_time === undefined || payload.due_time === null) {
        delete payload.due_time
      }
      if (typeof payload.project === 'string') {
        if (payload.project.trim().length > 0) {
          payload.project_name = payload.project
        }
        delete payload.project
      }
      const response = await api.post('/tasks/', payload)
      return response.data
    } catch (error) {
      // Surface server validation details
      const details = error?.response?.data
      console.error('Task create validation error:', details)
      throw error
    }
  },

  // Update task (including completion status)
  updateTask: async (taskId, taskData) => {
    const payload = { ...taskData }
    if (typeof payload.project === 'string') {
      if (payload.project.trim().length > 0) {
        payload.project_name = payload.project
      }
      delete payload.project
    }
    const response = await api.put(`/tasks/${taskId}/`, payload)
    return response.data
  },

  // Toggle task completion
  toggleTask: async (taskId) => {
    const response = await api.patch(`/tasks/${taskId}/toggle/`)
    return response.data
  },

  // Alternative toggle method using update
  updateTaskCompletion: async (taskId, completed) => {
    const response = await api.patch(`/tasks/${taskId}/`, { is_completed: completed })
    return response.data
  },

  // Delete task
  deleteTask: async (taskId) => {
    await api.delete(`/tasks/${taskId}/`)
  },

  // Create sub-task
  createSubtask: async (parentTaskId, subtaskData) => {
    const response = await api.post(`/tasks/${parentTaskId}/create_subtask/`, subtaskData)
    return response.data
  },

  // Get sub-tasks for a task
  getSubtasks: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}/subtasks/`)
    return response.data
  },

  // Toggle sub-task completion
  toggleSubtask: async (subtaskId) => {
    const response = await api.post(`/tasks/${subtaskId}/toggle_complete/`)
    return response.data
  }
}

export const projectAPI = {
  // Get all projects
  getProjects: async () => {
    const response = await api.get('/projects/')
    return response.data
  },

  // Create new project
  createProject: async (projectData) => {
    const response = await api.post('/projects/', projectData)
    return response.data
  },

  // Update project
  updateProject: async (projectId, projectData) => {
    const response = await api.put(`/projects/${projectId}/`, projectData)
    return response.data
  },

  // Delete project
  deleteProject: async (projectId) => {
    await api.delete(`/projects/${projectId}/`)
  },

  // Share project
  shareProject: async (projectId, friendIds) => {
    const response = await api.post(`/projects/${projectId}/share/`, { 
      friend_ids: friendIds 
    })
    return response.data
  },

  // Leave project
  leaveProject: async (projectId) => {
    const response = await api.post(`/projects/${projectId}/leave/`)
    return response.data
  }
}

export const teamAPI = {
  // Get all teams
  getTeams: async () => {
    const response = await api.get('/teams/')
    return response.data
  },

  // Create new team
  createTeam: async (teamData) => {
    const response = await api.post('/teams/', teamData)
    return response.data
  },

  // Update team
  updateTeam: async (teamId, teamData) => {
    const response = await api.put(`/teams/${teamId}/`, teamData)
    return response.data
  },

  // Delete team
  deleteTeam: async (teamId) => {
    await api.delete(`/teams/${teamId}/`)
  },

  // Add team member
  addTeamMember: async (teamId, email) => {
    const response = await api.post(`/teams/${teamId}/add_member/`, { email })
    return response.data
  },

  // Remove team member
  removeTeamMember: async (teamId, userId) => {
    const response = await api.post(`/teams/${teamId}/remove_member/`, { user_id: userId })
    return response.data
  },

  // Get team projects
  getTeamProjects: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/projects/`)
    return response.data
  }
}

export const friendAPI = {
  // Get all friends (accepted)
  getFriends: async () => {
    const response = await api.get('/friends/list_friends/')
    return response.data
  },

  // Get all friend requests and friendships
  getAllFriendships: async () => {
    const response = await api.get('/friends/')
    return response.data
  },

  // Send friend request
  sendRequest: async (email) => {
    const response = await api.post('/friends/send_request/', { email })
    return response.data
  },

  // Accept friend request
  acceptRequest: async (friendshipId) => {
    const response = await api.post(`/friends/${friendshipId}/accept/`)
    return response.data
  },

  // Decline friend request
  declineRequest: async (friendshipId) => {
    const response = await api.post(`/friends/${friendshipId}/decline/`)
    return response.data
  },

  // Get pending friend requests
  getPendingRequests: async () => {
    const response = await api.get('/friends/pending_requests/')
    return response.data
  },

  // Get sent friend requests
  getSentRequests: async () => {
    const response = await api.get('/friends/sent_requests/')
    return response.data
  },

  // Delete friendship
  deleteFriend: async (friendshipId) => {
    await api.delete(`/friends/${friendshipId}/`)
  },

  // Debug: Get all friendships for current user
  debugFriendships: async () => {
    const response = await api.get('/friends/debug_friendships/')
    return response.data
  },

  // Debug: Clear all pending requests
  clearPending: async () => {
    const response = await api.post('/friends/clear_pending/')
    return response.data
  }
}

export const userAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/users/profile/')
    return response.data
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile/', profileData)
    return response.data
  }
}

export const notificationAPI = {
  // Get all notifications
  getNotifications: async () => {
    const response = await api.get('/notifications/')
    return response.data
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread_count/')
    return response.data
  },

  // Mark as read
  markRead: async (notificationId) => {
    const response = await api.post(`/notifications/${notificationId}/mark_read/`)
    return response.data
  },

  // Mark all as read
  markAllRead: async () => {
    const response = await api.post('/notifications/mark_all_read/')
    return response.data
  },

  // Accept share
  acceptShare: async (notificationId) => {
    const response = await api.post(`/notifications/${notificationId}/accept_share/`)
    return response.data
  },

  // Decline share
  declineShare: async (notificationId) => {
    const response = await api.post(`/notifications/${notificationId}/decline_share/`)
    return response.data
  }
}

export default api
