import React from 'react';

function SendIcon({ className = "w-4 h-4", ...props }) {
  return (
    <svg 
      width="512" 
      height="512" 
      viewBox="0 0 24 24" 
      className={className}
      {...props}
    >
      <g transform="matrix(-1,0,0,1,23.9984611484909058,0)">
        <path 
          fill="#ffffff" 
          d="M22.101 10.562 2.753 1.123A1.219 1.219 0 0 0 1 2.22v.035a2 2 0 0 0 .06.485l1.856 7.424a.5.5 0 0 0 .43.375l8.157.907a.559.559 0 0 1 0 1.111l-8.157.907a.5.5 0 0 0-.43.375L1.06 21.261a2 2 0 0 0-.06.485v.035a1.219 1.219 0 0 0 1.753 1.096L22.1 13.438a1.6 1.6 0 0 0 0-2.876z" 
          opacity="1" 
          data-original="#000000"
        />
      </g>
    </svg>
  );
}

export default SendIcon;
