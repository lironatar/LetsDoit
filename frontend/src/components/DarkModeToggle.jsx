import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useDarkMode } from '../contexts/DarkModeContext'

function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <button
      onClick={toggleDarkMode}
      className="flex items-center space-x-2 space-x-reverse p-2 rounded-lg hover:bg-secondary-hover transition-colors text-base hebrew-text"
      title={isDarkMode ? 'החלף למצב בהיר' : 'החלף למצב כהה'}
    >
      {isDarkMode ? (
        <>
          <SunIcon className="w-4 h-4 text-yellow-500" />
          <span className="text-primary">מצב בהיר</span>
        </>
      ) : (
        <>
          <MoonIcon className="w-4 h-4 text-gray-600" />
          <span className="text-primary">מצב כהה</span>
        </>
      )}
    </button>
  )
}

export default DarkModeToggle
