import { cn } from '@/lib/utils'

interface ColorPreviewProps {
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ColorPreview({ color, size = 'md', className }: ColorPreviewProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  // Check if it's a valid color (hex, rgb, rgba, or named color)
  const isValidColor = color && (
    color.startsWith('#') ||
    color.startsWith('rgb') ||
    color.startsWith('hsl') ||
    /^[a-zA-Z]+$/.test(color)
  )

  return (
    <div
      className={cn(
        'rounded border border-border shrink-0',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: isValidColor ? color : 'transparent',
        backgroundImage: !isValidColor
          ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
          : undefined,
        backgroundSize: !isValidColor ? '8px 8px' : undefined,
        backgroundPosition: !isValidColor ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
      }}
      title={color}
    />
  )
}
