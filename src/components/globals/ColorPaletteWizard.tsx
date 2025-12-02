import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ColorPicker } from '@/components/ui/color-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useThemeStore } from '@/store/themeStore'
import {
  generatePalette,
  paletteToTokens,
  validateFamilyName,
  getDefaultPaletteConfig
} from '@/utils/paletteGenerator'
import type { PaletteConfig } from '@/types/globalTokens'
import { useToast } from '@/hooks/use-toast'

interface ColorPaletteWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ColorPaletteWizard({ open, onOpenChange }: ColorPaletteWizardProps) {
  const [config, setConfig] = useState<PaletteConfig>(getDefaultPaletteConfig())
  const [isCreating, setIsCreating] = useState(false)

  const { tokens, addColorFamily, navigateToColorFamily } = useThemeStore()
  const { toast } = useToast()

  // Get existing color families
  const existingFamilies = useMemo(() => {
    if (!tokens?.global?.colors) return []
    return Object.keys(tokens.global.colors)
  }, [tokens])

  // Generate palette preview
  const palette = useMemo(() => {
    return generatePalette(config)
  }, [config])

  // Validation
  const nameError = useMemo(() => {
    return validateFamilyName(config.familyName, existingFamilies)
  }, [config.familyName, existingFamilies])

  const isValid = !nameError && config.familyName.trim().length > 0

  const handleConfigChange = (updates: Partial<PaletteConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const handleCreate = async () => {
    if (!isValid) return

    setIsCreating(true)

    try {
      const paletteTokens = paletteToTokens(palette)
      await addColorFamily(config.familyName.toLowerCase(), paletteTokens)

      toast({ description: `Color family "${config.familyName}" created` })
      navigateToColorFamily(config.familyName.toLowerCase())
      handleClose()
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : 'Failed to create color family',
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setConfig(getDefaultPaletteConfig())
    onOpenChange(false)
  }

  // Calculate contrast for text color
  const getContrastColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 flex flex-col [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Create New Color Family</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!isValid || isCreating}>
              {isCreating ? 'Creating...' : 'Create Family'}
            </Button>
          </div>
        </div>

        {/* Content - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Config Panel - Left */}
          <div className="w-[350px] border-r p-6 space-y-6 overflow-y-auto">
            {/* Family Name */}
            <div className="space-y-2">
              <Label htmlFor="family-name">Family Name</Label>
              <Input
                id="family-name"
                placeholder="e.g., purple, gold, teal"
                value={config.familyName}
                onChange={(e) => handleConfigChange({ familyName: e.target.value })}
                className="font-mono"
              />
              {nameError && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
            </div>

            {/* Base Color */}
            <ColorPicker
              label="Base Color"
              value={config.baseColor}
              onChange={(value) => handleConfigChange({ baseColor: value })}
            />

            {/* Hue Shift */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Hue Shift</Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {config.hueShift > 0 ? '+' : ''}{config.hueShift}°
                </span>
              </div>
              <Slider
                value={[config.hueShift]}
                onValueChange={([value]) => handleConfigChange({ hueShift: value })}
                min={-30}
                max={30}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Shift hue gradually from light to dark tones
              </p>
            </div>

            {/* Easing */}
            <div className="space-y-2">
              <Label>Easing</Label>
              <Select
                value={config.easingType}
                onValueChange={(value: string) => handleConfigChange({ easingType: value as PaletteConfig['easingType'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="ease-in">Ease In</SelectItem>
                  <SelectItem value="ease-out">Ease Out</SelectItem>
                  <SelectItem value="ease-in-out">Ease In-Out</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Controls how hue shift is distributed across the palette
              </p>
            </div>

            {/* Info */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                The palette will generate 16 color steps following the Orbit naming convention:
                5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600
              </p>
            </div>
          </div>

          {/* Preview Panel - Right */}
          <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
            <div className="space-y-6">
              {/* Palette Strip */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Preview</h3>
                <div className="flex rounded-lg overflow-hidden h-20 shadow-sm border">
                  {palette.map(({ name, hex }) => (
                    <div
                      key={name}
                      className="flex-1 flex flex-col items-center justify-end pb-2"
                      style={{ backgroundColor: hex }}
                    >
                      <span
                        className="text-xs font-medium"
                        style={{ color: getContrastColor(hex) }}
                      >
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Grid */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Color Swatches</h3>
                <div className="grid grid-cols-8 gap-3">
                  {palette.map(({ name, hex }) => (
                    <div
                      key={name}
                      className="aspect-square rounded-lg shadow-sm border overflow-hidden"
                      style={{ backgroundColor: hex }}
                    >
                      <div
                        className="h-full flex flex-col items-center justify-center p-1"
                        style={{ color: getContrastColor(hex) }}
                      >
                        <div className="text-sm font-semibold">{name}</div>
                        <div className="text-[10px] opacity-80 font-mono">{hex}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Token List */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Generated Tokens</h3>
                <div className="bg-background rounded-lg border p-4 max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Step</th>
                        <th className="pb-2 font-medium">Hex</th>
                        <th className="pb-2 font-medium">Alias</th>
                      </tr>
                    </thead>
                    <tbody>
                      {palette.map(({ name, hex }) => (
                        <tr key={name} className="border-t border-border/50">
                          <td className="py-2 font-medium">{name}</td>
                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: hex }}
                              />
                              <code className="font-mono text-xs">{hex}</code>
                            </div>
                          </td>
                          <td className="py-2">
                            <code className="text-xs text-muted-foreground">
                              {config.familyName
                                ? `{colors.${config.familyName.toLowerCase()}.${name}}`
                                : `{colors.?.${name}}`}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
