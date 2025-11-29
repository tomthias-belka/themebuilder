import { ColorPreview } from '@/components/editor/ColorPreview'
import { useThemeStore } from '@/store/themeStore'
import { resolveTokenValue } from '@/utils/tokenResolver'
import type { PrimaryVariants, SecondaryVariants, AccentVariants } from '@/types/wizard'

interface VariantPreviewProps {
  variants: PrimaryVariants | SecondaryVariants | AccentVariants
  title: string
}

export function VariantPreview({ variants, title }: VariantPreviewProps) {
  const { tokens } = useThemeStore()

  // We need to resolve aliases to actual hex colors for preview
  // Since we're generating new brand, use any existing brand for resolution
  const resolveBrand = tokens ? Object.keys(tokens.semantic?.brand?.primary?.main?.$value || {})[0] : null

  const resolveColor = (alias: string): string => {
    if (!tokens || !resolveBrand) return '#cccccc'
    const resolved = resolveTokenValue(alias, tokens, resolveBrand)
    return resolved || '#cccccc'
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {Object.entries(variants).map(([name, alias]) => (
          <div key={name} className="flex items-center gap-2 bg-muted/50 rounded-md px-2 py-1">
            <ColorPreview color={resolveColor(alias)} size="sm" />
            <div className="text-xs">
              <div className="font-medium">{name}</div>
              <div className="text-muted-foreground font-mono text-[10px]">
                {alias.replace('{colors.', '').replace('}', '')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
