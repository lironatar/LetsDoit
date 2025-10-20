import React, { useState, useEffect } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { getFullURL, getFetchOptions } from '../utils/apiUrl'
import PrivacyPolicy from './PrivacyPolicy'

const RegistrationForm = ({ onRegisterSuccess, onSwitchToLogin, isLoading, setIsLoading }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [invitationToken, setInvitationToken] = useState('')
  const [invitationInfo, setInvitationInfo] = useState(null)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Check for invitation token in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const inviteToken = urlParams.get('invite')
    
    if (inviteToken) {
      console.log('🎉 Invitation token found:', inviteToken)
      setInvitationToken(inviteToken)
      loadInvitationInfo(inviteToken)
    }
  }, [])

  const loadInvitationInfo = async (token) => {
    try {
      const response = await fetch(getFullURL(`/invitations/info/?invite=${token}`))
      if (response.ok) {
        const data = await response.json()
        setInvitationInfo(data)
        console.log('📧 Invitation info loaded:', data)
      }
    } catch (error) {
      console.error('Failed to load invitation info:', error)
    }
  }

  const validatePassword = (password) => {
    const errors = []
    if (password.length < 8) {
      errors.push('הסיסמה חייבת להכיל לפחות 8 תווים')
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      errors.push('הסיסמה חייבת להכיל אותיות גדולות וקטנות באנגלית')
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('הסיסמה חייבת להכיל לפחות מספר אחד')
    }
    return errors
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Reset errors
    setErrors({})
    
    // Client-side validation
    const newErrors = {}
    
    if (!formData.email.trim()) {
      newErrors.email = 'אנא הזן כתובת אימייל'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'כתובת אימייל לא תקינה'
    }
    
    if (!formData.password) {
      newErrors.password = 'אנא הזן סיסמה'
    } else {
      const passwordErrors = validatePassword(formData.password)
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsRegistering(true)
    setIsLoading(true)

    try {
      const response = await fetch(getFullURL('/auth/register/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          invite_token: invitationToken || null
        })
      })

      const data = await response.json()

      if (data.success) {
        // Registration successful
        console.log('Registration successful:', data.message)
        
        // Show special message if friend request was created
        let successMessage = data.message
        if (data.friend_request_created) {
          successMessage += ' בקשת החברות נוצרה בהצלחה!'
          console.log('🎉 Friend request created during registration!')
        }
        
        onRegisterSuccess(data.user, successMessage, data.email_sent)
      } else {
        // Handle registration errors
        if (data.errors) {
          // Backend validation errors
          const backendErrors = {}
          if (data.errors.email) {
            backendErrors.email = Array.isArray(data.errors.email) ? data.errors.email[0] : data.errors.email
          }
          if (data.errors.password) {
            backendErrors.password = Array.isArray(data.errors.password) ? data.errors.password : [data.errors.password]
          }
          setErrors(backendErrors)
        } else {
          // General error message
          setErrors({ general: data.message || 'שגיאה בתהליך הרשמה' })
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({ general: 'שגיאת רשת. אנא בדוק את החיבור לאינטרנט ונסה שוב' })
    } finally {
      setIsRegistering(false)
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 hebrew-text">
            הרשמה למערכת
          </h2>
          <p className="mt-2 text-gray-600 hebrew-text">
            צור חשבון חדש כדי להתחיל לנהל את המשימות שלך
          </p>
        </div>

        {/* Invitation Banner */}
        {invitationInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🎉</span>
                </div>
              </div>
              <div className="mr-3">
                <h3 className="text-sm font-medium text-blue-900 hebrew-text">
                  הזמנה מ-{invitationInfo.inviter_name}
                </h3>
                <p className="text-sm text-blue-700 hebrew-text">
                  {invitationInfo.inviter_name} רוצה להוסיף אותך כחבר ב-ToDoFast!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm hebrew-text">{errors.general}</p>
          </div>
        )}

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 hebrew-text mb-2">
            כתובת אימייל
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
              errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="הכנס כתובת אימייל"
            disabled={isRegistering}
            dir="ltr"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 hebrew-text">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 hebrew-text mb-2">
            סיסמה
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12 ${
                errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="הכנס סיסמה"
              disabled={isRegistering}
              dir="ltr"
            />
            <button
              type="button"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isRegistering}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <div className="mt-1">
              {Array.isArray(errors.password) ? (
                errors.password.map((error, index) => (
                  <p key={index} className="text-sm text-red-600 hebrew-text">{error}</p>
                ))
              ) : (
                <p className="text-sm text-red-600 hebrew-text">{errors.password}</p>
              )}
            </div>
          )}
          
          {/* Password Requirements */}
          <div className="mt-2 text-xs text-gray-500 hebrew-text">
            <p>הסיסמה חייבת להכיל:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>לפחות 8 תווים</li>
              <li>אות גדולה ואות קטנה באנגלית</li>
              <li>לפחות מספר אחד</li>
            </ul>
          </div>
        </div>

        {/* Privacy Policy Link */}
        <div className="text-center text-xs text-gray-600 hebrew-text">
          <p>
            על ידי ההירשמות, אתה מסכים ל
            <button
              type="button"
              onClick={() => setShowPrivacyPolicy(true)}
              className="text-blue-600 hover:text-blue-700 hover:underline mx-1 inline font-medium"
              disabled={isRegistering}
            >
              מדיניות הפרטיות שלנו
            </button>
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isRegistering}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium hebrew-text transition-colors ${
            isRegistering
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
          }`}
        >
          {isRegistering ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
              מתבצעת הרשמה...
            </div>
          ) : (
            'הירשם'
          )}
        </button>

        {/* Switch to Login */}
        <div className="text-center">
          <p className="text-gray-600 hebrew-text">
            יש לך כבר חשבון?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-red-600 hover:text-red-500 font-medium"
              disabled={isRegistering}
            >
              התחבר כאן
            </button>
          </p>
        </div>
      </form>

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <PrivacyPolicy
          onClose={() => setShowPrivacyPolicy(false)}
          initialLanguage="he"
        />
      )}
    </div>
  )
}

export default RegistrationForm
