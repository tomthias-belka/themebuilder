import { BasicTab } from './BasicTab'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { WizardConfig } from '@/types/wizard'

interface ConfigPanelProps {
  config: WizardConfig
  onChange: (updates: Partial<WizardConfig>) => void
  existingBrands: string[]
  error: string | null
}

export function ConfigPanel({
  config,
  onChange,
  existingBrands,
  error,
}: ConfigPanelProps) {
  return (
    <ScrollArea className="flex-1">
      <BasicTab
        config={config}
        onChange={onChange}
        existingBrands={existingBrands}
        error={error}
      />
    </ScrollArea>
  )
}
