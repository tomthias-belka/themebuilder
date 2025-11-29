import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/store/themeStore'
import { Upload, Download, FileUp, Save } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ViewModeToggle } from '@/components/ui/view-mode-toggle'

interface HeaderProps {
  onUploadTokens: () => void
  onUploadSemanticBrand: () => void
}

export function Header({ onUploadTokens, onUploadSemanticBrand }: HeaderProps) {
  const { tokens, selectedBrand, exportSemanticBrand, hasUnsavedChanges, saveChanges, viewMode, setViewMode } = useThemeStore()

  const handleExport = () => {
    if (selectedBrand) {
      exportSemanticBrand(selectedBrand)
    }
  }

  const handleSave = async () => {
    try {
      await saveChanges()
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        {selectedBrand ? (
          <div>
            <h2 className="text-lg font-semibold">{selectedBrand}</h2>
            <p className="text-xs text-muted-foreground">Theme Editor</p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold">Welcome</h2>
            <p className="text-xs text-muted-foreground">Select or create a theme to start</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        {tokens && selectedBrand && (
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        )}

        {/* Save Button */}
        {hasUnsavedChanges && (
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        )}

        {/* Upload Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onUploadTokens}>
              <FileUp className="h-4 w-4 mr-2" />
              Upload orbit-tokens.json
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onUploadSemanticBrand} disabled={!tokens}>
              <FileUp className="h-4 w-4 mr-2" />
              Import semantic-brand.json
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export Button */}
        <Button
          variant="default"
          size="sm"
          onClick={handleExport}
          disabled={!tokens || !selectedBrand}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </header>
  )
}
