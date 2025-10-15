import { useState, useEffect, useRef } from 'react'
import { Calendar } from 'react-multi-date-picker'
import { DateObject } from 'react-multi-date-picker'
import ClockIcon from './icons/ClockIcon'
import TodayIconGreen from './icons/TodayIconGreen'
import NoDateIcon from './icons/NoDateIcon'

// Hebrew locale configuration
const hebrew_locale = {
  name: 'hebrew',
  months: [
    ['ינואר', 'ינו'],
    ['פברואר', 'פבר'],
    ['מרץ', 'מרץ'],
    ['אפריל', 'אפר'],
    ['מאי', 'מאי'],
    ['יוני', 'יונ'],
    ['יולי', 'יול'],
    ['אוגוסט', 'אוג'],
    ['ספטמבר', 'ספט'],
    ['אוקטובר', 'אוק'],
    ['נובמבר', 'נוב'],
    ['דצמבר', 'דצמ']
  ],
  weekDays: [
    ['ראשון', 'א'],
    ['שני', 'ב'],
    ['שלישי', 'ג'],
    ['רביעי', 'ד'],
    ['חמישי', 'ה'],
    ['שישי', 'ו'],
    ['שבת', 'ש']
  ],
  digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  meridiems: [['AM', 'am'], ['PM', 'pm']]
}

