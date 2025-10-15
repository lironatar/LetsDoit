import { useState, useRef, useEffect } from 'react'
import { FlagIcon } from '@heroicons/react/24/solid'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

function PrioritySelector({ value = 4, onChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Priority config: 1 = highest (red), 4 = lowest (white with border)
  const priorities = [
    { value: 1, label: 'עדיפות 1', color: '#d1453b', hasBorder: false },
    { value: 2, label: 'עדיפות 2', color: '#eb8909', hasBorder: false },
    { value: 3, label: 'עדיפות 3', color: '#246fe0', hasBorder: false },
    { value: 4, label: 'עדיפות 4', color: '#ffffff', hasBorder: true }
  ]

  const selectedPriority = priorities.find(p => p.value === value) || priorities[3]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (priorityValue) => {
    onChange(priorityValue)
    setIsOpen(false)
  }

  const handleReset = () => {
    onChange(4)
  }

  return (
    <div className={`relative inline-flex ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 hover:bg-[#F3F3F3] rounded-md transition-colors hebrew-text border border-gray-200 ${
          value !== 4 ? 'pl-7 pr-2' : 'px-2'
        }`}
        style={{ minWidth: '80px', height: '28px' }}
      >
        {/* Flag first (right side) */}
        <FlagIcon 
          className="w-4 h-4 transform scale-x-[-1]" 
          style={{ 
            color: selectedPriority.color,
            stroke: selectedPriority.hasBorder ? '#000000' : 'none',
            strokeWidth: selectedPriority.hasBorder ? 1.5 : 0
          }}
        />
        
        {/* Text second (middle) */}
        <span className="hebrew-text" style={{ color: '#202020', fontSize: '13px' }}>
          {value === 4 ? 'עדיפות' : `ע${value}`}
        </span>
      </button>

      {/* Reset X control on the LEFT side (appears on left in RTL) */}
      {value !== 4 && (
        <button
          type="button"
          onClick={handleReset}
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"
          aria-label="נקה עדיפות"
        >
          <XMarkIcon className="w-3 h-3 text-gray-500" />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-1">
            {priorities.map((priority) => (
              <button
                key={priority.value}
                type="button"
                onClick={() => handleSelect(priority.value)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[#F3F3F3] rounded-md transition-colors hebrew-text ${
                  value === priority.value ? 'bg-[#F3F3F3]' : ''
                }`}
              >
                <FlagIcon 
                  className="w-4 h-4 transform scale-x-[-1]" 
                  style={{ 
                    color: priority.color,
                    stroke: priority.hasBorder ? '#000000' : 'none',
                    strokeWidth: priority.hasBorder ? 1.5 : 0
                  }}
                />
                <span className="flex-1 text-right" style={{ color: '#202020', fontSize: '13px' }}>
                  {priority.label}
                </span>
                {/* Checkmark for selected priority in dropdown */}
                {value === priority.value && (
                  <CheckIcon className="w-3 h-3 text-red-500" strokeWidth={2.5} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PrioritySelector
