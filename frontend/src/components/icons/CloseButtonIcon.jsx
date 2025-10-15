import React from 'react';

function CloseButtonIcon({ className = "w-4 h-4", ...props }) {
  return (
    <svg 
      width="512" 
      height="512" 
      viewBox="0 0 64 64" 
      className={className}
      {...props}
    >
      <g>
        <path 
          d="M4.59 59.41a2 2 0 0 0 2.83 0L32 34.83l24.59 24.58a2 2 0 0 0 2.83-2.83L34.83 32 59.41 7.41a2 2 0 0 0-2.83-2.83L32 29.17 7.41 4.59a2 2 0 0 0-2.82 2.82L29.17 32 4.59 56.59a2 2 0 0 0 0 2.82z" 
          fill="#666666" 
          opacity="1" 
          data-original="#000000"
        />
      </g>
    </svg>
  );
}

export default CloseButtonIcon;
