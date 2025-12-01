import { useState, type ReactNode } from 'react'
import { usePreviewTheme } from './ThemePreviewProvider'

interface PreviewButtonProps {
  variant: 'primary' | 'secondary' | 'outline'
  children: ReactNode
  disabled?: boolean
  className?: string
}

export function PreviewButton({ variant, children, disabled = false, className = '' }: PreviewButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const { theme } = usePreviewTheme()

  const getBackgroundColor = () => {
    if (disabled) {
      return variant === 'outline' ? 'transparent' : theme.primarySoft
    }
    if (variant === 'primary') {
      if (isPressed) return theme.primaryDark
      if (isHovered) return theme.primaryDark
      return theme.primary
    }
    if (variant === 'secondary') {
      if (isPressed) return theme.secondarySoft
      if (isHovered) return theme.secondarySoft
      return theme.secondary
    }
    // outline variant
    if (isPressed || isHovered) return theme.secondarySoft
    return 'transparent'
  }

  const getTextColor = () => {
    if (disabled) {
      return variant === 'outline' ? theme.secondary : 'white'
    }
    if (variant === 'primary' || variant === 'secondary') {
      return 'white'
    }
    return theme.secondary
  }

  const getBorderColor = () => {
    if (variant === 'outline') {
      if (disabled) return theme.secondarySoft
      return theme.secondary
    }
    return 'transparent'
  }

  return (
    <button
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false) }}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      disabled={disabled}
      className={`px-4 py-2 text-sm font-medium border ${className}`}
      style={{
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        borderColor: getBorderColor(),
        borderRadius: `var(--preview-radius, ${theme.radius})`,
        fontFamily: `var(--preview-font, ${theme.fontFamily})`,
        transform: isPressed && !disabled ? 'scale(0.98)' : 'scale(1)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 150ms ease',
      }}
    >
      {children}
    </button>
  )
}
