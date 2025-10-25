import React from 'react'
export default function CommentIcon({ size = 16, className = '', color = 'currentColor' }) {
  return (
    <div className={className} style={{ width: `${size}px`, height: `${size}px` }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{ color }}
        aria-hidden="true"
        focusable="false"
      >
        {/* Speech bubble with chat lines - optimized SVG */}
        <path
          d="M18 5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2V5z"
          fill="currentColor"
          fillOpacity="0.1"
        />
        <path
          d="M18 5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2V5z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Chat lines */}
        <rect x="5" y="7" width="10" height="1.5" rx="0.75" fill="currentColor" />
        <rect x="5" y="10" width="6" height="1.5" rx="0.75" fill="currentColor" />
      </svg>
    </div>
  )
}
