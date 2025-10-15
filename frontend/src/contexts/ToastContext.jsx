import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    const newToast = {
      id,
      type: 'success',
      message: 'הודעה',
      duration: 4000,
      position: 'bottom-right',
      ...toast
    }
    
    setToasts(prev => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods for common toast types
  const showSuccess = useCallback((message, options = {}) => {
    return addToast({
      type: 'success',
      message,
      ...options
    })
  }, [addToast])

  const showTaskCreated = useCallback((taskTitle, options = {}) => {
    return addToast({
      type: 'task-created',
      message: `משימה "${taskTitle}" נוצרה בהצלחה`,
      duration: 3000,
      ...options
    })
  }, [addToast])

  const showTaskCompleted = useCallback((taskTitle, onUndo, options = {}) => {
    return addToast({
      type: 'task-completed',
      message: `משימה "${taskTitle}" הושלמה`,
      onUndo,
      duration: 5000, // Longer duration for undo option
      ...options
    })
  }, [addToast])

  const showError = useCallback((message, options = {}) => {
    return addToast({
      type: 'error',
      message,
      duration: 6000, // Longer duration for errors
      ...options
    })
  }, [addToast])

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showTaskCreated,
    showTaskCompleted,
    showError
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}
