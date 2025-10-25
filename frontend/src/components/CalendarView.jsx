import React, { useState, useEffect, useMemo } from 'react'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/he' // Hebrew locale
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useDarkMode } from '../contexts/DarkModeContext'

// Configure moment with Hebrew locale and 24-hour format
moment.locale('he')
// Override moment's Hebrew locale with proper Hebrew day names
moment.updateLocale('he', {
  longDateFormat: {
    LT: 'HH:mm',
    LTS: 'HH:mm:ss',
    L: 'DD/MM/YYYY',
    LL: 'D MMMM YYYY',
    LLL: 'D MMMM YYYY HH:mm',
    LLLL: 'dddd, D MMMM YYYY HH:mm'
  },
  weekdays: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
  weekdaysShort: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
  weekdaysMin: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
  months: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
  monthsShort: ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ']
})
const localizer = momentLocalizer(moment)

// Hebrew messages for the calendar
const hebrewMessages = {
  allDay: 'כל היום',
  previous: 'קודם',
  next: 'הבא',
  today: 'היום',
  month: 'חודש',
  week: 'שבוע',
  day: 'יום',
  agenda: 'סדר יום',
  date: 'תאריך',
  time: 'שעה',
  event: 'אירוע',
  noEventsInRange: 'אין אירועים בטווח זה',
  showMore: total => `+${total} נוספים`
}

// Hebrew formats with 24-hour time
const hebrewFormats = {
  monthHeaderFormat: 'MMMM YYYY',
  dayHeaderFormat: 'dddd DD/MM',
  dayRangeHeaderFormat: ({ start, end }) => {
    return `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM')}`
  },
  agendaHeaderFormat: ({ start, end }) => {
    return `${moment(start).format('DD/MM/YYYY')} - ${moment(end).format('DD/MM/YYYY')}`
  },
  agendaDateFormat: 'dddd DD/MM',
  agendaTimeFormat: 'HH:mm',
  agendaTimeRangeFormat: ({ start, end }) => {
    return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
  },
  timeGutterFormat: 'HH:mm',
  eventTimeRangeFormat: ({ start, end }) => {
    return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
  },
  selectRangeFormat: ({ start, end }) => {
    return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
  }
}

// Custom day header component to ensure Hebrew day names
const DayHeader = ({ date, view }) => {
  const hebrewDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
  const dayIndex = moment(date).day()
  const dayName = hebrewDayNames[dayIndex]
  const dayNumber = moment(date).format('D') // Just the day number without month
  
  return (
    <div className="hebrew-text text-center text-[13px] text-gray-500" dir="rtl">
      <div className="font-medium">
        {view === 'week' ? `${dayName} ${dayNumber}` : dayName}
      </div>
    </div>
  )
}

