import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { ColorPreview } from '@/components/editor/ColorPreview'
import { useThemeStore } from '@/store/themeStore'
import {
  extractColorFamilies,
  getFamilySteps,
  getColorValue
} from '@/utils/colorVariantGenerator'
import type { ColorSelection } from '@/types/wizard'

interface ColorFamilyPickerProps {
  label: string
  value: ColorSelection
  onChange: (value: ColorSelection) => void
}

export function ColorFamilyPicker({ label, value, onChange }: ColorFamilyPickerProps) {
  const { tokens } = useThemeStore()

  const colorFamilies = useMemo(() => {
    if (!tokens) return []
    return extractColorFamilies(tokens)
  }, [tokens])

  const availableSteps = useMemo(() => {
    if (!tokens || !value.family) return []
    return getFamilySteps(tokens, value.family)
  }, [tokens, value.family])

  const currentColor = useMemo(() => {
    if (!tokens || !value.family || !value.step) return null
    return getColorValue(tokens, value.family, value.step)
  }, [tokens, value.family, value.step])

  const handleFamilyChange = (family: string) => {
    // When family changes, select a default step (70 or 80 or first available)
    const steps = tokens ? getFamilySteps(tokens, family) : []
    const defaultStep = steps.includes(70) ? 70 : steps.includes(80) ? 80 : steps[0] || 0
    onChange({ family, step: defaultStep })
  }

  const handleStepChange = (step: number) => {
    onChange({ ...value, step })
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        {/* Color preview */}
        <ColorPreview
          color={currentColor || 'transparent'}
          size="lg"
          className="shrink-0"
        />

        {/* Family select */}
        <select
          value={value.family}
          onChange={(e) => handleFamilyChange(e.target.value)}
          className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm capitalize"
        >
          <option value="">Select color...</option>
          {colorFamilies.map((family) => (
            <option key={family.name} value={family.name}>
              {family.name}
            </option>
          ))}
        </select>

        {/* Step select */}
        <select
          value={value.step || ''}
          onChange={(e) => handleStepChange(Number(e.target.value))}
          disabled={!value.family}
          className="w-24 h-10 px-3 rounded-md border border-input bg-background text-sm disabled:opacity-50"
        >
          <option value="">Step</option>
          {availableSteps.map((step) => (
            <option key={step} value={step}>
              {step}
            </option>
          ))}
        </select>
      </div>

      {/* Show selected color info */}
      {currentColor && (
        <div className="text-xs text-muted-foreground font-mono">
          {`{colors.${value.family}.${value.step}}`} → {currentColor}
        </div>
      )}
    </div>
  )
}
