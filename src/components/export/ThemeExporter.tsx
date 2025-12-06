import React, { useState, useMemo } from 'react'
import { useThemeStore } from '@/store/themeStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Download,
  FileJson,
  Package,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react'
import {
  type ExportOptions,
  type ExportResult,
  downloadFiles,
  downloadAsZip,
  DEFAULT_TEXT_STYLE_PROPERTIES,
  validateExportOptions,
} from '@/utils/themeExporter'

interface ThemeExporterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ExportFormat = 'complete' | 'per-brand'

export function ThemeExporter({ open, onOpenChange }: ThemeExporterProps) {
  const { tokens, exportAdvanced, getAvailableBrands } = useThemeStore()

  // Export state
  const [format, setFormat] = useState<ExportFormat>('complete')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [includeTextStyles, setIncludeTextStyles] = useState(true)
  const [textStyleProperties, setTextStyleProperties] = useState<string[]>(
    DEFAULT_TEXT_STYLE_PROPERTIES
  )
  const [includeGlobal, setIncludeGlobal] = useState(false)

  // UI state
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [downloadMode, setDownloadMode] = useState<'individual' | 'zip'>('individual')

  // Get available brands from store
  const availableBrands = useMemo(() => {
    return getAvailableBrands()
  }, [getAvailableBrands, tokens])

  // Initialize selected brands when dialog opens
  React.useEffect(() => {
    if (open && availableBrands.length > 0 && selectedBrands.length === 0) {
      setSelectedBrands([availableBrands[0]])
    }
  }, [open, availableBrands, selectedBrands.length])

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setExportResult(null)
      setIsExporting(false)
    }
  }, [open])

  // Handle brand selection
  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    )
  }

  // Handle select all brands
  const handleSelectAllBrands = () => {
    if (selectedBrands.length === availableBrands.length) {
      setSelectedBrands([])
    } else {
      setSelectedBrands([...availableBrands])
    }
  }

  // Handle text style property toggle
  const handlePropertyToggle = (property: string) => {
    setTextStyleProperties(prev =>
      prev.includes(property)
        ? prev.filter(p => p !== property)
        : [...prev, property]
    )
  }

  // Build export options
  const buildExportOptions = (): ExportOptions => ({
    format,
    brands: format === 'per-brand' ? selectedBrands : [],
    includeTextStyles,
    textStyleProperties: includeTextStyles ? textStyleProperties : [],
    includeGlobal: format === 'per-brand' ? includeGlobal : true,
  })

  // Validate current options
  const validation = useMemo(() => {
    return validateExportOptions(buildExportOptions())
  }, [format, selectedBrands, includeTextStyles, textStyleProperties])

  // Handle export - uses store action, then handles download based on mode
  const handleExport = async () => {
    if (!tokens) return

    setIsExporting(true)
    setExportResult(null)

    try {
      const options = buildExportOptions()
      // Store action returns result only (no auto-download)
      const result = exportAdvanced(options)

      setExportResult(result)

      // Handle download based on mode
      if (result.success && result.files.length > 0) {
        if (result.files.length > 1 && downloadMode === 'zip') {
          const zipSuccess = await downloadAsZip(result.files)
          if (!zipSuccess) {
            // Fallback - downloadAsZip already downloads individual files
            setExportResult({
              ...result,
              message: result.message + ' (Downloaded as individual files - JSZip not available)'
            })
          }
        } else {
          // Single file or individual download mode
          downloadFiles(result.files)
        }
      }
    } catch (error) {
      setExportResult({
        success: false,
        message: `Export error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        files: []
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Render export preview
  const renderPreview = () => {
    if (format === 'complete') {
      return (
        <div className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <FileJson className="h-4 w-4 text-primary" />
            <span className="font-medium">orbit-tokens.json</span>
          </div>
          <p className="text-muted-foreground text-xs">
            Complete W3C Design Tokens file with all brands and global tokens
          </p>
        </div>
      )
    }

    return (
      <div className="text-sm space-y-2">
        <p className="text-muted-foreground text-xs mb-2">
          {selectedBrands.length} file{selectedBrands.length !== 1 ? 's' : ''} will be exported:
        </p>
        <div className="space-y-1">
          {selectedBrands.map(brand => (
            <div key={brand} className="flex items-center gap-2">
              <FileJson className="h-4 w-4 text-primary" />
              <span className="font-mono text-xs">{brand}-semantic.tokens.json</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Tokens
          </DialogTitle>
          <DialogDescription>
            Export design tokens in W3C Design Token format
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Export Format Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Export Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complete">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>Complete W3C JSON</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="per-brand">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      <span>Per-Brand Semantic</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {format === 'complete'
                  ? 'Exports all tokens with all brand values in a single file'
                  : 'Exports semantic tokens with resolved values for each selected brand'}
              </p>
            </div>

            <Separator />

            {/* Brand Selection (Per-Brand only) */}
            {format === 'per-brand' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Select Brands</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllBrands}
                    className="text-xs h-7"
                  >
                    {selectedBrands.length === availableBrands.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {availableBrands.map(brand => (
                    <div key={brand} className="flex items-center space-x-2">
                      <Checkbox
                        id={`brand-${brand}`}
                        checked={selectedBrands.includes(brand)}
                        onCheckedChange={() => handleBrandToggle(brand)}
                      />
                      <Label
                        htmlFor={`brand-${brand}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {brand}
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Include Global option */}
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="include-global"
                    checked={includeGlobal}
                    onCheckedChange={(checked) => setIncludeGlobal(checked === true)}
                  />
                  <Label htmlFor="include-global" className="text-sm font-normal cursor-pointer">
                    Include global tokens
                  </Label>
                </div>

                <Separator />
              </div>
            )}

            {/* Text Styles Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-text-styles"
                  checked={includeTextStyles}
                  onCheckedChange={(checked) => setIncludeTextStyles(checked === true)}
                />
                <Label htmlFor="include-text-styles" className="text-sm font-medium cursor-pointer">
                  Include Text Styles
                </Label>
              </div>

              {includeTextStyles && (
                <div className="pl-6 space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Select properties to include:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_TEXT_STYLE_PROPERTIES.map(prop => (
                      <Badge
                        key={prop}
                        variant={textStyleProperties.includes(prop) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handlePropertyToggle(prop)}
                      >
                        {textStyleProperties.includes(prop) && (
                          <Check className="h-3 w-3 mr-1" />
                        )}
                        {prop}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Download Mode (for multiple files) */}
            {format === 'per-brand' && selectedBrands.length > 1 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Download Mode</Label>
                  <Select
                    value={downloadMode}
                    onValueChange={(v) => setDownloadMode(v as 'individual' | 'zip')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual Files</SelectItem>
                      <SelectItem value="zip">ZIP Archive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Separator />

            {/* Export Preview */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Export Preview</Label>
              <div className="p-3 bg-muted rounded-lg">
                {renderPreview()}
              </div>
            </div>

            {/* Validation Errors */}
            {!validation.valid && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="space-y-1">
                    {validation.errors.map((error, idx) => (
                      <p key={idx} className="text-sm text-destructive">{error}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Export Result */}
            {exportResult && (
              <div
                className={`p-3 rounded-lg ${
                  exportResult.success
                    ? 'bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-900'
                    : 'bg-destructive/10 border border-destructive/20'
                }`}
              >
                <div className="flex items-start gap-2">
                  {exportResult.success ? (
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                  )}
                  <p className={`text-sm ${exportResult.success ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}>
                    {exportResult.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!tokens || !validation.valid || isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
