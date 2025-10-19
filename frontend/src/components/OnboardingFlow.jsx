import React, { useState, useRef } from 'react'
import { getFullURL, getFetchOptions } from '../utils/apiUrl'

const OnboardingFlow = ({ userEmail, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: userEmail.split('@')[0], // Default name from email prefix
    avatar: null,
    taskMethod: '',
    integrations: []
  })
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleSkip = async () => {
    console.log('=== SKIP BUTTON CLICKED ===')
    console.log('Skip button clicked for user:', userEmail)
    console.log('Form data:', formData)
    try {
      // Skip onboarding by marking it as completed without data
      // Get CSRF token from cookie if it exists
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1]
      
      const headers = {
        'Content-Type': 'application/json'
      }
      
      // Add CSRF token if available
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken
        console.log('Adding CSRF token to request:', csrfToken.substring(0, 10) + '...')
      } else {
        console.log('No CSRF token found in cookies')
      }
      
      const response = await fetch(getFullURL('/auth/complete-onboarding/'), {
        method: 'POST',
        headers: headers,
        credentials: 'include', // Include cookies for session authentication
        body: JSON.stringify({
          email: userEmail,
          name: formData.name || userEmail.split('@')[0],
          task_method: 'skipped',
          onboarding_completed: true,
          onboarding_skipped: true
        })
      })

      console.log('Skip API response:', response.ok)
      console.log('Skip API status:', response.status)
      
      // Get the response text to see what the error is
      const responseText = await response.text()
      console.log('Skip API response body:', responseText)
      
      if (response.ok) {
        console.log('Backend skip successful, calling onComplete with skipped data')
        onComplete({ ...formData, skipped: true })
      } else {
        console.log('Backend skip failed, response not ok')
        throw new Error('Failed to skip onboarding')
      }
    } catch (error) {
      console.error('Skip onboarding error:', error)
      // Still complete onboarding on frontend even if backend fails
      console.log('Backend failed, calling onComplete anyway with skipped data')
      onComplete({ ...formData, skipped: true })
    }
    console.log('=== END SKIP BUTTON HANDLER ===')
  }

  const totalSteps = 4

  const taskMethods = [
    {
      id: 'pen_paper',
      title: 'עט ונייר',
      description: 'רשימות ומחברות פיזיות',
      icon: '📝'
    },
    {
      id: 'notes_app',
      title: 'אפליקציות פתקים',
      description: 'Notes, Keep, או אפליקציות דומות',
      icon: '📱'
    },
    {
      id: 'excel_sheets',
      title: 'גיליונות אלקטרוניים',
      description: 'Excel, Google Sheets וכדומה',
      icon: '📊'
    },
    {
      id: 'other_todo',
      title: 'אפליקציות משימות אחרות',
      description: 'Todoist, Any.do, Trello וכדומה',
      icon: '✅'
    }
  ]

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('אנא בחר קובץ תמונה בלבד')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('גודל הקובץ חייב להיות קטן מ-5MB')
      return
    }

    setIsUploading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('avatar', file)

      const response = await fetch(getFullURL('/users/upload_avatar/'), {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, avatar: data.avatar_url }))
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      alert('שגיאה בהעלאת התמונה. אנא נסה שוב.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleComplete = async () => {
    console.log('Regular completion clicked for user:', userEmail)
    try {
      // Get CSRF token from cookie if it exists
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1]
      
      const headers = {
        'Content-Type': 'application/json'
      }
      
      // Add CSRF token if available
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken
        console.log('Adding CSRF token to complete request')
      }
      
      // Update user profile with onboarding data
      const response = await fetch(getFullURL('/auth/complete-onboarding/'), {
        method: 'POST',
        headers: headers,
        credentials: 'include', // Include cookies for session authentication
        body: JSON.stringify({
          email: userEmail,
          name: formData.name,
          task_method: formData.taskMethod,
          onboarding_completed: true,
          onboarding_skipped: false
        })
      })

      console.log('Regular completion API response:', response.ok)
      
      if (response.ok) {
        console.log('Calling onComplete with regular data')
        onComplete(formData)
      } else {
        const responseText = await response.text()
        console.log('Complete API response body:', responseText)
        throw new Error('Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Onboarding completion error:', error)
      // For now, still complete the onboarding on the frontend
      console.log('Backend failed, calling onComplete anyway')
      onComplete(formData)
    }
  }

  const renderProgressBar = () => (
    <div className="flex items-center justify-center mb-8" dir="ltr">
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4].map((step) => (
          <React.Fragment key={step}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              {step}
            </div>
            {step < 4 && (
              <div className={`w-12 h-1 ${
                step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="ml-4 text-sm text-gray-500 hebrew-text">
        שלב {currentStep} מתוך {totalSteps}
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="text-center">
      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-4 hebrew-text">
        ברוך הבא ל-Todoist!
      </h1>

      <p className="text-lg text-gray-600 mb-8 hebrew-text">
        אנחנו נרגשים לעזור לך להחזיר את השקט לעבודה ולחיים שלך.
      </p>

      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4 hebrew-text">Todoist יכול לעזור לך...</h3>
        
        <div className="space-y-4 text-right">
          <div className="flex items-center space-x-3 space-x-reverse">
            <span className="text-2xl">🗂️</span>
            <span className="text-gray-700 hebrew-text">לארגן את הכאוס היומיומי</span>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            <span className="text-2xl">🎯</span>
            <span className="text-gray-700 hebrew-text">להתמקד בדברים הנכונים</span>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            <span className="text-2xl">🏆</span>
            <span className="text-gray-700 hebrew-text">להשיג מטרות ולסיים פרויקטים</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleNext}
          className="w-full bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 transition-colors font-medium text-lg hebrew-text"
        >
          בואו נתחיל!
        </button>
        
        <button
          onClick={handleSkip}
          className="w-full text-gray-500 hover:text-gray-700 transition-colors font-medium hebrew-text"
        >
          דלג על ההגדרה
        </button>
        
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 hebrew-text">
        איך קוראים לך?
      </h2>

      <div className="space-y-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-right hebrew-text">
            השם שלך
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right hebrew-text"
            placeholder="הזן את השם שלך"
            dir="rtl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-right hebrew-text">
            העלה תמונת פרופיל
          </label>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {formData.avatar ? (
                <img 
                  src={formData.avatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl text-gray-500">
                  {formData.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm hebrew-text disabled:opacity-50"
            >
              {isUploading ? 'מעלה...' : 'בחר תמונה'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex space-x-3 space-x-reverse">
          <button
            onClick={handleBack}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium hebrew-text"
          >
            חזור
          </button>
          <button
            onClick={handleNext}
            disabled={!formData.name.trim()}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium hebrew-text"
          >
            המשך
          </button>
        </div>
        
        <button
          onClick={handleSkip}
          className="w-full text-gray-500 hover:text-gray-700 transition-colors font-medium hebrew-text"
        >
          דלג על ההגדרה
        </button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 hebrew-text">
        איך כתבת משימות עד היום?
      </h2>

      <div className="grid grid-cols-1 gap-4 mb-8">
        {taskMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => setFormData(prev => ({ ...prev, taskMethod: method.id }))}
            className={`p-4 border rounded-lg text-right transition-colors ${
              formData.taskMethod === method.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center space-x-3 space-x-reverse">
              <span className="text-2xl">{method.icon}</span>
              <div>
                <div className="font-medium hebrew-text">{method.title}</div>
                <div className="text-sm text-gray-500 hebrew-text">{method.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex space-x-3 space-x-reverse">
          <button
            onClick={handleBack}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium hebrew-text"
          >
            חזור
          </button>
          <button
            onClick={handleNext}
            disabled={!formData.taskMethod}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium hebrew-text"
          >
            המשך
          </button>
        </div>
        
        <button
          onClick={handleSkip}
          className="w-full text-gray-500 hover:text-gray-700 transition-colors font-medium hebrew-text"
        >
          דלג על ההגדרה
        </button>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 hebrew-text">
        התחבר לחשבונות שלך
      </h2>

      <p className="text-gray-600 mb-8 hebrew-text">
        חבר את Todoist לשירותים שלך כדי לסנכרן משימות ואירועים
      </p>

      <div className="space-y-4 mb-8">
        <button
          disabled
          className="w-full flex items-center justify-center space-x-3 space-x-reverse p-4 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
        >
          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="hebrew-text text-gray-500">התחבר ל-Gmail (בקרוב)</span>
        </button>

        <button
          disabled
          className="w-full flex items-center justify-center space-x-3 space-x-reverse p-4 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
        >
          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24">
            <path fill="currentColor" d="M23.5 12c0-6.07-4.93-11-11-11s-11 4.93-11 11c0 5.5 4.04 10.06 9.31 10.88v-7.69h-2.81V12h2.81V9.75c0-2.77 1.65-4.31 4.18-4.31 1.21 0 2.48.22 2.48.22v2.73h-1.4c-1.38 0-1.8.86-1.8 1.74V12h3.06l-.49 3.19h-2.57v7.69C19.46 22.06 23.5 17.5 23.5 12z"/>
          </svg>
          <span className="hebrew-text text-gray-500">התחבר ל-Outlook (בקרוב)</span>
        </button>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-8">
        <p className="text-sm text-blue-800 hebrew-text">
          💡 תוכל להוסיף חיבורים נוספים מהגדרות החשבון בכל עת
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex space-x-3 space-x-reverse">
          <button
            onClick={handleBack}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium hebrew-text"
          >
            חזור
          </button>
          <button
            onClick={handleNext}
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium hebrew-text"
          >
            סיום
          </button>
        </div>
        
        <button
          onClick={handleSkip}
          className="w-full text-gray-500 hover:text-gray-700 transition-colors font-medium hebrew-text"
        >
          דלג על ההגדרה
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {renderProgressBar()}
        
        <div className="min-h-[400px]">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>
      </div>
    </div>
  )
}

export default OnboardingFlow
