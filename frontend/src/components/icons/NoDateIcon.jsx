import React from 'react'
function NoDateIcon({ className = "w-5 h-5" }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 32 32" 
      fill="currentColor"
    >
      <g>
        <path 
          d="M16 1a15 15 0 1 0 15 15A15 15 0 0 0 16 1zm0 2a12.91 12.91 0 0 1 8.47 3.16L6.09 24.39A13 13 0 0 1 16 3zm0 26a12.93 12.93 0 0 1-8.5-3.19L25.88 7.57A13 13 0 0 1 16 29z" 
          fill="#808080"
          opacity="1"
        />
      </g>
    </svg>
  )
}

export default NoDateIcon
