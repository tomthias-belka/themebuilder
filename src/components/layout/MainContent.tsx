import { useThemeStore } from '@/store/themeStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JsonEditor } from '@/components/editor/JsonEditor'
import { TokenTreeNav } from '@/components/editor/TokenTreeNav'

interface MainContentProps {
  onUploadTokens: () => void
  children?: React.ReactNode
}

export function MainContent({ onUploadTokens, children }: MainContentProps) {
  const { tokens, selectedBrand, isLoading, viewMode } = useThemeStore()

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // No tokens uploaded yet
  if (!tokens) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Get Started</h3>
          <p className="text-muted-foreground mb-4">
            Upload your orbit-tokens.json file to start managing your themes.
          </p>
          <Button onClick={onUploadTokens}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Token File
          </Button>
        </div>
      </div>
    )
  }

  // No brand selected
  if (!selectedBrand) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">Select a Theme</h3>
          <p className="text-muted-foreground">
            Choose a theme from the sidebar to start editing, or create a new one.
          </p>
        </div>
      </div>
    )
  }

  // Show JSON Editor
  if (viewMode === 'json') {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <JsonEditor />
      </div>
    )
  }

  // Show Table (token editor) with optional token tree nav
  return (
    <div className="flex-1 flex min-h-0">
      {/* Token Tree Navigation (collapsible) */}
      <TokenTreeNav />

      {/* Main Editor Area */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {children}
        </div>
      </ScrollArea>
    </div>
  )
}
