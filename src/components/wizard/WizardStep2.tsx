import { useMemo } from 'react'
import { ColorFamilyPicker } from './ColorFamilyPicker'
import { VariantPreview } from './VariantPreview'
import { useThemeStore } from '@/store/themeStore'
import {
  generatePrimaryVariants,
  generateSecondaryVariants,
  generateAccentVariants,
  isValidColorSelection
} from '@/utils/colorVariantGenerator'
import type { WizardData, ColorSelection } from '@/types/wizard'

interface WizardStep2Props {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
}

export function WizardStep2({ data, onChange }: WizardStep2Props) {
  const { tokens } = useThemeStore()

  // Generate variants for preview
  const primaryVariants = useMemo(() => {
    if (!tokens || !isValidColorSelection(tokens, data.primaryColor)) return null
    return generatePrimaryVariants(data.primaryColor)
  }, [tokens, data.primaryColor])

  const secondaryVariants = useMemo(() => {
    if (!tokens || !isValidColorSelection(tokens, data.secondaryColor)) return null
    return generateSecondaryVariants(data.secondaryColor)
  }, [tokens, data.secondaryColor])

  const accentVariants = useMemo(() => {
    if (!tokens || !isValidColorSelection(tokens, data.accentColor)) return null
    return generateAccentVariants(data.accentColor)
  }, [tokens, data.accentColor])

  const handlePrimaryChange = (color: ColorSelection) => {
    onChange({ primaryColor: color })
  }

  const handleSecondaryChange = (color: ColorSelection) => {
    onChange({ secondaryColor: color })
  }

  const handleAccentChange = (color: ColorSelection) => {
    onChange({ accentColor: color })
  }

  return (
    <div className="space-y-8">
      {/* Primary Color */}
      <div className="space-y-3">
        <ColorFamilyPicker
          label="Primary Color"
          value={data.primaryColor}
          onChange={handlePrimaryChange}
        />
        {primaryVariants && (
          <VariantPreview variants={primaryVariants} title="Generated variants" />
        )}
      </div>

      <div className="border-t" />

      {/* Secondary Color */}
      <div className="space-y-3">
        <ColorFamilyPicker
          label="Secondary Color"
          value={data.secondaryColor}
          onChange={handleSecondaryChange}
        />
        {secondaryVariants && (
          <VariantPreview variants={secondaryVariants} title="Generated variants" />
        )}
      </div>

      <div className="border-t" />

      {/* Accent Color */}
      <div className="space-y-3">
        <ColorFamilyPicker
          label="Accent Color"
          value={data.accentColor}
          onChange={handleAccentChange}
        />
        {accentVariants && (
          <VariantPreview variants={accentVariants} title="Generated variants" />
        )}
      </div>
    </div>
  )
}
