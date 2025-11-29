import { useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { ColorFamilyPicker } from './ColorFamilyPicker'
import { VariantPreview } from './VariantPreview'
import { RadiusSelector } from './RadiusSelector'
import { FontFamilySelector } from './FontFamilySelector'
import { useThemeStore } from '@/store/themeStore'
import {
  generatePrimaryVariants,
  generateSecondaryVariants,
  generateAccentVariants,
  isValidColorSelection,
} from '@/utils/colorVariantGenerator'
import type { WizardConfig } from '@/types/wizard'
import { cn } from '@/lib/utils'

interface BasicTabProps {
  config: WizardConfig
  onChange: (updates: Partial<WizardConfig>) => void
  existingBrands: string[]
  error: string | null
}

interface SectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  return (
    <div className="border-b last:border-b-0">
      <details open={defaultOpen} className="group">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 list-none">
          <span className="text-sm font-medium">{title}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4 space-y-4">{children}</div>
      </details>
    </div>
  )
}

export function BasicTab({ config, onChange, existingBrands, error }: BasicTabProps) {
  const { tokens } = useThemeStore()

  // Generate variants for preview
  const primaryVariants = useMemo(() => {
    if (!tokens || !isValidColorSelection(tokens, config.primaryColor)) return null
    return generatePrimaryVariants(config.primaryColor)
  }, [tokens, config.primaryColor])

  const secondaryVariants = useMemo(() => {
    if (!tokens || !isValidColorSelection(tokens, config.secondaryColor)) return null
    return generateSecondaryVariants(config.secondaryColor)
  }, [tokens, config.secondaryColor])

  const accentVariants = useMemo(() => {
    if (!tokens || !isValidColorSelection(tokens, config.accentColor)) return null
    return generateAccentVariants(config.accentColor)
  }, [tokens, config.accentColor])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '')
    onChange({ themeName: value })
  }

  const isDuplicateName = config.themeName && existingBrands.includes(config.themeName)

  return (
    <div className="flex flex-col">
      {/* Theme Info Section */}
      <Section title="Theme Info" defaultOpen={true}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="theme-name" className="text-xs">
              Theme Name
            </Label>
            <Input
              id="theme-name"
              value={config.themeName}
              onChange={handleNameChange}
              placeholder="e.g., mybrand"
              className={cn('font-mono h-9', isDuplicateName && 'border-destructive')}
            />
            {isDuplicateName && (
              <p className="text-xs text-destructive">This name already exists</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template" className="text-xs">
              Copy tokens from
            </Label>
            <select
              id="template"
              value={config.templateBrand}
              onChange={(e) => onChange({ templateBrand: e.target.value })}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Select template...</option>
              {existingBrands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* Colors Section */}
      <Section title="Colors" defaultOpen={true}>
        <div className="space-y-4">
          {/* Primary */}
          <div className="space-y-2">
            <ColorFamilyPicker
              label="Primary"
              value={config.primaryColor}
              onChange={(color) => onChange({ primaryColor: color })}
            />
            {primaryVariants && (
              <VariantPreview variants={primaryVariants} title="" />
            )}
          </div>

          {/* Secondary */}
          <div className="space-y-2">
            <ColorFamilyPicker
              label="Secondary"
              value={config.secondaryColor}
              onChange={(color) => onChange({ secondaryColor: color })}
            />
            {secondaryVariants && (
              <VariantPreview variants={secondaryVariants} title="" />
            )}
          </div>

          {/* Accent */}
          <div className="space-y-2">
            <ColorFamilyPicker
              label="Accent"
              value={config.accentColor}
              onChange={(color) => onChange({ accentColor: color })}
            />
            {accentVariants && (
              <VariantPreview variants={accentVariants} title="" />
            )}
          </div>
        </div>
      </Section>

      {/* Typography Section */}
      <Section title="Typography" defaultOpen={false}>
        <FontFamilySelector
          value={config.fontFamily}
          onChange={(font) => onChange({ fontFamily: font })}
        />
      </Section>

      {/* Radius Section */}
      <Section title="Radius" defaultOpen={false}>
        <RadiusSelector
          value={config.radius}
          onChange={(radius) => onChange({ radius })}
        />
      </Section>

      {/* Error display */}
      {error && (
        <div className="px-4 py-3 border-t">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}
    </div>
  )
}
