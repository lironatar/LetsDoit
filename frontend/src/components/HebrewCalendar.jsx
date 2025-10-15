import { useState, useEffect } from 'react'
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'

function HebrewCalendar({ selectedDate, onSelectDate, onClose }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Hebrew month names
  const hebrewMonths = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ]
  
  // Hebrew day names (starting from Sunday)
  const hebrewDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
  
  const today = new Date()
  const selectedDateObj = selectedDate ? new Date(selectedDate) : null

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(new Date(selectedDate))
    }
  }, [selectedDate])

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatDateString = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const isToday = (year, month, day) => {
    return today.getFullYear() === year && 
           today.getMonth() === month && 
           today.getDate() === day
  }

  const isSelected = (year, month, day) => {
    if (!selectedDateObj) return false
    return selectedDateObj.getFullYear() === year && 
           selectedDateObj.getMonth() === month && 
           selectedDateObj.getDate() === day
  }

  const isPast = (year, month, day) => {
    const dateToCheck = new Date(year, month, day)
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return dateToCheck < todayMidnight
  }

  const handleDateClick = (year, month, day) => {
    const dateString = formatDateString(year, month, day)
    onSelectDate(dateString)
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleQuickSelect = (dateString) => {
    onSelectDate(dateString)
  }

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    
    const days = []
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isCurrentDay = isToday(year, month, day)
      const isSelectedDay = isSelected(year, month, day)
      const isPastDay = isPast(year, month, day)
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(year, month, day)}
          className={`w-8 h-8 text-base rounded-md transition-colors hebrew-text ${
            isSelectedDay
              ? 'bg-red-600 text-white'
              : isCurrentDay
                ? 'bg-green-100 text-green-800 font-medium'
                : isPastDay
                  ? 'text-gray-400 hover:bg-gray-100'
                  : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {day}
        </button>
      )
    }
    
    return days
  }

  // Quick date options
  const getQuickDateOptions = () => {
    const todayStr = today.toISOString().split('T')[0]
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    const nextWeekStr = nextWeek.toISOString().split('T')[0]

    return [
      { label: 'היום', value: todayStr, color: 'text-green-700 bg-green-50 hover:bg-green-100' },
      { label: 'מחר', value: tomorrowStr, color: 'text-orange-700 bg-orange-50 hover:bg-orange-100' },
      { label: 'שבוע הבא', value: nextWeekStr, color: 'text-blue-700 bg-blue-50 hover:bg-blue-100' },
    ]
  }

  return (
    <div className="w-72 p-3" dir="rtl">
      {/* Quick Options */}
      <div className="mb-3">
        <div className="grid grid-cols-3 gap-1.5">
          {getQuickDateOptions().map((option) => (
            <button
              key={option.label}
              onClick={() => handleQuickSelect(option.value)}
              className={`px-2 py-1.5 text-sm rounded-md transition-colors hebrew-text font-medium ${option.color}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => handleQuickSelect('')}
          className="w-full mt-1.5 px-2 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors hebrew-text"
        >
          ללא תאריך
        </button>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
        </button>
        
        <h3 className="text-base font-medium text-gray-900 hebrew-text">
          {hebrewMonths[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronRightIcon className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {hebrewDays.map((day) => (
          <div key={day} className="w-8 h-8 flex items-center justify-center text-sm text-gray-500 font-medium hebrew-text">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {renderCalendarDays()}
      </div>

      {/* Today indicator */}
      <div className="text-center">
        <button
          onClick={() => handleQuickSelect(today.toISOString().split('T')[0])}
          className="text-sm text-blue-600 hover:text-blue-800 hebrew-text font-medium"
        >
          חזור להיום
        </button>
      </div>
    </div>
  )
}

export default HebrewCalendar
