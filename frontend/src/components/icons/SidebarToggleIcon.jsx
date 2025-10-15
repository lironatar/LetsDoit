export default function SidebarToggleIcon({ isOpen = true, size = 24, className = '', onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`${className} p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center`}
      title={isOpen ? "הסתר סרגל צד" : "הצג סרגל צד"}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-gray-600 hover:text-gray-800"
        aria-hidden="true"
        focusable="false"
      >
        {isOpen ? (
          // Close/Hide sidebar icon - X or left arrow
          <>
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          // Open/Show sidebar icon - Hamburger menu
          <>
            <path
              d="M3 12h18M3 6h18M3 18h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </svg>
    </button>
  )
}
