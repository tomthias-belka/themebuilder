import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/themeStore'
import type { RadiusSize } from '@/types/wizard'

interface RadiusSelectorProps {
  value: RadiusSize
  onChange: (value: RadiusSize) => void
}

interface RadiusOption {
  value: string
  label: string
  pixels: number
}

export function RadiusSelector({ value, onChange }: RadiusSelectorProps) {
  const { tokens } = useThemeStore()

  const radiusOptions = useMemo((): RadiusOption[] => {
    if (!tokens?.global?.radius) return []

    return Object.entries(tokens.global.radius)
      .map(([key, val]) => {
        const tokenVal = val as { $value: number | string; $type: string }
        const pixels = typeof tokenVal.$value === 'number' ? tokenVal.$value : 9999
        return {
          value: key,
          label: key,
          pixels,
        }
      })
      .sort((a, b) => a.pixels - b.pixels)
  }, [tokens])

  // Fallback if no tokens loaded
  if (radiusOptions.length === 0) {
    return (
      <div className="space-y-3">
        <Label className="text-xs">Border Radius</Label>
        <div className="text-sm text-muted-foreground">Loading radius options...</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Label className="text-xs">Border Radius</Label>
      <div className="grid grid-cols-4 gap-2">
        {radiusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-colors',
              value === option.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/50'
            )}
          >
            {/* Visual preview of radius */}
            <div
              className="w-8 h-8 border-2 border-foreground/30 bg-muted"
              style={{
                borderRadius: option.pixels === 9999 ? '50%' : `${option.pixels}px`,
              }}
            />
            <div className="text-center">
              <div className="text-[10px] font-medium">{option.label}</div>
              <div className="text-[9px] text-muted-foreground">
                {option.pixels === 9999 ? '∞' : `${option.pixels}px`}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
