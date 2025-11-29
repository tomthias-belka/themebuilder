import { useMemo } from 'react'
import { ColorPreview } from '@/components/editor/ColorPreview'
import { useThemeStore } from '@/store/themeStore'
import { resolveTokenValue } from '@/utils/tokenResolver'
import {
  generatePrimaryVariants,
  generateSecondaryVariants,
  generateAccentVariants
} from '@/utils/colorVariantGenerator'
import type { WizardData } from '@/types/wizard'

interface WizardStep3Props {
  data: WizardData
}

interface ColorSwatchProps {
  label: string
  alias: string
  resolvedColor: string
}

function ColorSwatch({ label, alias, resolvedColor }: ColorSwatchProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
      <ColorPreview color={resolvedColor} size="md" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{label}</div>
        <div className="text-xs text-muted-foreground font-mono truncate">
          {alias.replace('{colors.', '').replace('}', '')}
        </div>
      </div>
    </div>
  )
}

export function WizardStep3({ data }: WizardStep3Props) {
  const { tokens } = useThemeStore()

  // Get any existing brand for resolving colors
  const resolveBrand = tokens ? Object.keys(tokens.semantic?.brand?.primary?.main?.$value || {})[0] : null

  const resolveColor = (alias: string): string => {
    if (!tokens || !resolveBrand) return '#cccccc'
    const resolved = resolveTokenValue(alias, tokens, resolveBrand)
    return resolved || '#cccccc'
  }

  // Generate all variants
  const primaryVariants = useMemo(() => {
    return generatePrimaryVariants(data.primaryColor)
  }, [data.primaryColor])

  const secondaryVariants = useMemo(() => {
    return generateSecondaryVariants(data.secondaryColor)
  }, [data.secondaryColor])

  const accentVariants = useMemo(() => {
    return generateAccentVariants(data.accentColor)
  }, [data.accentColor])

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Theme Name</span>
          <span className="text-sm font-medium font-mono">{data.themeName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Template</span>
          <span className="text-sm font-medium">{data.templateBrand}</span>
        </div>
      </div>

      {/* Color Grid */}
      <div className="space-y-4">
        {/* Primary */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Primary</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(primaryVariants).map(([name, alias]) => (
              <ColorSwatch
                key={name}
                label={name}
                alias={alias}
                resolvedColor={resolveColor(alias)}
              />
            ))}
          </div>
        </div>

        {/* Secondary */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Secondary</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(secondaryVariants).map(([name, alias]) => (
              <ColorSwatch
                key={name}
                label={name}
                alias={alias}
                resolvedColor={resolveColor(alias)}
              />
            ))}
          </div>
        </div>

        {/* Accent */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Accent</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(accentVariants).map(([name, alias]) => (
              <ColorSwatch
                key={name}
                label={name}
                alias={alias}
                resolvedColor={resolveColor(alias)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Info note */}
      <p className="text-xs text-muted-foreground text-center">
        All other tokens (radius, typography, etc.) will be copied from "{data.templateBrand}"
      </p>
    </div>
  )
}
