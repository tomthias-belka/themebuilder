import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useThemeStore } from '@/store/themeStore'
import { resolveTokenValue, isAlias } from '@/utils/tokenResolver'
import { ColorPreview } from '@/components/editor/ColorPreview'
import { AliasAutocomplete } from '@/components/editor/AliasAutocomplete'
import type { WizardConfig } from '@/types/wizard'

interface AdvancedTabProps {
  config: WizardConfig
  onChange: (updates: Partial<WizardConfig>) => void
}

interface TokenItem {
  path: string
  variant: string
  currentAlias: string
  resolvedColor: string
}

export function AdvancedTab(_props: AdvancedTabProps) {
  const { tokens } = useThemeStore()
  const [filter, setFilter] = useState('')
  const [localOverrides, setLocalOverrides] = useState<Record<string, string>>({})

  // Extract brand tokens for preview
  const brandTokens = useMemo(() => {
    if (!tokens?.semantic?.brand) return []

    const items: TokenItem[] = []
    const brand = tokens.semantic.brand
    const anyBrand = Object.keys(brand.primary?.main?.$value || {})[0]

    if (!anyBrand) return items

    // Process primary, secondary, accent groups
    const groups = ['primary', 'secondary', 'accent'] as const

    for (const group of groups) {
      const groupObj = brand[group]
      if (!groupObj || typeof groupObj !== 'object') continue

      for (const [variant, token] of Object.entries(groupObj)) {
        if (!token || typeof token !== 'object' || !('$value' in token)) continue

        const tokenValue = token as { $value: Record<string, string> }
        const alias = tokenValue.$value[anyBrand]

        if (alias) {
          const resolved = isAlias(alias)
            ? resolveTokenValue(alias, tokens, anyBrand)
            : alias

          items.push({
            path: `brand.${group}.${variant}`,
            variant,
            currentAlias: localOverrides[`${group}.${variant}`] || alias,
            resolvedColor: resolved || '#cccccc',
          })
        }
      }
    }

    return items
  }, [tokens, localOverrides])

  // Filter tokens
  const filteredTokens = useMemo(() => {
    if (!filter) return brandTokens
    const lowerFilter = filter.toLowerCase()
    return brandTokens.filter(
      (t) =>
        t.path.toLowerCase().includes(lowerFilter) ||
        t.currentAlias.toLowerCase().includes(lowerFilter)
    )
  }, [brandTokens, filter])

  // Group by category
  const groupedTokens = useMemo(() => {
    const groups: Record<string, TokenItem[]> = {
      primary: [],
      secondary: [],
      accent: [],
    }

    for (const token of filteredTokens) {
      const group = token.path.split('.')[1]
      if (group in groups) {
        groups[group].push(token)
      }
    }

    return groups
  }, [filteredTokens])

  const handleOverride = (path: string, value: string) => {
    const key = path.replace('brand.', '')
    setLocalOverrides((prev) => ({ ...prev, [key]: value }))
    // TODO: In future, sync these overrides back to config or apply on create
  }

  if (!tokens) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Load tokens to view advanced editor</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Token Alias Editor</Label>
          <Badge variant="outline" className="text-xs">
            {filteredTokens.length} tokens
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter tokens..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Token List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {Object.entries(groupedTokens).map(([group, tokens]) => {
            if (tokens.length === 0) return null

            return (
              <div key={group}>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {group}
                </h4>
                <div className="space-y-2">
                  {tokens.map((token) => (
                    <TokenRow
                      key={token.path}
                      token={token}
                      onChange={(value) => handleOverride(token.path, value)}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {filteredTokens.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No tokens match your filter
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="p-3 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Edit aliases to customize token references. Use <code className="px-1 py-0.5 bg-muted rounded">{'{colors.blue.70}'}</code> format.
        </p>
      </div>
    </div>
  )
}

interface TokenRowProps {
  token: TokenItem
  onChange: (value: string) => void
}

function TokenRow({ token, onChange }: TokenRowProps) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md border bg-card hover:bg-accent/5 transition-colors">
      <ColorPreview color={token.resolvedColor} size="md" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{token.variant}</div>
        <div className="text-[10px] text-muted-foreground truncate">{token.path}</div>
      </div>
      <div className="w-48">
        <AliasAutocomplete
          value={token.currentAlias}
          onChange={onChange}
          placeholder="Enter alias..."
          className="text-xs"
        />
      </div>
    </div>
  )
}
