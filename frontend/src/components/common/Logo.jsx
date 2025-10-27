import React from 'react'

// Displays the brand logo image from the public folder.
// Prefers PNG, with SVG fallback. Supports a light variant for dark backgrounds.
// Props:
// - size: small | default | large | xl
// - variant: 'color' | 'light' (monochrome white via CSS filter)
const Logo = ({ size = 'default', variant = 'color', className = '' }) => {
  const sizeClasses = {
    small: 'w-24',     // 96px
    default: 'w-40',   // 160px
    large: 'w-56',     // 224px
    xl: 'w-72',        // 288px
  }

  const widthClass = sizeClasses[size] || sizeClasses.default
  const variantClass = variant === 'light' ? 'filter invert brightness-0' : ''

  return (
    <picture>
      {/* Prefer PNG in /images for clarity; falls back to SVG */}
      <source srcSet="/images/logo.png" type="image/png" />
      <img
        src="/logo.svg"
        alt="SnaflesHub logo"
        className={`h-auto ${widthClass} ${variantClass} ${className}`}
        loading="eager"
        decoding="async"
      />
    </picture>
  )
}

export default Logo
