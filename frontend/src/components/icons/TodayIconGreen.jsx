import React from 'react'
export default function TodayIconGreen({ size = 16, className = '' }) {
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
        className="w-full h-full text-green-500"
        aria-hidden="true"
        focusable="false"
      >
        {/* Green filled background */}
        <rect
          x="3.4"
          y="3.4"
          width="17.2"
          height="17.2"
          rx="2.8"
          fill="#10b981"
          opacity="1"
        />
        {/* Green outline */}
        <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.8" stroke="#10b981" strokeWidth="1.6" />
        {/* Top bar: white when filled */}
        <rect x="7.2" y="7.1" width="9.6" height="1.8" rx="0.9" fill="#ffffff" opacity="1" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className="text-white font-semibold leading-none"
          style={{ fontSize: `${numberFontSizePx}px`, transform: `translateY(${translateYPx}px)` }}
        >
          {day}
        </span>
      </div>
    </div>
  )
}
