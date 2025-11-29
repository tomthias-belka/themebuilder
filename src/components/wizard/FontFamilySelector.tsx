import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { useThemeStore } from '@/store/themeStore'

interface FontFamilySelectorProps {
  value: string
  onChange: (value: string) => void
}

export function FontFamilySelector({ value, onChange }: FontFamilySelectorProps) {
  const { tokens } = useThemeStore()

  // Extract font families from global.typography.fontFamily
  const fontFamilies = useMemo(() => {
    const typography = tokens?.global?.typography
    if (!typography || typeof typography !== 'object') {
      // Fallback defaults
      return ['Inter', 'Roboto', 'System']
    }

    const fontFamily = (typography as Record<string, unknown>).fontFamily
    if (!fontFamily || typeof fontFamily !== 'object') {
      return ['Inter', 'Roboto', 'System']
    }

    // Extract font names from the token structure
    const fonts: string[] = []
    for (const [key, val] of Object.entries(fontFamily)) {
      if (val && typeof val === 'object' && '$value' in val) {
        // Use the key as font name (capitalize first letter)
        fonts.push(key.charAt(0).toUpperCase() + key.slice(1))
      }
    }

    return fonts.length > 0 ? fonts : ['Inter', 'Roboto', 'System']
  }, [tokens])

  return (
    <div className="space-y-2">
      <Label className="text-xs">Font Family</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
      >
        {fontFamilies.map((font) => (
          <option key={font} value={font}>
            {font}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        Default font for theme components
      </p>
    </div>
  )
}
