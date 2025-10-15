import cssText from './sidebaricon.txt?raw'

export default function SidebarCssIcon({ size = 28, width, height, className = '' }) {
  // Support both PNG and SVG data URLs inside the provided CSS
  const match = typeof cssText === 'string'
    ? cssText.match(/url\((data:image\/(?:png|svg\+xml);base64,[^)]+)\)/)
    : null
  const dataUrl = match ? match[1] : ''

  return (
    <div
      className={className}
      style={{
        width: `${width ?? size}px`,
        height: `${height ?? size}px`,
        backgroundImage: `url(${dataUrl})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
        backgroundPosition: 'center'
      }}
      aria-hidden="true"
    />
  )
}


