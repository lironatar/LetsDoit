import React from 'react'
export default function TodayIcon({ active = false, size = 28, className = '' }) {
  const day = new Date().getDate()
  // Calculate number font size and vertical offset proportionally to icon size
  const numberFontSizePx = Math.max(8, Math.round(size * 0.38))
  const translateYPx = Math.round(size * 0.11)
  return (
    <div className={`${className} relative`} style={{ width: `${size}px`, height: `${size}px` }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full ${active ? 'text-selected-icon' : 'text-gray-500 group-hover:text-selected-icon'}`}
        aria-hidden="true"
        focusable="false"
      >
        {/* Filled background that appears on hover/active */}
        <rect
          x="3.4"
          y="3.4"
          width="17.2"
          height="17.2"
          rx="2.8"
          fill="currentColor"
          className={`${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-150`}
        />
        {/* Outline (color matches currentColor) */}
        <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.8" stroke="currentColor" strokeWidth="1.6" />
        {/* Top bar: gray by default, white when filled */}
        <rect x="7.2" y="7.1" width="9.6" height="1.8" rx="0.9" fill="#9ca3af" className={`${active ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'} transition-opacity duration-150`} />
        <rect x="7.2" y="7.1" width="9.6" height="1.8" rx="0.9" fill="#ffffff" className={`${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-150`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className={`${active ? 'text-white' : 'text-gray-700 group-hover:text-white'} font-semibold leading-none`}
          style={{ fontSize: `${numberFontSizePx}px`, transform: `translateY(${translateYPx}px)` }}
        >
          {day}
        </span>
      </div>
    </div>
  )
}


