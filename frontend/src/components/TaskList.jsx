import { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon, UserGroupIcon, ShareIcon } from '@heroicons/react/24/outline'
import Task from './Task'
import TodoistTaskWrapper from './TodoistTaskWrapper'

// Helper function to get user-specific localStorage keys
const getUserStorageKey = (username, dataType) => {
  if (!username) return dataType
  return `${username}_${dataType}`
}

function TaskList({ tasks, allTasks, onToggleTask, onEditTask, onUpdateTask, projects, onOpenTaskModal, currentView, teams, onCreateTask, setTasks, onOpenTaskDetail, currentUser = '', onOpenShareModal }) {
  const [collapsedSections, setCollapsedSections] = useState({})
  const [collapsedTasks, setCollapsedTasks] = useState({})

  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const toggleTaskSubtasks = (taskId) => {
    setCollapsedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))
  }

  const formatTodayDate = () => {
    const today = new Date()
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
    const dayName = dayNames[today.getDay()]
    const dateStr = today.toLocaleDateString('he-IL', { 
      day: 'numeric', 
      month: 'long' 
    })
    return `${dateStr}, היום, ${dayName}`
  }

  // Group tasks by sections for today view
  const groupTasksBySection = () => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
    
    // Hebrew day names
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
    
    const sections = []

    // Separate overdue and today tasks
    const overdueTasks = tasks.filter(task => task.due_time && task.due_time < todayStr)
    const todayTasks = tasks.filter(task => task.due_time === todayStr)
    const upcomingTasks = tasks.filter(task => task.due_time && task.due_time > todayStr)
    const noDateTasks = tasks.filter(task => !task.due_time)

    // Today section (for currentView === 'today', this shows both today and overdue)
    if (currentView === 'today') {
      // Overdue section FIRST (as shown in the image)
      if (overdueTasks.length > 0) {
        sections.push({
          id: 'overdue',
          title: 'איחור במועד',
          subtitle: null,
          tasks: overdueTasks,
          canCollapse: true,
          showCount: false,
          showReschedule: true,
          colorClass: 'text-gray-800',
          hasBottomLine: true
        })
      }

      // Today section header
      if (todayTasks.length > 0) {
        sections.push({
          id: 'today',
          title: `${today.getDate()} ספט • היום • ${dayNames[today.getDay()]}`,
          subtitle: null,
          tasks: todayTasks,
          canCollapse: false,
          showCount: false,
          colorClass: 'text-gray-900',
          hasBottomLine: true
        })
      }
    } else {
      // For other views, show sections normally
      if (overdueTasks.length > 0) {
        sections.push({
          id: 'overdue',
          title: 'איחור במועד',
          subtitle: null,
          tasks: overdueTasks,
          canCollapse: true,
          showCount: false,
          showReschedule: true,
          colorClass: 'text-red-600',
          hasBottomLine: true
        })
      }

      if (todayTasks.length > 0) {
        sections.push({
          id: 'today',
          title: `${today.getDate()} ספט • היום • ${dayNames[today.getDay()]}`,
          subtitle: null,
          tasks: todayTasks,
          canCollapse: false,
          showCount: false,
          colorClass: 'text-gray-900',
          hasBottomLine: true
        })
      }

      if (upcomingTasks.length > 0) {
        sections.push({
          id: 'upcoming',
          title: 'הקרובים',
          subtitle: null,
          tasks: upcomingTasks,
          canCollapse: true,
          showCount: false,
          colorClass: 'text-gray-600',
          hasBottomLine: true
        })
      }

      if (noDateTasks.length > 0) {
        sections.push({
          id: 'noDate',
          title: 'ללא תאריך',
          subtitle: null,
          tasks: noDateTasks,
          canCollapse: true,
          showCount: false,
          colorClass: 'text-gray-600',
          hasBottomLine: true
        })
      }
    }

    return sections
  }

  const handleRescheduleOverdue = () => {
    const td = new Date()
    const today = `${td.getFullYear()}-${String(td.getMonth()+1).padStart(2,'0')}-${String(td.getDate()).padStart(2,'0')}`
    const taskArray = allTasks || tasks
    
    const overdueTasks = taskArray.filter(task => task.due_time && task.due_time < today)
    
    if (overdueTasks.length === 0) return

    const choice = confirm(`האם ברצונך לתזמן מחדש ${overdueTasks.length} משימות פגויות תוקף לתאריך היום?`)
    
    if (choice) {
      // Update all overdue tasks to today
      const updatedTasks = taskArray.map(task => {
        if (task.due_time && task.due_time < today) {
          return { ...task, due_time: today }
        }
        return task
      })
      
      // Update state and localStorage
      if (typeof setTasks === 'function') {
        setTasks(updatedTasks)
        localStorage.setItem(getUserStorageKey(currentUser, 'todoist_tasks'), JSON.stringify(updatedTasks))
      }
    }
  }

  const sectionsWithTasks = groupTasksBySection()

  // Helper function to render a task and its sub-tasks
  const renderTaskWithSubtasks = (task, isSubtask = false, isFirst = false) => {
    // In inbox view, subtasks are expanded by default (inverted logic)
    // In other views, subtasks are collapsed by default
    const isTaskExpanded = currentView === 'inbox' 
      ? collapsedTasks[task.id] !== false  // Expanded by default, only collapsed if explicitly set to false
      : collapsedTasks[task.id] === true   // Collapsed by default, only expanded if explicitly set to true
    
    return (
      <div key={task.id}>
        <div className={`relative task-line ${isFirst ? 'first-task' : ''}`}>
          <Task
            task={task}
            onToggle={() => onToggleTask(task.id)}
            onEdit={() => onEditTask && onEditTask(task)}
            onUpdateTask={onUpdateTask}
            projects={projects}
            teams={teams}
            isOverdue={false}
            onOpenTaskDetail={onOpenTaskDetail}
            isSubtask={isSubtask}
            currentView={currentView}
            onToggleSubtasks={toggleTaskSubtasks}
            isSubtasksExpanded={isTaskExpanded}
          />
        </div>
        {/* Render sub-tasks if they exist and are expanded */}
        {task.subtasks && task.subtasks.length > 0 && isTaskExpanded && (
          <div className="space-y-0 mr-8">
            {task.subtasks.map((subtask) => 
              renderTaskWithSubtasks(subtask, true, false)
            )}
          </div>
        )}
      </div>
    )
  }

  // Flat list rendering for Inbox to match reference UI (no sections)
  if (currentView === 'inbox') {
    // Show only tasks that belong to Inbox (no project) and are not sub-tasks
    const mainTasks = tasks.filter(task => !task.parent_task && !task.project)
    
    return (
      <div className="max-w-4xl">
        <div className="space-y-0">
          {mainTasks.map((task, idx) => (
            renderTaskWithSubtasks(task, false, idx === 0)
          ))}
        </div>

        {/* Task Creator */}
        <div className="">
          <TodoistTaskWrapper
            onCreateTask={onCreateTask}
            currentView={currentView}
            projects={projects}
            teams={teams}
            currentUser={currentUser}
          />
        </div>
      </div>
    )
  }

  // Flat list rendering for Upcoming view to match reference UI (no sections)
  if (currentView === 'upcoming') {
    // Filter out sub-tasks from main list (they'll be shown under their parents)
    const mainTasks = tasks.filter(task => !task.parent_task)
    
    return (
      <div className="max-w-4xl">
        <div className="space-y-0">
          {mainTasks.map((task) => renderTaskWithSubtasks(task))}
        </div>

        {/* Task Creator */}
        <div className="mt-6">
          <TodoistTaskWrapper
            onCreateTask={onCreateTask}
            currentView={currentView}
            projects={projects}
            teams={teams}
            currentUser={currentUser}
          />
        </div>
      </div>
    )
  }

  // Flat list for project views: show only tasks, no date group headers
  if (typeof currentView === 'string' && currentView.startsWith('project-')) {
    const projectId = currentView.replace('project-', '')
    const project = projects.find(p => p.id === parseInt(projectId))
    const isShared = project?.is_shared
    const isOwner = project?.is_owner
    
    const mainTasks = tasks.filter(task => !task.parent_task)
    
    return (
      <div className="max-w-4xl">
        {/* Share Button - only show if owner AND not yet shared */}
        {isOwner && !isShared && (
          <div className="mb-4">
            <button
              onClick={() => onOpenShareModal && onOpenShareModal(project)}
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors hebrew-text"
            >
              <ShareIcon className="w-5 h-5" />
              <span>שתף</span>
            </button>
          </div>
        )}

        {/* Show shared indicator */}
        {isShared && (
          <div className="mb-3 flex items-center space-x-2 space-x-reverse text-gray-600">
            <UserGroupIcon className="w-5 h-5" />
            <span className="text-sm hebrew-text">פרויקט משותף</span>
          </div>
        )}

        <div className="space-y-0">
          {mainTasks.map((task) => renderTaskWithSubtasks(task))}
        </div>

        {/* Task Creator */}
        <div className="">
          <TodoistTaskWrapper
            onCreateTask={onCreateTask}
            currentView={currentView}
            projects={projects}
            teams={teams}
            currentUser={currentUser}
          />
        </div>
      </div>
    )
  }

  // Ensure Today tab shows exactly two sections: overdue then today
  const orderedSections = currentView === 'today'
    ? ['overdue', 'today']
        .map(id => sectionsWithTasks.find(s => s.id === id))
        .filter(Boolean)
    : sectionsWithTasks

  return (
    <div className="max-w-4xl">
      {orderedSections.map((section, sectionIndex) => {
        const isCollapsed = collapsedSections[section.id]
        
        return (
          <div key={section.id} >
            {/* Clean Section Header */}
            <div className="relative">
              {/* Arrow positioned in green sidebar area - outside main content */}
              {section.canCollapse && (
                <div className="absolute -right-8 top-0 flex items-center h-full">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    style={{ width: 24, height: 24 }}
                  >
                    {isCollapsed ? (
                      <ChevronRightIcon className="w-4 h-4" style={{ color: '#666' }} />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" style={{ color: '#666' }} />
                    )}
                  </button>
                </div>
              )}
              
              <div className="pl-3 pr-0 relative header-line">
                <div className="flex items-center justify-between">
                  {/* Text content aligned with main Y-axis */}
                  <div className="flex items-center space-x-3 space-x-reverse ml-3">
                    <h2
                      className={`font-semibold hebrew-text`}
                      style={section.id === 'today' ? {  paddingBottom: '0.15rem', fontWeight: '700', marginTop: '30px', color: '#202020', fontSize: '14px' } : { color: '#202020', fontSize: '14px' }}
                    >
                      {section.title}
                    </h2>
                    
                    {section.showCount && (
                      <span className="text-sm text-gray-400 hebrew-text">
                        {section.tasks.length}
                      </span>
                    )}
                  </div>
                  
                  {/* Reschedule button on far right */}
                  {section.showReschedule && (
                    <div className="flex-shrink-0">
                      <button 
                        onClick={handleRescheduleOverdue}
                        className="text-sm hover:bg-red-50 px-2 py-1 rounded transition-colors hebrew-text"
                        style={{ color: 'var(--color-reschedule-button)' }}
                      >
                        תזמון מחדש
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Clean Task List */}
            {!isCollapsed && (
              <div className="space-y-0">
                {section.tasks
                  .filter(task => !task.parent_task) // Only show main tasks, sub-tasks will be rendered within
                  .map((task, index) => {
                    // In inbox view, subtasks are expanded by default (inverted logic)
                    // In other views, subtasks are collapsed by default
                    const isTaskExpanded = currentView === 'inbox' 
                      ? collapsedTasks[task.id] !== false  // Expanded by default, only collapsed if explicitly set to false
                      : collapsedTasks[task.id] === true   // Collapsed by default, only expanded if explicitly set to true
                    
                    return (
                      <div key={task.id}>
                        <div className="relative task-line">
                          <Task 
                            task={task}
                            onToggle={() => onToggleTask(task.id)}
                            onEdit={() => onEditTask && onEditTask(task)}
                            onUpdateTask={onUpdateTask}
                            projects={projects}
                            teams={teams}
                            isOverdue={section.id === 'overdue'}
                            onOpenTaskDetail={onOpenTaskDetail}
                            currentView={currentView}
                            onToggleSubtasks={toggleTaskSubtasks}
                            isSubtasksExpanded={isTaskExpanded}
                          />
                        </div>
                        {/* Render sub-tasks if expanded */}
                        {task.subtasks && task.subtasks.length > 0 && isTaskExpanded && (
                          <div className="space-y-0 mr-8">
                            {task.subtasks.map((subtask) => {
                              // In inbox view, subtasks are expanded by default (inverted logic)
                              // In other views, subtasks are collapsed by default
                              const isSubtaskExpanded = currentView === 'inbox' 
                                ? collapsedTasks[subtask.id] !== false  // Expanded by default, only collapsed if explicitly set to false
                                : collapsedTasks[subtask.id] === true   // Collapsed by default, only expanded if explicitly set to true
                              
                              return (
                                <div key={subtask.id}>
                                  <div className="relative task-line">
                                    <Task
                                      task={subtask}
                                      onToggle={() => onToggleTask(subtask.id)}
                                      onEdit={() => onEditTask && onEditTask(subtask)}
                                      onUpdateTask={onUpdateTask}
                                      projects={projects}
                                      teams={teams}
                                      isOverdue={section.id === 'overdue'}
                                      onOpenTaskDetail={onOpenTaskDetail}
                                      isSubtask={true}
                                      currentView={currentView}
                                      onToggleSubtasks={toggleTaskSubtasks}
                                      isSubtasksExpanded={isSubtaskExpanded}
                                    />
                                  </div>
                                  {/* Render nested sub-tasks if they exist */}
                                  {subtask.subtasks && subtask.subtasks.length > 0 && isSubtaskExpanded && (
                                    <div className="space-y-0 mr-8">
                          {subtask.subtasks.map((nestedSubtask) => (
                            <div key={nestedSubtask.id || `${subtask.id}-nested-${Math.random()}` }>
                                          <div className="relative task-line">
                                            <Task
                                              task={nestedSubtask}
                                              onToggle={() => onToggleTask(nestedSubtask.id)}
                                              onEdit={() => onEditTask && onEditTask(nestedSubtask)}
                                              onUpdateTask={onUpdateTask}
                                              projects={projects}
                                              teams={teams}
                                              isOverdue={section.id === 'overdue'}
                                              onOpenTaskDetail={onOpenTaskDetail}
                                              isSubtask={true}
                                              currentView={currentView}
                                              onToggleSubtasks={toggleTaskSubtasks}
                                              isSubtasksExpanded={currentView === 'inbox' 
                                                ? collapsedTasks[nestedSubtask.id] !== false
                                                : collapsedTasks[nestedSubtask.id] === true}
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })
                }
              </div>
            )}
          </div>
        )
      })}

      {/* Task Creator */}
      <div className="">
        <TodoistTaskWrapper
          onCreateTask={onCreateTask}
          currentView={currentView}
          projects={projects}
          teams={teams}
          currentUser={currentUser}
        />
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 hebrew-text mb-2">
              אין משימות להציג
            </h3>
            <p className="text-gray-500 hebrew-text text-sm">
              השתמש בכפתור "הוסף משימה" למטה כדי ליצור את המשימה הראשונה שלך
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskList