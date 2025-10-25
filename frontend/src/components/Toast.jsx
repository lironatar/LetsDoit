import React, { useState, useEffect } from 'react'
import { XMarkIcon, CheckCircleIcon, PlusIcon } from '@heroicons/react/24/outline'

function Toast({ 
  id, 
  type, 
  message, 
  onClose, 
  onUndo, 
  duration = 4000,
  position = 'bottom-right'
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger entrance animation with a slight delay for better effect
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Auto-dismiss after duration
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose(id)
    }, 500) // Match animation duration
  }

  const handleUndo = () => {
    if (onUndo) {
      onUndo()
    }
    handleClose()
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />
      case 'task-created':
        return <PlusIcon className="w-5 h-5 text-blue-400" />
      case 'task-completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />
      default:
        return <CheckCircleIcon className="w-5 h-5 text-gray-400" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-900/90'
      case 'task-created':
        return 'bg-blue-900/90'
      case 'task-completed':
        return 'bg-green-900/90'
      default:
        return 'bg-gray-900/90'
    }
  }

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-700/50'
      case 'task-created':
        return 'border-blue-700/50'
      case 'task-completed':
        return 'border-green-700/50'
      default:
        return 'border-gray-700/50'
    }
  }

  return (
    <div
      className={`
        fixed z-50 max-w-sm w-full mx-4 mb-4
        ${position === 'bottom-right' ? 'bottom-4 right-4' : ''}
        ${position === 'bottom-left' ? 'bottom-4 left-4' : ''}
        ${position === 'top-right' ? 'top-4 right-4' : ''}
        ${position === 'top-left' ? 'top-4 left-4' : ''}
        transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        ${isVisible && !isLeaving 
          ? 'translate-y-0 opacity-100 scale-100' 
          : 'translate-y-12 opacity-0 scale-90'
        }
      `}
      dir="rtl"
    >
      <div
        className={`
          ${getBackgroundColor()}
          ${getBorderColor()}
          border backdrop-blur-sm
          rounded-xl shadow-2xl
          px-4 py-3
          flex items-center justify-between
          space-x-3 space-x-reverse
          transform transition-all duration-300
          ${isVisible && !isLeaving 
            ? 'shadow-2xl' 
            : 'shadow-none'
          }
        `}
        style={{
          boxShadow: isVisible && !isLeaving 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
            : 'none'
        }}
      >
        {/* Left side - Icon and message */}
        <div className={`flex items-center space-x-3 space-x-reverse flex-1 min-w-0 transition-all duration-300 delay-100 ${
          isVisible && !isLeaving ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}>
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-base font-medium hebrew-text truncate">
              {message}
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className={`flex items-center space-x-2 space-x-reverse flex-shrink-0 transition-all duration-300 delay-200 ${
          isVisible && !isLeaving ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}>
          {/* Undo button (if available) */}
          {onUndo && (
            <button
              onClick={handleUndo}
              className="text-pink-300 hover:text-pink-200 text-base font-medium transition-colors hebrew-text"
            >
              בטל
            </button>
          )}
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Toast
