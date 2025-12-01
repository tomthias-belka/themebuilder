import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ConfigPanel } from './ConfigPanel'
import { PreviewPanel } from './PreviewPanel'
import { useThemeStore } from '@/store/themeStore'
import { extractBrandNames } from '@/utils/tokenFlattener'
import {
  generateAllBrandColors,
  isValidColorSelection,
} from '@/utils/colorVariantGenerator'
import type { WizardConfig, ColorSelection } from '@/types/wizard'

interface ThemeBuilderWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const initialColorSelection: ColorSelection = { family: '', step: 0 }

const getInitialConfig = (): WizardConfig => ({
  themeName: '',
  templateBrand: '',
  primaryColor: { ...initialColorSelection },
  secondaryColor: { ...initialColorSelection },
  accentColor: { ...initialColorSelection },
  fontFamily: 'Inter',
  radius: 'md',
})

export function ThemeBuilderWizard({ open, onOpenChange }: ThemeBuilderWizardProps) {
  const [config, setConfig] = useState<WizardConfig>(getInitialConfig())
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { tokens, addBrandWithColors } = useThemeStore()

  const existingBrands = useMemo(() => {
    if (!tokens) return []
    return extractBrandNames(tokens)
  }, [tokens])

  // Validation
  const isValid = useMemo(() => {
    if (!config.themeName || config.themeName.length < 2) return false
    if (existingBrands.includes(config.themeName)) return false
    if (!config.templateBrand) return false
    if (!tokens) return false
    if (!isValidColorSelection(tokens, config.primaryColor)) return false
    if (!isValidColorSelection(tokens, config.secondaryColor)) return false
    if (!isValidColorSelection(tokens, config.accentColor)) return false
    return true
  }, [config, existingBrands, tokens])

  const handleConfigChange = (updates: Partial<WizardConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
    if (error) setError(null)
  }

  const handleCreate = async () => {
    if (!isValid) return

    setIsCreating(true)
    setError(null)

    try {
      const brandColors = generateAllBrandColors(
        config.primaryColor,
        config.secondaryColor,
        config.accentColor
      )

      await addBrandWithColors(
        config.themeName,
        config.templateBrand,
        brandColors,
        config.radius
      )

      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create theme')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setConfig(getInitialConfig())
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[85vh] p-0 gap-0 flex flex-col [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Create New Theme</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!isValid || isCreating}>
              {isCreating ? 'Creating...' : 'Create Theme'}
            </Button>
          </div>
        </div>

        {/* Content - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Config Panel - Left */}
          <div className="w-[400px] border-r flex flex-col overflow-hidden">
            <ConfigPanel
              config={config}
              onChange={handleConfigChange}
              existingBrands={existingBrands}
              error={error}
            />
          </div>

          {/* Preview Panel - Right */}
          <div className="flex-1 overflow-auto bg-muted/30">
            <PreviewPanel config={config} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
