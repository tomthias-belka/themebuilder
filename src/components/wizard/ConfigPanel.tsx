import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BasicTab } from './BasicTab'
import { AdvancedTab } from './AdvancedTab'
import type { WizardConfig } from '@/types/wizard'

interface ConfigPanelProps {
  config: WizardConfig
  onChange: (updates: Partial<WizardConfig>) => void
  activeTab: 'basic' | 'advanced'
  onTabChange: (tab: 'basic' | 'advanced') => void
  existingBrands: string[]
  error: string | null
}

export function ConfigPanel({
  config,
  onChange,
  activeTab,
  onTabChange,
  existingBrands,
  error,
}: ConfigPanelProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(v: string) => onTabChange(v as 'basic' | 'advanced')}
      className="flex flex-col h-full"
    >
      <div className="px-4 pt-4">
        <TabsList className="w-full">
          <TabsTrigger value="basic" className="flex-1">
            Basic
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex-1">
            Advanced
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="basic" className="flex-1 overflow-auto m-0 p-0">
        <BasicTab
          config={config}
          onChange={onChange}
          existingBrands={existingBrands}
          error={error}
        />
      </TabsContent>

      <TabsContent value="advanced" className="flex-1 overflow-auto m-0 p-0">
        <AdvancedTab config={config} onChange={onChange} />
      </TabsContent>
    </Tabs>
  )
}
