import { useState } from 'react'
import TodoistTaskCreator from './TodoistTaskCreator'
import { PlusIcon } from '@heroicons/react/24/outline'

function TodoistTaskWrapper({ 
  onCreateTask, 
  currentView, 
  projects = [], 
  teams = [],
  className = "",
  timeSlot = null,
  currentUser = ''
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleExpand = () => {
    setIsExpanded(true)
  }

  const handleCollapse = () => {
    setIsExpanded(false)
  }

  const handleCreateTask = (task) => {
    onCreateTask(task)
    setIsExpanded(false)
  }

  // Get view context for styling
  const isTeamContext = currentView.startsWith('team-')
  
  // Get time slot display text for button
  const getButtonText = () => {
    if (timeSlot) {
      const isToday = timeSlot.due_date === new Date().toISOString().split('T')[0]
      const timeRange = `${timeSlot.due_time}-${timeSlot.end_time}`
      return isToday ? `הוסף משימה - היום ${timeRange}` : `הוסף משימה - ${timeSlot.due_date} ${timeRange}`
    }
    return 'הוסף משימה'
  }
  
  if (!isExpanded) {
    return (
      <div className={`${className}`}>
        <button
          onClick={handleExpand}
          className="flex items-start py-2 transition-colors w-full group"
        >
          <div className="w-5 h-5 ml-3 mt-0.5 flex items-center justify-center transition-all duration-200">
            <div className="w-5 h-5 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ backgroundColor: 'var(--color-add-task-icon)' }}>
              <PlusIcon className="w-3 h-3" />
            </div>
            <PlusIcon className="w-5 h-5 absolute group-hover:opacity-0 transition-opacity duration-200" style={{ color: 'var(--color-add-task-icon)' }} />
          </div>
          <span className="hebrew-text text-base ml-1 transition-colors" style={{ color: 'var(--color-add-task, #808080)' }}>{getButtonText()}</span>
        </button>
      </div>
    )
  }

  return (
    <div className={`mb-4 ${className}`}>
      <TodoistTaskCreator
        isOpen={isExpanded}
        onClose={handleExpand}
        onCreateTask={handleCreateTask}
        onCancel={handleCollapse}
        currentView={currentView}
        projects={projects}
        teams={teams}
        timeSlot={timeSlot}
        currentUser={currentUser}
      />
    </div>
  )
}

export default TodoistTaskWrapper
