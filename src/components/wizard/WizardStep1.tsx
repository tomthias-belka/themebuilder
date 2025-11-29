import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { extractBrandNames } from '@/utils/tokenFlattener'
import type { WizardData } from '@/types/wizard'

interface WizardStep1Props {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
  error: string | null
  setError: (error: string | null) => void
}

export function WizardStep1({ data, onChange, error, setError }: WizardStep1Props) {
  const { tokens } = useThemeStore()

  const existingBrands = useMemo(() => {
    if (!tokens) return []
    return extractBrandNames(tokens)
  }, [tokens])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '')
    onChange({ themeName: value })

    // Clear error when typing
    if (error) setError(null)

    // Validate
    if (value && existingBrands.includes(value)) {
      setError('A theme with this name already exists')
    }
  }

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ templateBrand: e.target.value })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="theme-name">Theme Name</Label>
        <Input
          id="theme-name"
          value={data.themeName}
          onChange={handleNameChange}
          placeholder="e.g., newbrand"
          className="font-mono"
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          Use lowercase letters, numbers, hyphens, or underscores only
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="template-brand">Copy non-color tokens from</Label>
        <select
          id="template-brand"
          value={data.templateBrand}
          onChange={handleTemplateChange}
          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="">Select a template theme...</option>
          {existingBrands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Radius, typography, and other non-color tokens will be copied from this theme
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  )
}
