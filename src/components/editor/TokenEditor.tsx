import { useMemo } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { groupTokensByCategory } from '@/utils/tokenFlattener'
import { resolveTokenValue, isAlias } from '@/utils/tokenResolver'
import { ColorPreview } from './ColorPreview'
import { AliasAutocomplete } from './AliasAutocomplete'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { OrbitTokensJson, FlattenedToken } from '@/types/tokens'

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
                allTokens={tokens}
                brandName={selectedBrand}
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
  allTokens: OrbitTokensJson
  brandName: string
  onUpdate: (path: string, value: string) => void
}

function TokenSection({ title, tokens, allTokens, brandName, onUpdate }: TokenSectionProps) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-muted-foreground mb-2 capitalize">{title}</h4>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Token</TableHead>
              <TableHead className="w-[100px]">Preview</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token) => (
              <TokenRow
                key={token.path}
                token={token}
                allTokens={allTokens}
                brandName={brandName}
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
  allTokens: OrbitTokensJson
  brandName: string
  onUpdate: (path: string, value: string) => void
}

function TokenRow({ token, allTokens, brandName, onUpdate }: TokenRowProps) {
  // Resolve the token value to get the actual color
  const resolvedValue = isAlias(token.value)
    ? resolveTokenValue(token.value, allTokens, brandName)
    : token.value

  // Get just the last part of the path for display
  const displayName = token.path.split('.').pop() || token.path

  const handleValueChange = (newValue: string) => {
    onUpdate(token.path, newValue)
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-sm">
        {displayName}
      </TableCell>
      <TableCell>
        {token.type === 'color' && (
          <ColorPreview color={resolvedValue} size="md" />
        )}
      </TableCell>
      <TableCell>
        {token.type === 'color' ? (
          <AliasAutocomplete
            value={token.value}
            onChange={handleValueChange}
          />
        ) : (
          <span className="font-mono text-sm">{token.value}</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {token.type}
        </Badge>
      </TableCell>
    </TableRow>
  )
}
