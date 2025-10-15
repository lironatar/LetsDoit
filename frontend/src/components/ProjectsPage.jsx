import { useState, useMemo, useRef, useEffect } from 'react'
import { PlusIcon, ChevronDownIcon, Squares2X2Icon } from '@heroicons/react/24/outline'

function ProjectsPage({ projects = [], onOpenProjectModal, onSelectProject }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showArchivedOnly, setShowArchivedOnly] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const addRef = useRef(null)

  // Filter projects based on search term and archive status
  const filteredProjects = useMemo(() => {
    let filtered = projects

    // Filter by archive status
    if (showArchivedOnly) {
      filtered = filtered.filter(project => project.is_archived)
    } else {
      filtered = filtered.filter(project => !project.is_archived)
    }

    // Filter by search term (1+ characters)
    if (searchTerm.trim().length > 0) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [projects, searchTerm, showArchivedOnly])

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleArchiveToggle = (e) => {
    setShowArchivedOnly(e.target.checked)
  }

  // Close dropdown on outside click / escape
  useEffect(() => {
    const onClick = (e) => {
      if (!isAddOpen) return
      if (addRef.current && !addRef.current.contains(e.target)) {
        setIsAddOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setIsAddOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [isAddOpen])

  return (
    <div className="w-full" dir="rtl">
      {/* Search and actions bar */}
      <div className="mb-6">
        <div className="flex-1 max-w-3xl">
          <div className="relative">
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="חפש פרויקטים"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pr-10 pl-3 py-1 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 hebrew-text text-base"
            />
          </div>
          <div className="mt-3 flex items-center text-sm text-gray-600">
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={showArchivedOnly}
                onChange={handleArchiveToggle}
                className="ml-2" 
              />
              <span className="hebrew-text">פרויקטים בארכיון בלבד</span>
            </label>
          </div>

          {/* Add dropdown (moved under search area, left aligned) */}
          <div className="mt-3 relative inline-block" ref={addRef}>
            <button
              type="button"
              onClick={() => setIsAddOpen(prev => !prev)}
              className="flex items-center px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-base"
              style={{ height: '34px' }}
              aria-haspopup="menu"
              aria-expanded={isAddOpen}
            >
              <PlusIcon className="w-4 h-4" />
              <span className="mx-2 hebrew-text">הוסף</span>
              <ChevronDownIcon className="w-4 h-4" />
            </button>
            {isAddOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
                role="menu"
              >
                <button
                  className="w-full flex items-center px-3 py-2 hover:bg-gray-50 text-gray-800"
                  onClick={() => { setIsAddOpen(false); onOpenProjectModal && onOpenProjectModal() }}
                >
                  <span className="w-7 flex items-center justify-center">
                    <span className="hashtag-icon" />
                  </span>
                  <span className="hebrew-text text-base mr-2">הוסף פרויקט</span>
                </button>
                <button
                  className="w-full flex items-center px-3 py-2 hover:bg-gray-50 text-gray-800"
                  onClick={() => { setIsAddOpen(false); }}
                >
                  <span className="w-7 flex items-center justify-center">
                    <Squares2X2Icon className="w-4 h-4 text-gray-500" />
                  </span>
                  <span className="hebrew-text text-base mr-2">עיין בתבניות</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projects list */}
      <div className="mt-4">
        <div className="text-sm text-gray-500 hebrew-text mb-2">
          {filteredProjects?.length || 0} פרויקטים
        </div>
        {/* Thin separator line under count */}
        <div className="w-full h-px bg-gray-200 mb-3"></div>

        {/* Borderless list, subtle spacing between rows */}
        <div className="bg-white rounded-lg">
          {filteredProjects && filteredProjects.length > 0 ? (
            filteredProjects.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onSelectProject && onSelectProject(p.id)}
              >
                <div className="flex items-center">
                  <span className="sidebar-item-ml flex items-center justify-center w-7">
                    <span className="hashtag-icon" />
                  </span>
                  <span className="hebrew-text text-primary text-base">{p.name}</span>
                </div>
                {typeof p.tasks_count === 'number' && (
                  <span className="text-sm text-gray-500">{p.tasks_count} משימות</span>
                )}
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500 hebrew-text">
              {searchTerm.trim().length > 0 || showArchivedOnly ? 
                'לא נמצאו פרויקטים התואמים לחיפוש' : 
                'אין פרויקטים עדיין'
              }
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectsPage


