export const getAPIBaseURL = () => {
  // Check if we have an environment variable for the API URL
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // Development: Use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000/api'
  }
  
  // Production: Construct from current domain (same-origin requests)
  return `${window.location.origin}/api`
}

export const getFullURL = (endpoint) => {
  const base = getAPIBaseURL()
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${base}${path}`
}

export const getFetchOptions = (method = 'GET', body = null, customHeaders = {}) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders
    },
    credentials: 'include' // Include cookies for CSRF protection
  }
  
  if (body) {
    options.body = JSON.stringify(body)
  }
  
  return options
}
