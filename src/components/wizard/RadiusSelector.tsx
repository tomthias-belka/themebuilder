import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { RadiusSize } from '@/types/wizard'

interface RadiusSelectorProps {
  value: RadiusSize
  onChange: (value: RadiusSize) => void
}

const radiusOptions: { value: RadiusSize; label: string; preview: string }[] = [
  { value: 'sm', label: 'Small', preview: '4px' },
  { value: 'md', label: 'Medium', preview: '8px' },
  { value: 'lg', label: 'Large', preview: '12px' },
  { value: 'xl', label: 'Extra Large', preview: '16px' },
]

export function RadiusSelector({ value, onChange }: RadiusSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-xs">Border Radius</Label>
      <div className="grid grid-cols-4 gap-2">
        {radiusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors',
              value === option.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/50'
            )}
          >
            {/* Visual preview of radius */}
            <div
              className="w-10 h-10 border-2 border-foreground/30 bg-muted"
              style={{
                borderRadius: option.preview,
              }}
            />
            <div className="text-center">
              <div className="text-xs font-medium">{option.label}</div>
              <div className="text-[10px] text-muted-foreground">{option.preview}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
