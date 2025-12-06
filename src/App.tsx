import { useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import { useThemeStore } from '@/store/themeStore'
import { AppLayout } from '@/components/layout'
import { TokenEditor } from '@/components/editor'
import {
  UploadTokensModal,
  ImportSemanticModal,
  DeleteThemeModal,
} from '@/components/modals'
import { ThemeExporter } from '@/components/export'
import { ThemeBuilderWizard } from '@/components/wizard'
import { ColorPaletteWizard } from '@/components/globals/ColorPaletteWizard'
import { PasswordGate } from '@/components/auth/PasswordGate'

function App() {
  const { toast } = useToast()
  const { initialize, isInitialized } = useThemeStore()

  // Modal states
  const [uploadTokensOpen, setUploadTokensOpen] = useState(false)
  const [importSemanticOpen, setImportSemanticOpen] = useState(false)
  const [themeWizardOpen, setThemeWizardOpen] = useState(false)
  const [deleteThemeOpen, setDeleteThemeOpen] = useState(false)
  const [themeToDelete, setThemeToDelete] = useState<string>('')
  const [colorPaletteWizardOpen, setColorPaletteWizardOpen] = useState(false)
  const [exporterOpen, setExporterOpen] = useState(false)

  // Initialize store on mount
  useEffect(() => {
    initialize().catch((error) => {
      console.error('Failed to initialize:', error)
      toast({
        title: 'Error',
        description: 'Failed to load saved data',
        variant: 'destructive',
      })
    })
  }, [initialize, toast])

  const handleDeleteTheme = (brandName: string) => {
    setThemeToDelete(brandName)
    setDeleteThemeOpen(true)
  }

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <PasswordGate>
      <AppLayout
        onUploadTokens={() => setUploadTokensOpen(true)}
        onUploadSemanticBrand={() => setImportSemanticOpen(true)}
        onAddTheme={() => setThemeWizardOpen(true)}
        onDeleteTheme={handleDeleteTheme}
        onAddColorFamily={() => setColorPaletteWizardOpen(true)}
        onOpenExporter={() => setExporterOpen(true)}
      >
        <TokenEditor />
      </AppLayout>

      {/* Modals */}
      <UploadTokensModal
        open={uploadTokensOpen}
        onOpenChange={setUploadTokensOpen}
      />
      <ImportSemanticModal
        open={importSemanticOpen}
        onOpenChange={setImportSemanticOpen}
      />
      <ThemeBuilderWizard
        open={themeWizardOpen}
        onOpenChange={setThemeWizardOpen}
      />
      <DeleteThemeModal
        open={deleteThemeOpen}
        onOpenChange={setDeleteThemeOpen}
        brandName={themeToDelete}
      />
      <ColorPaletteWizard
        open={colorPaletteWizardOpen}
        onOpenChange={setColorPaletteWizardOpen}
      />
      <ThemeExporter
        open={exporterOpen}
        onOpenChange={setExporterOpen}
      />

      <Toaster />
    </PasswordGate>
  )
}

export default App
