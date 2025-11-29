import { Button } from '@/components/ui/button'
import { Table2, Code2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ViewModeToggleProps {
  value: 'table' | 'json'
  onChange: (value: 'table' | 'json') => void
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center border rounded-md">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'rounded-r-none border-r h-8 px-3',
          value === 'table' && 'bg-muted'
        )}
        onClick={() => onChange('table')}
      >
        <Table2 className="h-4 w-4 mr-1.5" />
        Table
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'rounded-l-none h-8 px-3',
          value === 'json' && 'bg-muted'
        )}
        onClick={() => onChange('json')}
      >
        <Code2 className="h-4 w-4 mr-1.5" />
        JSON
      </Button>
    </div>
  )
}
