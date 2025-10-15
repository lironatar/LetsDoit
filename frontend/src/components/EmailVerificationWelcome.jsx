import React, { useState } from 'react'

const EmailVerificationWelcome = ({ userEmail, onResendVerification }) => {
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const handleResendVerification = async () => {
    setIsResending(true)
    setResendMessage('')
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/resend-verification/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: userEmail
        })
      })

      const data = await response.json()

      if (data.success) {
        setResendMessage('אימייל אימות חדש נשלח בהצלחה!')
      } else {
        setResendMessage(data.message || 'שגיאה בשליחת האימייל')
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      setResendMessage('שגיאה בשליחת האימייל. אנא נסה שוב.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Logo/Icon */}
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 001.78 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Welcome Text */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3 hebrew-text">
          ברוך הבא ל-TodoFast!
        </h1>

        <p className="text-lg text-gray-600 mb-2 hebrew-text">
          שלום {userEmail.split('@')[0]}! 👋
        </p>

        <p className="text-gray-600 mb-6 hebrew-text leading-relaxed">
          כדי להתחיל להשתמש במערכת, אנא אמת את כתובת האימייל שלך.
          שלחנו לך אימייל עם קישור אימות.
        </p>

        {/* Email Display */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500 mb-1 hebrew-text">אימייל נשלח אל:</p>
          <p className="text-lg font-medium text-gray-900" dir="ltr">{userEmail}</p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2 hebrew-text">מה עליך לעשות:</h3>
          <ol className="text-sm text-blue-800 text-right space-y-1 hebrew-text">
            <li>1. פתח את תיבת הדואר שלך</li>
            <li>2. חפש אימייל מ-TodoFast</li>
            <li>3. לחץ על קישור האימות</li>
            <li>4. חזור לכאן - הדף יתרענן אוטומטית</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleResendVerification}
            disabled={isResending}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium hebrew-text"
          >
            {isResending ? 'שולח...' : 'שלח שוב אימייל אימות'}
          </button>

          {resendMessage && (
            <div className={`p-3 rounded-lg text-sm hebrew-text ${
              resendMessage.includes('הצלחה') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {resendMessage}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 hebrew-text">
            לא מוצא את האימייל? בדוק בתיקיית הספאם או הזבל
          </p>
        </div>
      </div>
    </div>
  )
}

export default EmailVerificationWelcome