// Custom Toolbar Component for better UX
const CustomToolbar = ({ label, onNavigate, onView, view, date, isDarkMode }) => {
  const [showViewMenu, setShowViewMenu] = useState(false)
  
  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showViewMenu && !event.target.closest('.view-selector')) {
        setShowViewMenu(false)
      }
    }
    
    const handleEscape = (event) => {
      if (event.key === 'Escape' && showViewMenu) {
        setShowViewMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showViewMenu])

  // Force rbc-overlay width globally via inline styles to override library min-width
  useEffect(() => {
    const applyOverlayWidth = () => {
      // Clean up any previously hidden overlays
      document.querySelectorAll('.rbc-overlay[style*="display: none"]').forEach((old) => {
        if (old && old.parentNode) {
          old.parentNode.removeChild(old)
        }
      })

      const overlays = document.querySelectorAll('.rbc-overlay')
      overlays.forEach((el) => {
        el.style.width = '260px'
        // Align header title to the right and add close button on the left
        const header = el.querySelector('.rbc-overlay-header') || el.firstElementChild
        if (header) {
          header.style.display = 'flex'
          header.style.flexDirection = 'row-reverse' // title on the right (RTL)
          header.style.alignItems = 'center'
          header.style.justifyContent = 'space-between'
          header.style.gap = '8px'
          header.style.direction = 'rtl'
          header.style.fontSize = '16px'
          header.style.fontWeight = '600'
          header.style.minHeight = '40px'
          header.style.padding = '8px 10px'

          // Ensure there is a close button on the left
          let closeBtn = header.querySelector('.rbc-overlay-close')
          if (!closeBtn) {
            closeBtn = document.createElement('button')
            closeBtn.className = 'rbc-overlay-close'
            closeBtn.type = 'button'
            closeBtn.textContent = '✕'
            closeBtn.style.border = 'none'
            closeBtn.style.background = 'transparent'
            closeBtn.style.cursor = 'pointer'
            closeBtn.style.fontSize = '14px'
            closeBtn.style.lineHeight = '1'
            closeBtn.style.padding = '4px'
            closeBtn.style.color = 'inherit'
            closeBtn.addEventListener('click', (e) => {
              e.stopPropagation()
              // Hide overlay without tearing down React portal to avoid crashes
              el.style.display = 'none'
            })
            // Insert at the start so visually it will be on the left (with row-reverse)
            header.prepend(closeBtn)
          }
        }
      })
    }

    // Run once now
    applyOverlayWidth()

    // Observe DOM for overlay insertions
    const observer = new MutationObserver(() => applyOverlayWidth())
    observer.observe(document.body, { childList: true, subtree: true })

    window.addEventListener('resize', applyOverlayWidth)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', applyOverlayWidth)
    }
  }, [])
  
  const viewOptions = [
    { key: Views.MONTH, label: 'חודש', icon: '📅' },
    { key: Views.WEEK, label: 'שבוע', icon: '📆' },
    { key: Views.DAY, label: 'יום', icon: '📋' },
    { key: Views.AGENDA, label: 'סדר יום', icon: '📝' }
  ]
  
  const currentViewOption = viewOptions.find(v => v.key === view)
  
  const navigate = (action) => {
    onNavigate(action)
  }
  
  const goToToday = () => {
    onNavigate('TODAY')
  }
  
  return (
    <div className={`flex items-center justify-between p-3 sm:p-4  ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
      {/* Left side - Date Label */}
      <div className={`text-base sm:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        {moment(date).format('MM/YYYY')}
      </div>
      
      {/* Center - Navigation Cluster */}
      <div className={`flex items-center rounded-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
        <button
          onClick={() => navigate('PREV')}
          className={`p-2 rounded-l-lg transition-all duration-200 hover:scale-105 ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          title="חודש קודם"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Separator line */}
        <div className={`h-6 w-px ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
        
        <button
          onClick={goToToday}
          className={`px-3 sm:px-4 py-2 font-medium transition-all duration-200 hover:scale-105 text-sm sm:text-base ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          היום
        </button>
        
        {/* Separator line */}
        <div className={`h-6 w-px ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
        
        <button
          onClick={() => navigate('NEXT')}
          className={`p-2 rounded-r-lg transition-all duration-200 hover:scale-105 ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          title="חודש הבא"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      {/* Right side - View Selector */}
      <div className="relative view-selector">
        <button
          onClick={() => setShowViewMenu(!showViewMenu)}
          className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg border transition-all duration-200 hover:scale-105 rtl:space-x-reverse text-sm sm:text-base ${isDarkMode ? 'border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-300' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700'}`}
        >
          <span className="text-sm sm:text-base">{currentViewOption?.icon}</span>
          <span className="hidden sm:inline">{currentViewOption?.label}</span>
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showViewMenu && (
          <div className={`absolute top-full right-0 mt-1 w-44 sm:w-48 rounded-lg shadow-lg border z-50 animate-in slide-in-from-top-2 duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
            {viewOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  onView(option.key)
                  setShowViewMenu(false)
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-right hover:bg-opacity-10 hover:bg-gray-500 transition-colors rtl:space-x-reverse ${
                  view === option.key 
                    ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900') 
                    : (isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50')
                }`}
              >
                <span className="text-lg">{option.icon}</span>
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CalendarView({ tasks = [], projects = [], googleCalendarEvents = [], onOpenTaskModal, onEditTask, onOpenTaskDetail, onLoadEventsForRange }) {
  const { isDarkMode } = useDarkMode()
  const [currentView, setCurrentView] = useState(Views.MONTH)
  // Always start at today's date to show current events
  const [currentDate, setCurrentDate] = useState(() => new Date())
  
  // Initialize visible range with current month view to avoid initial empty state
  const getInitialVisibleRange = () => {
    const now = new Date()
    const start = new Date(now)
    start.setDate(1)
    start.setDate(start.getDate() - 7) // 1 week before month start
    const end = new Date(now)
    end.setMonth(end.getMonth() + 1)
    end.setDate(0) // Last day of current month
    end.setDate(end.getDate() + 7) // 1 week after month end
    return { start, end }
  }
  
  const [visibleRange, setVisibleRange] = useState(getInitialVisibleRange)

  // Google Calendar events are now passed as props from App level
  
  // Calculate visible date range based on current view and date
  // This is the Todoist/Google Calendar approach - only load what's visible
  const calculateVisibleRange = (date, view) => {
    const start = new Date(date)
    const end = new Date(date)
    
    switch (view) {
      case Views.MONTH:
        // For month view: show current month + buffer for prev/next month edges
        start.setDate(1)
        start.setDate(start.getDate() - 7) // 1 week before month start
        end.setMonth(end.getMonth() + 1)
        end.setDate(0) // Last day of current month
        end.setDate(end.getDate() + 7) // 1 week after month end
        break
      case Views.WEEK:
        // For week view: current week + buffer
        const dayOfWeek = start.getDay()
        start.setDate(start.getDate() - dayOfWeek - 1) // Week start + 1 day buffer
        end.setDate(start.getDate() + 8) // Week end + 1 day buffer
        break
      case Views.DAY:
        // For day view: just current day
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case Views.AGENDA:
        // For agenda view: next 30 days
        start.setHours(0, 0, 0, 0)
        end.setDate(end.getDate() + 30)
        break
      default:
        // Default to month view range
        start.setDate(1)
        start.setDate(start.getDate() - 7)
        end.setMonth(end.getMonth() + 1)
        end.setDate(0)
        end.setDate(end.getDate() + 7)
    }
    
    return { start, end }
  }
  
  // Update visible range when view or date changes
  // Trigger lazy loading if needed (Todoist approach)
  useEffect(() => {
    const range = calculateVisibleRange(currentDate, currentView)
    setVisibleRange(range)
    
    // Check if we need to lazy load events for this range
    if (onLoadEventsForRange) {
      // Add buffer: ±1 month from visible range for smooth navigation
      const bufferStart = new Date(range.start)
      bufferStart.setMonth(bufferStart.getMonth() - 1)
      const bufferEnd = new Date(range.end)
      bufferEnd.setMonth(bufferEnd.getMonth() + 1)
      
      const startStr = bufferStart.toISOString().split('T')[0]
      const endStr = bufferEnd.toISOString().split('T')[0]
      
      // Trigger lazy load (will check if already loaded)
      onLoadEventsForRange(startStr, endStr)
    }
  }, [currentDate, currentView, onLoadEventsForRange])

  // Convert tasks to calendar events
  // OPTIMIZATION: Only process events within visible range (Todoist approach)
  const events = useMemo(() => {
    // Don't process if we don't have a visible range yet
    if (!visibleRange.start || !visibleRange.end) {
      return []
    }
    
    // Filter out completed tasks and only show tasks with due_date IN VISIBLE RANGE
    const filteredTasks = tasks.filter(task => {
      const hasDueDate = task.due_date || task.due_time
      const isNotCompleted = !task.is_completed && !task.completed
      
      if (!hasDueDate || !isNotCompleted) return false
      
      // OPTIMIZATION: Only include tasks within visible date range
      const taskDate = new Date(task.due_date || task.due_time)
      return taskDate >= visibleRange.start && taskDate <= visibleRange.end
    })
    
    // Reduced logging for performance
    // console.log(`CalendarView: ${filteredTasks.length}/${tasks.length} tasks with due dates`)
    
    // Convert app tasks to events
    const taskEvents = filteredTasks.map(task => {
        // Handle both due_date and due_time fields
        const dueDateValue = task.due_date || task.due_time
        const dueDate = new Date(dueDateValue)
        const project = projects.find(p => p.name === task.project)
        
        // Check if task has specific time or is all-day
        const hasSpecificTime = task.due_time && (
          (typeof task.due_time === 'string' && task.due_time.includes('T') && task.due_time.includes(':')) ||
          (task.due_time instanceof Date && task.due_time.getHours() !== 0)
        )
        const isAllDay = !hasSpecificTime
        
        let startTime, endTime
        
        if (isAllDay) {
          // All-day task
          startTime = new Date(dueDate)
          startTime.setHours(0, 0, 0, 0)
          endTime = new Date(dueDate)
          endTime.setHours(23, 59, 59, 999)
        } else {
          // Timed task - combine date and time if available
          if (task.due_date && task.due_time) {
            // Combine date and time
            const datePart = new Date(task.due_date)
            const timePart = task.due_time
            startTime = new Date(datePart.getFullYear(), datePart.getMonth(), datePart.getDate(), 
                                timePart.getHours ? timePart.getHours() : 0, 
                                timePart.getMinutes ? timePart.getMinutes() : 0)
          } else {
            // Use the date directly
            startTime = dueDate
          }
          // Default 1 hour duration for timed tasks
          endTime = new Date(startTime.getTime() + 3600000) // 1 hour later
        }
        
        return {
          id: task.id,
          title: task.title,
          start: startTime,
          end: endTime,
          allDay: isAllDay,
          resource: {
            task,
            project,
            priority: task.priority,
            isAllDay,
            source: 'app' // Mark as app task
          }
        }
      })

    // Convert Google Calendar events (only those within visible range)
    // OPTIMIZATION: Filter Google Calendar events by visible range first
    const visibleGoogleEvents = googleCalendarEvents.filter(event => {
      const eventDate = new Date(event.start)
      const isInRange = eventDate >= visibleRange.start && eventDate <= visibleRange.end
      
      // Debug: log why events are filtered out (only for first event)
      if (googleCalendarEvents.indexOf(event) === 0) {
        console.log(`📅 DEBUG - First event: "${event.title}"`)
        console.log(`   Event date: ${eventDate.toLocaleDateString()}`)
        console.log(`   Visible range: ${visibleRange.start.toLocaleDateString()} to ${visibleRange.end.toLocaleDateString()}`)
        console.log(`   In range: ${isInRange}`)
      }
      
      return isInRange
    })
    
    const gcalEvents = visibleGoogleEvents.map(event => {
      let startTime, endTime
      
      if (event.is_all_day) {
        // For all-day events, Google Calendar returns dates as "YYYY-MM-DD"
        // Create proper Date objects for all-day events
        startTime = new Date(event.start + 'T00:00:00')
        // For all-day events, use the same date for start and end to prevent stretching
        // Google Calendar returns end date as next day, but we want same day
        endTime = new Date(event.start + 'T23:59:59')
        
        // Debug all-day events (disabled for performance)
        // console.log(`📅 All-day event: ${event.title} - Start: ${event.start}, End: ${event.end} -> StartTime: ${startTime.toISOString()}, EndTime: ${endTime.toISOString()}`)
      } else {
        // For timed events, dates should already include time information
        startTime = new Date(event.start)
        endTime = new Date(event.end)
        
        // Debug timed events (disabled for performance)
        // console.log(`📅 Timed event: ${event.title} - Start: ${event.start}, End: ${event.end} -> StartTime: ${startTime.toISOString()}, EndTime: ${endTime.toISOString()}`)
      }
      
      // Clean Google Calendar event titles by removing time patterns
      const cleanTitle = event.title
        .replace(/\d{1,2}:\d{2}\s*[-–—]\s*\d{1,2}:\d{2}\s*/g, '') // Remove "HH:MM - HH:MM "
        .replace(/^\d{1,2}:\d{2}\s*/, '') // Remove "HH:MM " at start
        .replace(/\s*[-–—]\s*\d{1,2}:\d{2}\s*$/g, '') // Remove " - HH:MM" at end
        .replace(/\d{1,2}:\d{2}/g, '') // Remove any remaining time patterns
        .replace(/\s+/g, ' ') // Clean up multiple spaces
        .trim()
      
      // Debug: log title cleaning
      if (event.title !== cleanTitle) {
        console.log(`🧹 Title cleaned: "${event.title}" → "${cleanTitle}"`)
      }
      
      return {
        id: event.id,
        title: cleanTitle || event.title, // Use cleaned title, fallback to original if empty
        start: startTime,
        end: endTime,
        allDay: event.is_all_day,
        resource: {
          google_event_id: event.google_event_id,
          description: event.description,
          html_link: event.html_link,
          source: 'google_calendar', // Mark as Google Calendar event
          color: event.color,
          isGoogleEvent: true,
          calendar_summary: event.calendar_summary,
          calendar_id: event.calendar_id
        }
      }
    })

    // Merge both app tasks and Google Calendar events
    const allEvents = [...taskEvents, ...gcalEvents]
    
    // Deduplicate events based on title, date, and source
    const deduplicatedEvents = allEvents.reduce((acc, current) => {
      // Create a unique key for each event
      const key = `${current.title}_${current.start.toISOString().split('T')[0]}_${current.resource.source}`
      
      // Check if we already have this event
      const existingEvent = acc.find(event => {
        const eventKey = `${event.title}_${event.start.toISOString().split('T')[0]}_${event.resource.source}`
        return eventKey === key
      })
      
      if (!existingEvent) {
        acc.push(current)
      } 
      // Deduplication logging disabled for performance
      // else {
      //   console.log(`🔄 Deduplicated event: ${current.title} from ${current.resource.source}`)
      // }
      
      return acc
    }, [])
    
    // Detailed logging in development mode
    if (process.env.NODE_ENV === 'development') {
      const rangeStart = visibleRange.start.toLocaleDateString('he-IL')
      const rangeEnd = visibleRange.end.toLocaleDateString('he-IL')
      
      // Show available Google events date range
      if (googleCalendarEvents.length > 0) {
        const dates = googleCalendarEvents.map(e => new Date(e.start)).filter(d => !isNaN(d)).sort((a, b) => a - b)
        if (dates.length > 0) {
          const minDate = dates[0]
          const maxDate = dates[dates.length - 1]
          console.log(`📅 Available: ${googleCalendarEvents.length} Google events (${minDate.toLocaleDateString()} to ${maxDate.toLocaleDateString()})`)
        }
      }
      
      console.log(`📅 Viewing: ${rangeStart} - ${rangeEnd}`)
      console.log(`📅 Displaying: ${taskEvents.length} tasks + ${gcalEvents.length} Google = ${deduplicatedEvents.length} total`)
    }
    
    return deduplicatedEvents
  }, [tasks, projects, googleCalendarEvents, visibleRange])

  // Event style getter for different priorities and states
  const eventStyleGetter = (event) => {
    const { resource } = event
    let backgroundColor = '#F2EFED' // Default (priority 4)
    let borderColor = '#F2EFED'
    let color = '#202020' // Dark text for light backgrounds

    // Google Calendar events - transparent with purple dot
    if (resource.source === 'google_calendar') {
      return {
        style: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          color: '#333333',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          cursor: 'pointer',
          padding: '2px 8px 2px 6px', // Extra padding on right for the dot
          position: 'relative'
        }
      }
    }

    // App tasks - priority colors
    switch (resource.priority) {
      case 1: // High priority - light red/pink
        backgroundColor = '#FFD6D3'
        borderColor = '#FFD6D3'
        break
      case 2: // Medium-high priority - light orange/yellow
        backgroundColor = '#FBE7C3'
        borderColor = '#FBE7C3'
        break
      case 3: // Medium priority - light blue
        backgroundColor = '#DDE6F9'
        borderColor = '#DDE6F9'
        break
      case 4: // Low priority - light gray
        backgroundColor = '#F2EFED'
        borderColor = '#F2EFED'
        break
      default:
        backgroundColor = '#F2EFED'
        borderColor = '#F2EFED'
    }

    // Note: Completed tasks are now filtered out, so this styling is no longer needed

    // Dark mode adjustments - keep dark text for all tasks (no completed tasks shown)
    if (isDarkMode) {
      color = '#202020'
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color,
        border: `1px solid ${borderColor}`,
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500'
      }
    }
  }

  // Custom event component with time display (RTL)
  const EventComponent = ({ event }) => {
    const { resource } = event
    const isGoogleEvent = resource.source === 'google_calendar'
    
    // Format time for display (only start time)
    const getTimeString = () => {
      if (!event.start || event.allDay) return null
      
      const date = new Date(event.start)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
    
    const timeStr = getTimeString()
    
    return (
      <div 
        className="hebrew-text" 
        style={{ 
          fontSize: '11px', 
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          direction: 'rtl',
          width: '100%',
          position: 'relative'
        }}
      >
        {/* Purple elliptical dot for Google events */}
        {isGoogleEvent && (
          <div style={{
            position: 'absolute',
            right: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '4px',
            height: '6px',
            backgroundColor: '#8B5CF6', // Purple color
            borderRadius: '50%',
            opacity: 0.8
          }} />
        )}
        
        {/* Event title (already cleaned in event data) */}
        <span style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          marginRight: isGoogleEvent ? '8px' : '0' // Space for the dot on the right
        }}>
          {event.title}
        </span>
        
        {/* For Google events: show time on the left (last in RTL) */}
        {isGoogleEvent && timeStr && (
          <span style={{ 
            fontSize: '10px', 
            opacity: 0.8,
            fontWeight: '600',
            minWidth: 'fit-content'
          }}>
            {timeStr}
          </span>
        )}
      </div>
    )
  }

  // Handle event selection
  const handleSelectEvent = (event) => {
    // If it's a Google Calendar event, open it in Google Calendar
    if (event.resource.source === 'google_calendar' && event.resource.html_link) {
      window.open(event.resource.html_link, '_blank')
      return
    }
    
    // Otherwise, open task detail modal for app tasks
    if (onOpenTaskDetail && event.resource.task) {
      onOpenTaskDetail(event.resource.task)
    }
  }

  // Handle slot selection (directly open task modal)
  const handleSelectSlot = ({ start, end }) => {
    console.log('📅 Calendar slot selected:', { start, end, currentView })
    
    // Calculate end time as 30 minutes after start if not provided or if it's a short slot
    const defaultEnd = new Date(start.getTime() + 30 * 60000) // 30 minutes later
    const actualEnd = end && (end.getTime() - start.getTime()) >= 30 * 60000 ? end : defaultEnd
    
    if (onOpenTaskModal) {
      // Check if this is an all-day selection (no specific time)
      const isAllDaySelection = currentView === Views.MONTH || (start.getHours() === 0 && start.getMinutes() === 0)
      
      // Pass the selected date data to the task creation modal
      const initialData = {
        due_date: moment(start).format('YYYY-MM-DD'), // Date in YYYY-MM-DD format for the modal
        due_time: isAllDaySelection ? null : moment(start).format('HH:mm'), // Time only if specific time selected
        start_time: start,
        end_time: actualEnd
      }
      console.log('📅 Opening task modal with data:', initialData)
      onOpenTaskModal(initialData)
    } else {
      console.warn('⚠️ onOpenTaskModal is not defined!')
    }
  }


  return (
    <div className={`calendar-container w-full h-full min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`} dir="rtl">
      <style>{`
        /* Unified Calendar Border System */
        .calendar-container {
          --calendar-border: ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
        }
        
        /* Calendar Border Classes */
        .calendar-border {
          border: 0.5px solid var(--calendar-border);
        }
        .calendar-border-top {
          border-top: 0.5px solid var(--calendar-border);
        }
        .calendar-border-right {
          border-right: 0.5px solid var(--calendar-border);
        }
        .calendar-border-bottom {
          border-bottom: 0.5px solid var(--calendar-border);
        }
        .calendar-border-left {
          border-left: 0.5px solid var(--calendar-border);
        }
        
        .calendar-container {
          width: 100%;
          min-width: 0;
          height: calc(100vh - 56px);
          min-height: calc(100vh - 56px);
          display: flex;
          flex-direction: column;
        }
        
        .calendar-container .rbc-calendar {
          font-family: 'Noto Sans Hebrew', 'Inter', system-ui, sans-serif !important;
          direction: rtl !important;
          background: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
          color: ${isDarkMode ? '#ffffff' : '#000000'};
          width: 100%;
          height: calc(100vh - 56px);
          min-height: calc(100vh - 56px);
          display: flex;
          flex-direction: column;
          flex: 1;
          border-top: 1px solid var(--calendar-border);
        }
        
        .calendar-container .rbc-header {
          background: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
          color: ${isDarkMode ? '#ffffff' : '#000000'};
          border: none;
          font-weight: 600;
          text-align: center;
          padding: 8px;
          font-family: 'Noto Sans Hebrew', 'Inter', system-ui, sans-serif !important;
          direction: rtl !important;
          font-size: 13px;
        }
        
        .calendar-container .rbc-month-view,
        .calendar-container .rbc-time-view {
          background: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
          border: none;
          width: 100%;
          height: calc(100vh - 176px);
          min-height: calc(100vh - 176px);
          flex: 1;
        }
        
        /* Date Cells - add borders to complete the grid */
        .calendar-container .rbc-date-cell {
          color: ${isDarkMode ? '#ffffff' : '#000000'};
          padding: 4px;
          border: none;
          border-right: 0.5px solid var(--calendar-border);
          border-bottom: 0.5px solid var(--calendar-border);
        }
        
        .calendar-container .rbc-date-cell:last-child {
          border-right: none;
        }
        
        .calendar-container .rbc-month-view .rbc-row:last-child .rbc-date-cell {
          border-bottom: none;
        }
        
        .calendar-container .rbc-off-range-bg {
          background: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
        }
        
        /* Day background divs - completely reset all borders first */
        .calendar-container .rbc-day-bg {
          border: none !important;
          border-right: 0.5px solid var(--calendar-border) !important;
          border-bottom: 0.5px solid var(--calendar-border) !important;
        }
        
        /* Remove borders from edges to prevent double lines */
        .calendar-container .rbc-day-bg:last-child {
          border-right: none !important;
        }
        
        .calendar-container .rbc-month-view .rbc-row:last-child .rbc-day-bg {
          border-bottom: none !important;
        }
        
        /* Highlight today's date with filled blue circle like the image */
        .calendar-container .rbc-date-cell.rbc-now {
          position: relative;
        }
        
        .calendar-container .rbc-date-cell.rbc-now .rbc-button-link {
          position: relative;
          background: #C6DAFC !important; /* Light blue fill like the image */
          border: none !important;
          border-radius: 50% !important;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2A5699 !important; /* Dark blue number like the image */
          font-weight: 600 !important;
          font-size: 14px !important;
        }
        
        /* Remove any other conflicting borders and align containers */
        .calendar-container .rbc-month-row,
        .calendar-container .rbc-row,
        .calendar-container .rbc-row-bg,
        .calendar-container .rbc-row-content,
        .calendar-container .rbc-row-segment {
          border: none !important;
        }
        
        /* Ensure row container aligns with cell grid */
        .calendar-container .rbc-row {
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          display: flex !important;
          width: 101% !important;
        }
        
        /* Ensure each day cell takes equal width */
        .calendar-container .rbc-day-bg {
          flex: 1 !important;
          box-sizing: border-box !important;
        }
        
        .calendar-container .rbc-today {
          background: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
        }
        
        .calendar-container .rbc-toolbar {
          display: none; /* Hide default toolbar */
        }
        
        .calendar-container .rbc-toolbar button {
          background: ${isDarkMode ? '#404040' : '#ffffff'};
          color: ${isDarkMode ? '#ffffff' : '#000000'};
          border: 1px solid ${isDarkMode ? '#666666' : '#d0d0d0'};
          border-radius: 4px;
          padding: 6px 12px;
          margin: 0 2px;
          font-family: 'Noto Sans Hebrew', 'Inter', system-ui, sans-serif;
          transition: all 0.2s ease;
        }
        
        .calendar-container .rbc-toolbar button:hover {
          background: ${isDarkMode ? '#555555' : '#f0f0f0'};
        }
        
        .calendar-container .rbc-toolbar button.rbc-active {
          background: ${isDarkMode ? '#3b82f6' : '#2563eb'};
          color: white;
          border-color: ${isDarkMode ? '#3b82f6' : '#2563eb'};
        }
        
        .calendar-container .rbc-toolbar-label {
          font-size: 18px;
          font-weight: 600;
          color: ${isDarkMode ? '#ffffff' : '#000000'};
          font-family: 'Noto Sans Hebrew', 'Inter', system-ui, sans-serif;
        }
        
        .calendar-container .rbc-event {
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          padding: 3px 6px;
          border: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .calendar-container .rbc-day-bg:hover {
          background: ${isDarkMode ? '#333333' : '#f5f5f5'};
        }
        
        /* All-day section styling */
        .calendar-container .rbc-allday-cell {
          background: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
          border-bottom: 1px solid ${isDarkMode ? '#333333' : '#e5e7eb'};
          padding: 8px;
          min-height: 50px;
          display: block !important;
        }
        
        .calendar-container .rbc-row-content {
          background: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
        }
        
        /* Unified Calendar Borders - Weekly View */
        .calendar-container .rbc-time-view .rbc-timeslot-group {
          border-bottom: 1px solid var(--calendar-border);
          min-height: 80px;
        }
        
        .calendar-container .rbc-time-view .rbc-time-slot {
          border-top: none;
          border-bottom: none;
        }
        
        /* Only show the main hour boundary */
        .calendar-container .rbc-time-view .rbc-time-slot:last-child {
          border-bottom: none;
        }
        
        .calendar-container .rbc-time-gutter .rbc-timeslot-group {
          border-bottom: none;
        }
        
        .calendar-container .rbc-time-gutter .rbc-time-slot {
          border-bottom: none;
          border-top: none;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .calendar-container .rbc-time-content {
          border-left: none;
        }
        
        /* Unified Calendar Borders - Time Content */
        .calendar-container .rbc-time-content > * > * {
          border-left: 1px solid var(--calendar-border);
        }
        
        /* Remove border-right for RTL calendar */
        .calendar-container .rbc-rtl .rbc-time-content > * + * > * {
          border-right: none !important;
        }
        
        /* Remove all grid lines completely */
        .calendar-container .rbc-time-view .rbc-time-slot:nth-child(odd) {
          border-bottom: none;
          border-top: none;
        }
        
        .calendar-container .rbc-time-view .rbc-time-slot:nth-child(even) {
          border-bottom: none;
          border-top: none;
        }
        
        /* Remove any remaining hour borders */
        .calendar-container .rbc-time-view .rbc-timeslot-group .rbc-time-slot {
          border: none;
        }
        
        /* Full width styling */
        .calendar-container .rbc-calendar,
        .calendar-container .rbc-calendar * {
          box-sizing: border-box;
        }
        
        .calendar-container .rbc-time-view,
        .calendar-container .rbc-month-view {
          width: 100%;
          min-width: 0;
        }
        
        .calendar-container .rbc-time-content {
          width: 100%;
          min-width: 0;
          flex: 1;
        }
        
        .calendar-container .rbc-time-header {
          width: 100%;
        }
        
        /* Hebrew all-day text */
        .calendar-container .rbc-allday-cell .rbc-row-content {
          direction: rtl;
          text-align: right;
        }
        
        /* Force 24-hour format display */
        .calendar-container .rbc-time-gutter,
        .calendar-container .rbc-time-slot,
        .calendar-container .rbc-event-content {
          font-variant-numeric: tabular-nums;
        }
        
        /* Hide default time label in weekly view for Google Calendar events */
        .calendar-container .rbc-event-label {
          display: none !important;
        }
        
        /* Ensure time labels are in 24-hour format and centered */
        .calendar-container .rbc-time-gutter .rbc-timeslot-group {
          font-family: 'Noto Sans Hebrew', 'Inter', system-ui, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 80px;
        }
        
        /* Sticky date header - stays visible while scrolling hours */
        .calendar-container .rbc-time-header {
          position: sticky;
          top: 0;
          z-index: 10;
          background: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
          border-bottom: 1px solid ${isDarkMode ? '#2a2a2a' : '#f5f5f5'};
        }
        
        .calendar-container .rbc-time-header-content {
          background: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
        }
        
        .calendar-container .rbc-time-header {
          background: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
        }
        
        /* Show all-day section in header */
        .calendar-container .rbc-time-header .rbc-allday-cell {
          display: block !important;
          position: relative;
          background: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
        }
        
        /* Style the all-day row content */
        .calendar-container .rbc-allday-cell .rbc-row-content {
          background: transparent !important;
          border-bottom: none;
          min-height: 50px;
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          padding: 0;
          gap: 0;
          overflow: visible;
          position: relative;
        }
        
        /* Make row bg transparent */
        .calendar-container .rbc-allday-cell .rbc-row {
          background: transparent !important;
        }
        
        /* Ensure events are positioned correctly within their day columns */
        .calendar-container .rbc-allday-cell .rbc-row-segment {
          padding: 2px 4px;
        }
        
        /* Add "כל היום" label aligned with time gutter */
        .calendar-container .rbc-time-header-gutter {
          display: flex !important;
          align-items: flex-end !important;
          justify-content: center !important;
          padding-bottom: 8px;
          font-family: 'Noto Sans Hebrew', 'Inter', system-ui, sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: ${isDarkMode ? '#ffffff' : '#374151'};
          direction: rtl;
        }
        
        /* Set content for the time header gutter */
        .calendar-container .rbc-time-header-gutter::after {
          content: 'כל היום';
        }
        
        /* Make time content container relative for positioning */
        .calendar-container .rbc-time-content {
          position: relative;
        }
        
        /* Ensure all-day section is always visible */
        .calendar-container .rbc-time-view .rbc-row-content {
          background: ${isDarkMode ? '#2d2d2d' : '#f8f9fa'};
        }
        
        /* All-day events - style like regular events (let eventStyleGetter handle it) */
        .calendar-container .rbc-allday-cell .rbc-event,
        .calendar-container .rbc-allday-cell .rbc-event.rbc-selected,
        .calendar-container .rbc-allday-cell .rbc-event:focus,
        .calendar-container .rbc-allday-cell .rbc-event.rbc-addons-dnd-dragging {
          /* Don't override background/border - let eventStyleGetter apply them */
          box-shadow: none !important;
          padding: 4px 8px !important;
          margin: 2px 4px !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          min-height: 24px !important;
        }
        
        /* Hide the empty row background that's taking up space */
        .calendar-container .rbc-allday-cell .rbc-row-bg {
          display: none !important;
        }
        
        /* Remove background from day bg in all-day row */
        .calendar-container .rbc-allday-cell .rbc-day-bg {
          background: transparent !important;
        }
        
        /* Hide empty rows in all-day cell */
        .calendar-container .rbc-allday-cell .rbc-row:empty {
          display: none !important;
        }
        
        /* Ensure all-day row header aligns with day headers */
        .calendar-container .rbc-time-header .rbc-row:first-child {
          display: flex;
          align-items: stretch;
        }
        
        /* Make time content scrollable while keeping header fixed */
        .calendar-container .rbc-time-content {
          overflow-y: auto;
          max-height: calc(100vh - 176px); /* Adjust based on toolbar height + top spacer */
          scroll-behavior: smooth;
          flex: 1;
        }
        
        /* Ensure week and day views have proper sticky behavior */
        .calendar-container .rbc-time-view {
          position: relative;
        }
        
        /* Sticky time gutter labels */
        .calendar-container .rbc-time-gutter {
          position: sticky;
          left: 0;
          z-index: 8;
          background: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
        }
        
        /* Smooth scrolling for better UX */
        .calendar-container .rbc-time-content::-webkit-scrollbar {
          width: 8px;
        }
        
        .calendar-container .rbc-time-content::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#2d2d2d' : '#f1f1f1'};
        }
        
        .calendar-container .rbc-time-content::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#555' : '#c1c1c1'};
          border-radius: 4px;
        }
        
        .calendar-container .rbc-time-content::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#777' : '#a8a8a8'};
        }
        
        /* Hebrew day names styling */
        .calendar-container .rbc-header .hebrew-text {
          font-family: 'Noto Sans Hebrew', 'Inter', system-ui, sans-serif !important;
          direction: rtl !important;
          text-align: center;
          font-size: 13px !important;
          color: #6b7280 !important; /* gray-500 */
        }
        
        /* Ensure proper Hebrew font rendering */
        .calendar-container .rbc-header * {
          font-family: 'Noto Sans Hebrew', 'Inter', system-ui, sans-serif !important;
          direction: rtl !important;
          font-size: 13px !important;
        }
        
        /* Remove all borders from day headers */
        .calendar-container .rbc-header + .rbc-header {
          border-left: none !important;
        }
        
        .calendar-container .rbc-header {
          border-left: none !important;
          border-right: none !important;
          border-top: none !important;
          border-bottom: none !important;
        }
      `}</style>
      
      <div className="w-full h-full bg-white dark:bg-gray-900 overflow-hidden flex flex-col flex-1">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          allDayAccessor="allDay"
          style={{ height: 'calc(100vh - 56px)', minHeight: 'calc(100vh - 56px)', width: '100%' }}
          rtl={true}
          culture="he"
          messages={hebrewMessages}
          formats={hebrewFormats}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent,
            toolbar: (props) => <CustomToolbar {...props} isDarkMode={isDarkMode} />,
            header: (props) => <DayHeader {...props} view={currentView} />
          }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={true}
          popup={true}
          popupOffset={{ x: 30, y: 20 }}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          step={60}
          timeslots={1}
          defaultView={Views.MONTH}
          min={new Date(0, 0, 0, 8, 0, 0)} // 8 AM
          max={new Date(0, 0, 0, 22, 0, 0)} // 10 PM
          showMultiDayTimes={false}
        />
      </div>

    </div>
  )
}

export default CalendarView
