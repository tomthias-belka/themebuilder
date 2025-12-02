import { useMemo } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Copy, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { SingleValueToken } from '@/types/tokens'

interface ColorFamilyViewProps {
  familyName: string
  onBack: () => void
}

// Orbit color steps in order
const ORBIT_STEPS_ORDER = ['5', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100', '200', '300', '400', '500', '600']

export function ColorFamilyView({ familyName, onBack }: ColorFamilyViewProps) {
  const { tokens, deleteColorFamily } = useThemeStore()
  const { toast } = useToast()

  const colorSteps = useMemo(() => {
    const family = tokens?.global?.colors?.[familyName] as Record<string, SingleValueToken> | undefined
    if (!family) return []

    // Sort by the defined order
    return ORBIT_STEPS_ORDER
      .filter(step => family[step])
      .map(step => ({
        step,
        hex: family[step].$value,
        alias: `{colors.${familyName}.${step}}`
      }))
  }, [tokens, familyName])

  const handleCopyAlias = (alias: string) => {
    navigator.clipboard.writeText(alias)
    toast({ description: 'Alias copied to clipboard' })
  }

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex)
    toast({ description: 'Hex color copied to clipboard' })
  }

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the "${familyName}" color family?`)) {
      try {
        await deleteColorFamily(familyName)
        toast({ description: `Color family "${familyName}" deleted` })
      } catch (error) {
        toast({
          description: 'Failed to delete color family',
          variant: 'destructive'
        })
      }
    }
  }

  // Calculate contrast for text color
  const getContrastColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  if (colorSteps.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-semibold capitalize">{familyName}</h2>
        </div>
        <p className="text-muted-foreground">No colors found in this family.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold capitalize">{familyName}</h2>
            <p className="text-sm text-muted-foreground">{colorSteps.length} color steps</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Family
        </Button>
      </div>

      {/* Color Strip - Visual Preview */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Preview</h3>
        <div className="flex rounded-lg overflow-hidden h-24 shadow-sm border">
          {colorSteps.map(({ step, hex }) => (
            <div
              key={step}
              className="flex-1 flex flex-col items-center justify-end pb-2 cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: hex }}
              onClick={() => handleCopyHex(hex)}
              title={`Click to copy ${hex}`}
            >
              <span
                className="text-xs font-medium"
                style={{ color: getContrastColor(hex) }}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Color Grid - Two rows for better visibility */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Color Swatches</h3>
        <div className="grid grid-cols-8 gap-3">
          {colorSteps.map(({ step, hex }) => (
            <div
              key={step}
              className="group relative aspect-square rounded-lg shadow-sm border overflow-hidden cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: hex }}
              onClick={() => handleCopyHex(hex)}
            >
              <div
                className="absolute inset-x-0 bottom-0 p-2 text-center"
                style={{ color: getContrastColor(hex) }}
              >
                <div className="text-sm font-semibold">{step}</div>
                <div className="text-xs opacity-80 font-mono">{hex}</div>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Copy className="h-5 w-5 opacity-0 group-hover:opacity-70 transition-opacity" style={{ color: getContrastColor(hex) }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Token Table */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Token Reference</h3>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Step</TableHead>
                <TableHead className="w-[60px]">Color</TableHead>
                <TableHead className="w-[120px]">Hex</TableHead>
                <TableHead>Alias</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colorSteps.map(({ step, hex, alias }) => (
                <TableRow key={step}>
                  <TableCell className="font-medium">{step}</TableCell>
                  <TableCell>
                    <div
                      className="w-8 h-8 rounded border shadow-sm"
                      style={{ backgroundColor: hex }}
                    />
                  </TableCell>
                  <TableCell>
                    <code className="text-sm font-mono">{hex}</code>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm text-muted-foreground">{alias}</code>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopyHex(hex)}
                        title="Copy hex"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopyAlias(alias)}
                        title="Copy alias"
                      >
                        <span className="text-xs font-mono">{'{}'}</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
