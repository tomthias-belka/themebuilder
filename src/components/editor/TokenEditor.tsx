import { useMemo } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { groupTokensByCategory } from '@/utils/tokenFlattener'
import { ValuePicker } from './ValuePicker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { FlattenedToken } from '@/types/tokens'

export function TokenEditor() {
  const { tokens, selectedBrand, flattenedTokens, updateToken } = useThemeStore()

  // Group tokens by category
  const groupedTokens = useMemo(() => {
    return groupTokensByCategory(flattenedTokens)
  }, [flattenedTokens])

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
}

function TokenSection({ title, tokens, onUpdate }: TokenSectionProps) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-muted-foreground mb-2 capitalize">{title}</h4>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Token</TableHead>
              <TableHead className="w-[280px]">Value</TableHead>
              <TableHead className="w-[80px]">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token) => (
              <TokenRow
                key={token.path}
                token={token}
                onUpdate={onUpdate}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

interface TokenRowProps {
  token: FlattenedToken
  onUpdate: (path: string, value: string) => void
}

function TokenRow({ token, onUpdate }: TokenRowProps) {
  // Parse path for tree-like display
  const pathParts = token.path.split('.')
  const displayName = pathParts.pop() || token.path
  const parentPath = pathParts.slice(1).join('.') // Skip category (brand/colors)
  const depth = pathParts.length

  const handleValueChange = (newValue: string) => {
    onUpdate(token.path, newValue)
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-sm" title={token.fullPath}>
        <div
          className="flex items-center gap-1.5"
          style={{ paddingLeft: `${depth * 12}px` }}
        >
          {parentPath && (
            <span className="text-muted-foreground text-xs">{parentPath}.</span>
          )}
          <span className="font-medium">{displayName}</span>
        </div>
      </TableCell>
      <TableCell>
        <ValuePicker
          value={token.value}
          type={token.type}
          onChange={handleValueChange}
        />
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {token.type}
        </Badge>
      </TableCell>
    </TableRow>
  )
}