function DatePickerDropdown({ 
  isOpen, 
  onClose, 
  selectedDates, 
  setSelectedDates, 
  selectedTime, 
  setSelectedTime,
  showTimePicker,
  setShowTimePicker,
  showTimeDropdown,
  setShowTimeDropdown,
  generateTimeOptions,
  getDefaultTime,
  duration,
  setDuration,
  timeZone,
  setTimeZone,
  repeatType,
  setRepeatType,
  showRepeatPicker,
  setShowRepeatPicker,
  position = 'bottom' // 'bottom' or 'top'
}) {
  const [calendarViewDate, setCalendarViewDate] = useState(new DateObject())
  const datePickerRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div 
      ref={datePickerRef}
      className={`absolute right-0 bg-white border border-gray-200 rounded-lg shadow-[0_2px_4px_0_rgba(0,0,0,0.1)] z-50 text-[13px] ${
        position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
      }`}
    >
      <div>
         {/* 1. Header */}
         <div className="border-b border-gray-100 pt-3 pr-2 pl-2 pb-3">
           <div className="font-medium hebrew-text" style={{ color: 'var(--color-calendar-date)' }}>
             {selectedDates.length > 0 
               ? (() => {
                   const date = selectedDates[0]
                   const currentYear = new Date().getFullYear()
                   
                   if (date?.format) {
                     const dateString = date.format()
                     
                     // Parse DD/MM/YYYY format correctly
                     const parts = dateString.split('/')
                     if (parts.length === 3) {
                       const day = parseInt(parts[0])
                       const month = parseInt(parts[1])
                       const year = parseInt(parts[2])
                       const dateObj = new Date(year, month - 1, day) // month is 0-indexed
                       const selectedYear = dateObj.getFullYear()
                       
                       // Check if it's today
                       const today = new Date()
                       const todayStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`
                       if (dateString === todayStr) {
                         return 'היום'
                       }
                       
                       // Check if it's tomorrow
                       const tomorrow = new Date()
                       tomorrow.setDate(tomorrow.getDate() + 1)
                       const tomorrowStr = `${String(tomorrow.getDate()).padStart(2,'0')}/${String(tomorrow.getMonth()+1).padStart(2,'0')}/${tomorrow.getFullYear()}`
                       if (dateString === tomorrowStr) {
                         return 'מחר'
                       }
                       
                       // Check if it's next week
                       const nextWeek = new Date()
                       nextWeek.setDate(nextWeek.getDate() + 7)
                       const nextWeekStr = `${String(nextWeek.getDate()).padStart(2,'0')}/${String(nextWeek.getMonth()+1).padStart(2,'0')}/${nextWeek.getFullYear()}`
                       if (dateString === nextWeekStr) {
                         return 'שבוע הבא'
                       }
                       
                       if (selectedYear === currentYear) {
                         return date.format('DD/MM')
                       } else {
                         return date.format('DD/MM/YYYY')
                       }
                     }
                     
                     // Fallback to original format if parsing fails
                     return date.format('DD/MM/YYYY')
                   } else if (typeof date === 'string') {
                     const parts = date.split('-')
                     if (parts.length >= 3) {
                       const selectedYear = parseInt(parts[0])
                       if (selectedYear === currentYear) {
                         return `${parts[2]}/${parts[1]}`
                       } else {
                         return `${parts[2]}/${parts[1]}/${parts[0]}`
                       }
                     }
                   }
                   return 'בחירת תאריך'
                 })()
               : 'בחירת תאריך'
             }
           </div>
         </div>

        {/* 2. Quick Date Selection Buttons */}
        <div className="border-b border-gray-100 pt-2 pr-2 pl-2 pb-2">
          <div className="space-y-0.5">
             {/* Today Button - only show if today is not selected */}
             {(() => {
               const d = new Date()
               const todayStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
               const isTodaySelected = selectedDates.length > 0 && selectedDates[0]?.format?.() === todayStr
               
               if (isTodaySelected) return null
               
               return (
                 <button
                   type="button"
                   onClick={() => {
                     // Create a proper date object that matches the expected format
                     const today = new Date()
                     const day = String(today.getDate()).padStart(2, '0')
                     const month = String(today.getMonth() + 1).padStart(2, '0')
                     const year = today.getFullYear()
                     
                     setSelectedDates([{ 
                       format: (formatStr) => {
                         if (formatStr === 'DD/MM') {
                           return `${day}/${month}`
                         }
                         return `${day}/${month}/${year}`
                       }
                     }])
                     onClose()
                   }}
                   className="w-full flex items-center gap-2 px-2 py-1 hover:bg-green-50 rounded-md transition-colors text-[13px]"
                 >
                    <TodayIconGreen size={20} />
                   <span className="flex-1 font-medium hebrew-text text-right text-[13px] text-green-600">היום</span>
               <span className="text-[13px]" style={{ color: '#808080' }}>
                 {(() => {
                   const today = new Date()
                   const currentYear = today.getFullYear()
                   const selectedYear = today.getFullYear()
                   
                   if (selectedYear === currentYear) {
                     return today.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })
                   } else {
                     return today.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' })
                   }
                 })()}
               </span>
                 </button>
               )
             })()}

            {/* Tomorrow Button - only show if tomorrow is not selected */}
            {(() => {
              const d = new Date()
              d.setDate(d.getDate() + 1)
              const tomorrowStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
              const isTomorrowSelected = selectedDates.length > 0 && selectedDates[0]?.format?.() === tomorrowStr
              
              if (isTomorrowSelected) return null
              
              return (
                <button
                  type="button"
                  onClick={() => {
                    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
                    const day = String(tomorrow.getDate()).padStart(2, '0')
                    const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
                    const year = tomorrow.getFullYear()
                    
                    setSelectedDates([{ 
                      format: (formatStr) => {
                        if (formatStr === 'DD/MM') {
                          return `${day}/${month}`
                        }
                        return `${day}/${month}/${year}`
                      }
                    }])
                    onClose()
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1 hover:bg-[#f3f3f3] rounded-md transition-colors text-[13px]"
                >
                   <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                  <span className="flex-1 font-medium hebrew-text text-right text-[13px]" style={{ color: 'var(--color-calendar-date)' }}>מחר</span>
                  <span className="text-[13px]" style={{ color: '#808080' }}>
                    {(() => {
                      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
                      const currentYear = new Date().getFullYear()
                      const selectedYear = tomorrow.getFullYear()
                      
                      if (selectedYear === currentYear) {
                        return tomorrow.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })
                      } else {
                        return tomorrow.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' })
                      }
                    })()}
                  </span>
                </button>
              )
            })()}

            {/* Next Week Button */}
            <button
              type="button"
              onClick={() => {
                const d = new Date()
                d.setDate(d.getDate() + 7)
                const day = String(d.getDate()).padStart(2, '0')
                const month = String(d.getMonth() + 1).padStart(2, '0')
                const year = d.getFullYear()
                
                setSelectedDates([{ 
                  format: (formatStr) => {
                    if (formatStr === 'DD/MM') {
                      return `${day}/${month}`
                    }
                    return `${day}/${month}/${year}`
                  }
                }])
                onClose()
              }}
              className="w-full flex items-center gap-2 px-2 py-1 hover:bg-[#f3f3f3] rounded-md transition-colors text-[13px]"
            >
               <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className="flex-1 font-medium hebrew-text text-right text-[13px]" style={{ color: 'var(--color-calendar-date)' }}>שבוע הבא</span>
              <span className="text-[13px]" style={{ color: '#808080' }}>
                {(() => {
                  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  const currentYear = new Date().getFullYear()
                  const selectedYear = nextWeek.getFullYear()
                  
                  if (selectedYear === currentYear) {
                    return nextWeek.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })
                  } else {
                    return nextWeek.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                  }
                })()}
              </span>
            </button>

            {/* No Date Button - only show if a date is selected */}
            {selectedDates.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDates([])
                  onClose()
                }}
                className="w-full flex items-center gap-2 px-2 py-1 hover:bg-[#f3f3f3] rounded-md transition-colors text-[13px]"
              >
                 <NoDateIcon className="w-5 h-5" />
                <span className="flex-1 font-medium hebrew-text text-right text-[13px]" style={{ color: 'var(--color-calendar-date)' }}>ללא תאריך</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Calendar Component */}
        <div 
          className="border-b border-gray-100 pt-2 pr-2 pl-2 pb-2"
          onWheel={(e) => {
            // do not call preventDefault to avoid passive listener warning
            e.stopPropagation()
            const dir = e.deltaY > 0 ? 1 : -1
            const d = new DateObject(calendarViewDate)
            d.setMonth(d.month.number + dir)
            setCalendarViewDate(d)
          }}
          style={{ maxHeight: 320, overflowY: 'auto' }}
        >
          <Calendar
            value={selectedDates}
            onChange={(dates) => {
              // Ensure only single date selection
              if (Array.isArray(dates) && dates.length > 0) {
                setSelectedDates([dates[dates.length - 1]]) // Take only the last selected date
              } else if (dates && !Array.isArray(dates)) {
                setSelectedDates([dates]) // Single date object
              } else {
                setSelectedDates([]) // No date
              }
            }}
            locale={hebrew_locale}
            multiple={false}
            format="DD/MM/YYYY"
            calendarPosition="bottom-right"
            className="rmdp-calendar hebrew-text calendar-date-picker"
            weekDays={hebrew_locale.weekDays}
            months={hebrew_locale.months}
            containerStyle={{
              width: '280px'
            }}
            style={{
                direction: 'rtl',
                boxShadow: 'none',
                border: 'none',
                background: 'transparent',
                fontSize: '13px'
              }}
               currentDate={calendarViewDate}
               onMonthChange={(date) => setCalendarViewDate(date)}
            />
        </div>

         {/* 3. Time and Repeat Buttons */}
        <div className="pt-2 pb-2 pr-1 pl-1 space-y-2 flex flex-col items-center">
            {/* Time Button */}
            <div className="relative w-full flex justify-center">
              <button
                type="button"
                onClick={() => setShowTimePicker(!showTimePicker)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded-md hover:bg-[#f3f3f3] transition-colors w-[85%] text-[13px] font-semibold ${
                  selectedTime ? 'border-gray-300' : 'border-gray-300'
                }`}
                style={{ color: '#808080' }}
              >
                <ClockIcon className="w-3.5 h-3.5" />
                <span className="text-[13px] hebrew-text font-semibold">שעה</span>
              </button>

              {/* Time Picker Modal */}
              {showTimePicker && (
                <div className="absolute bottom-full left-0 mb-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3">
                  <div className="space-y-3">
                    {/* Time Field */}
                    <div className="flex items-center gap-2">
                                  <label className="text-[13px] font-medium hebrew-text w-12" style={{ color: 'var(--color-calendar-date)' }}>שעה:</label>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={selectedTime}
                          onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                          readOnly
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[13px] cursor-pointer"
                          placeholder="בחר שעה"
                        />
                        
                        {/* Time Dropdown - only show when clicked */}
                        {showTimeDropdown && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                            {generateTimeOptions().map((time, index) => (
                              <div
                                key={time}
                                onClick={() => {
                                  setSelectedTime(time)
                                  setShowTimeDropdown(false)
                                }}
                            className={`px-2 py-1.5 cursor-pointer hover:bg-gray-100 text-[13px] ${
                              index === 0 ? 'font-semibold bg-blue-50' : ''
                            } ${selectedTime === time ? 'bg-blue-100' : ''}`}
                              >
                                {time}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Duration Field */}
                    <div className="flex items-center gap-2">
                                  <label className="text-[13px] font-medium hebrew-text w-12" style={{ color: 'var(--color-calendar-date)' }}>משך:</label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[13px]"
                      >
                        <option value="No duration">ללא משך</option>
                        <option value="15 minutes">15 דקות</option>
                        <option value="30 minutes">30 דקות</option>
                        <option value="1 hour">שעה</option>
                        <option value="2 hours">שעתיים</option>
                        <option value="3 hours">3 שעות</option>
                        <option value="4 hours">4 שעות</option>
                        <option value="6 hours">6 שעות</option>
                        <option value="8 hours">8 שעות</option>
                      </select>
                    </div>

                    {/* Time Zone Field */}
                    <div className="flex items-center gap-2">
                                  <label className="text-[13px] font-medium hebrew-text w-12" style={{ color: 'var(--color-calendar-date)' }}>אזור זמן:</label>
                      <select
                        value={timeZone}
                        onChange={(e) => setTimeZone(e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[13px]"
                      >
                        <option value="Floating time">זמן צף</option>
                        <option value="Asia/Jerusalem">ירושלים (GMT+2)</option>
                        <option value="UTC">UTC (GMT+0)</option>
                        <option value="America/New_York">ניו יורק (GMT-5)</option>
                        <option value="Europe/London">לונדון (GMT+0)</option>
                      </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                                       setSelectedTime(getDefaultTime())
                                       setDuration('No duration')
                                       setTimeZone('Floating time')
                                       setShowTimePicker(false)
                                       setShowTimeDropdown(false)
                                     }}
                                    className="px-2 py-1 text-[13px] text-gray-600 hover:bg-[#f3f3f3] hebrew-text"
                                  >
                                    ביטול
                      </button>
            <button
              type="button"
                          onClick={() => {
                            setShowTimePicker(false)
                            setShowTimeDropdown(false)
                          }}
                          className="px-2 py-1 bg-red-500 text-white text-[13px] rounded hover:bg-red-600 transition-colors hebrew-text"
                        >
                          שמור
            </button>
          </div>
                  </div>
                </div>
              )}
            </div>

            {/* Repeat Button */}
            <div className="relative w-full flex justify-center">
              <button
                type="button"
                onClick={() => setShowRepeatPicker(!showRepeatPicker)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded-md hover:bg-[#f3f3f3] transition-colors w-[85%] text-[13px] font-semibold ${
                  repeatType !== 'No repeat' ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                }`}
                style={{ color: '#808080' }}
              >
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-[13px] hebrew-text font-semibold">חזרה</span>
              </button>

              {/* Repeat Picker Modal */}
              {showRepeatPicker && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3">
                  <div className="space-y-2">
                                <label className="block text-[13px] font-medium mb-1 hebrew-text" style={{ color: 'var(--color-calendar-date)' }}>חזרה</label>
                    <select
                      value={repeatType}
                      onChange={(e) => setRepeatType(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[13px]"
                    >
                      <option value="No repeat">ללא חזרה</option>
                      <option value="Daily">יומי</option>
                      <option value="Weekly">שבועי</option>
                      <option value="Monthly">חודשי</option>
                      <option value="Yearly">שנתי</option>
                      <option value="Custom">מותאם אישית</option>
                    </select>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRepeatType('No repeat')
                                      setShowRepeatPicker(false)
                                    }}
                                    className="px-2 py-1 text-[13px] text-gray-600 hover:bg-[#f3f3f3] hebrew-text"
                                  >
                                    ביטול
                                  </button>
                      <button
                        type="button"
                        onClick={() => setShowRepeatPicker(false)}
                        className="px-2 py-1 bg-red-500 text-white text-[13px] rounded hover:bg-red-600 transition-colors hebrew-text"
                      >
                        שמור
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
        </div>

      </div>
    </div>
  )
}

export default DatePickerDropdown
