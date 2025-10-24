import { useState, useEffect, useRef } from 'react'
import { jwtDecode } from 'jwt-decode'
import { getFullURL, getFetchOptions } from '../utils/apiUrl'

const GoogleLoginButton = ({ onGoogleLogin, disabled = false }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoaded, setGoogleLoaded] = useState(false)
  const googleButtonRef = useRef(null)

  useEffect(() => {
    // Load Google script when component mounts
    loadGoogleScript()
  }, [])

  useEffect(() => {
    // Render Google Sign-In button when Google is loaded
    if (googleLoaded && googleButtonRef.current) {
      renderGoogleButton()
    }
  }, [googleLoaded])

  const renderGoogleButton = () => {
    if (!window.google || !googleButtonRef.current) return

    const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID
    console.log('🔑 Google Client ID:', clientId ? `${clientId.substring(0, 20)}...` : 'MISSING!')

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      })

      // Clear any existing content
      googleButtonRef.current.innerHTML = ''

      // Render the button directly in the div
      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          locale: 'he',
          shape: 'rectangular'
        }
      )
    } catch (error) {
      console.error('Error rendering Google button:', error)
      renderFallbackButton()
    }
  }

  const renderFallbackButton = () => {
    if (!googleButtonRef.current) return
    
    googleButtonRef.current.innerHTML = `
      <button type="button" onclick="handleManualGoogleLogin()" 
              style="width: 100%; height: 48px; border: 1px solid #dadce0; border-radius: 8px; background: white; color: #3c4043; font-family: 'Google Sans', Roboto, Arial, sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        התחבר עם Google
      </button>
    `
    
    // Add global function for manual login
    window.handleManualGoogleLogin = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.prompt()
      }
    }
  }

  const handleCredentialResponse = async (response) => {
    try {
      console.log('✅ Google login successful')
      
      // Decode the JWT token to get user info
      const decoded = jwtDecode(response.credential)
      console.log('📋 Decoded user info:', {
        email: decoded.email,
        name: decoded.name,
        given_name: decoded.given_name,
        family_name: decoded.family_name,
        picture: decoded.picture
      })
      
      // Send the credential to your backend
      console.log('📤 Sending credential to backend...')
      const backendResponse = await fetch(getFullURL('/auth/google-login/'), {
        ...getFetchOptions('POST', {
          credential: response.credential,
          email: decoded.email,
          name: decoded.name,
          given_name: decoded.given_name || decoded.name?.split(' ')[0] || '',
          family_name: decoded.family_name || decoded.name?.split(' ').slice(1).join(' ') || '',
          picture: decoded.picture
        })
      })

      console.log('📥 Backend response status:', backendResponse.status)
      const data = await backendResponse.json()
      console.log('📥 Backend response data:', data)

      if (data.success) {
        console.log('✅ Google login successful!')
        onGoogleLogin(data)
      } else {
        console.error('❌ Google login failed:', data.message)
        alert(`Google login failed: ${data.message}`)
      }
    } catch (error) {
      console.error('❌ Error processing Google login:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadGoogleScript = () => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.accounts) {
        setGoogleLoaded(true)
        resolve()
        return
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      if (existingScript) {
        existingScript.onload = () => {
          setGoogleLoaded(true)
          resolve()
        }
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        setGoogleLoaded(true)
        resolve()
      }
      script.onerror = (error) => {
        console.error('Failed to load Google script:', error)
        reject(error)
      }
      document.head.appendChild(script)
    })
  }

  return (
    <div className="w-full">
      {!googleLoaded ? (
        <div className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-gray-700">טוען...</span>
        </div>
      ) : (
        <div 
          ref={googleButtonRef}
          className="w-full"
          style={{ 
            minHeight: '48px',
            opacity: disabled ? 0.5 : 1,
            pointerEvents: disabled ? 'none' : 'auto'
          }}
        />
      )}
    </div>
  )
}

export default GoogleLoginButton
