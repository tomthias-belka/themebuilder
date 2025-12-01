import { useMemo, useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { groupTokensByCategory } from '@/utils/tokenFlattener'
import { ValuePicker } from './ValuePicker'
import {
  ResizableTable,
  ResizableTableRow,
  ResizableTableCell,
} from '@/components/ui/resizable-table'
import { Badge } from '@/components/ui/badge'
import type { FlattenedToken } from '@/types/tokens'

const TABLE_COLUMNS = [
  { key: 'token', header: 'Token', defaultWidth: 280, minWidth: 150 },
  { key: 'value', header: 'Value', defaultWidth: 320, minWidth: 200 },
  { key: 'type', header: 'Type', defaultWidth: 100, minWidth: 80 },
]

export function TokenEditor() {
  const { tokens, selectedBrand, flattenedTokens, updateToken, selectedTokenPath } = useThemeStore()

  // Group tokens by category
  const groupedTokens = useMemo(() => {
    return groupTokensByCategory(flattenedTokens)
  }, [flattenedTokens])

  // Scroll to selected token when selectedTokenPath changes
  useEffect(() => {
    if (selectedTokenPath) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.getElementById(`token-${selectedTokenPath}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Add highlight effect
          element.classList.add('bg-accent')
          setTimeout(() => {
            element.classList.remove('bg-accent')
          }, 1500)
        }
      }, 100)
    }
  }, [selectedTokenPath])

  if (!tokens || !selectedBrand) {
    return null
  }

  // Define category order
  const categoryOrder = ['brand', 'colors', 'other']

  return (
    <div className="space-y-8">
      {categoryOrder.map((category) => {
        const subcategories = groupedTokens.get(category)
        if (!subcategories || subcategories.size === 0) return null

        return (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-4 capitalize">{category}</h3>

            {Array.from(subcategories.entries()).map(([subcategory, categoryTokens]) => (
              <TokenSection
                key={subcategory}
                title={subcategory}
                tokens={categoryTokens}
                onUpdate={updateToken}
                selectedPath={selectedTokenPath}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

interface TokenSectionProps {
  title: string
  tokens: FlattenedToken[]
  onUpdate: (path: string, value: string) => void
  selectedPath: string | null
}

function TokenSection({ title, tokens, onUpdate, selectedPath }: TokenSectionProps) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-muted-foreground mb-2 capitalize">{title}</h4>

      <div className="border rounded-lg overflow-hidden">
        <ResizableTable columns={TABLE_COLUMNS}>
          {tokens.map((token) => (
            <TokenRow
              key={token.path}
              token={token}
              onUpdate={onUpdate}
              isSelected={selectedPath === token.path}
            />
          ))}
        </ResizableTable>
      </div>
    </div>
  )
}

interface TokenRowProps {
  token: FlattenedToken
  onUpdate: (path: string, value: string) => void
  isSelected: boolean
}

function TokenRow({ token, onUpdate, isSelected }: TokenRowProps) {
  // Parse path for display - show full path without category prefix
  const pathParts = token.path.split('.')
  const displayName = pathParts.pop() || token.path
  const parentPath = pathParts.slice(1).join('.') // Skip category (brand/colors)

  const handleValueChange = (newValue: string) => {
    onUpdate(token.path, newValue)
  }

  return (
    <ResizableTableRow
      id={`token-${token.path}`}
      className={isSelected ? 'bg-accent/50' : undefined}
    >
      <ResizableTableCell className="font-mono text-sm" title={token.fullPath}>
        <div className="flex items-center gap-1">
          {parentPath && (
            <span className="text-muted-foreground text-xs">{parentPath}.</span>
          )}
          <span className="font-medium">{displayName}</span>
        </div>
      </ResizableTableCell>
      <ResizableTableCell>
        <ValuePicker
          value={token.value}
          type={token.type}
          onChange={handleValueChange}
        />
      </ResizableTableCell>
      <ResizableTableCell>
        <Badge variant="outline" className="text-xs">
          {token.type}
        </Badge>
      </ResizableTableCell>
    </ResizableTableRow>
  )
}
