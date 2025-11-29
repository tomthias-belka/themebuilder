import { ThemePreviewProvider, usePreviewTheme } from './preview/ThemePreviewProvider'
import { PreviewCard } from './preview/PreviewCard'
import { PreviewForm } from './preview/PreviewForm'
import { PreviewTable } from './preview/PreviewTable'
import { PreviewStats } from './preview/PreviewStats'
import { PreviewChat } from './preview/PreviewChat'
import type { WizardConfig } from '@/types/wizard'

interface PreviewPanelProps {
  config: WizardConfig
}

function PreviewContent() {
  const { isValid } = usePreviewTheme()

  if (!isValid) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-center">
          Select colors to see the preview
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Row 1: Card + Form */}
      <div className="grid grid-cols-2 gap-4">
        <PreviewCard />
        <PreviewForm />
      </div>

      {/* Row 2: Table */}
      <PreviewTable />

      {/* Row 3: Stats + Chat */}
      <div className="grid grid-cols-2 gap-4">
        <PreviewStats />
        <PreviewChat />
      </div>
    </div>
  )
}

export function PreviewPanel({ config }: PreviewPanelProps) {
  return (
    <ThemePreviewProvider config={config}>
      <PreviewContent />
    </ThemePreviewProvider>
  )
}
