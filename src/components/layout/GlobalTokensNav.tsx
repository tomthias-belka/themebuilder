import { useMemo, useState } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { SidebarSubSection, SidebarItem, SidebarAddButton } from './SidebarSection'
import { ColorPreview } from '@/components/editor/ColorPreview'
import type { GlobalTokenSection } from '@/types/globalTokens'

interface GlobalTokensNavProps {
  onAddColorFamily: () => void
}

export function GlobalTokensNav({ onAddColorFamily }: GlobalTokensNavProps) {
  const { tokens, sidebarView, navigateToGlobalSection, navigateToColorFamily } = useThemeStore()
  const [expandedSection, setExpandedSection] = useState<GlobalTokenSection | null>(null)

  // Extract color families
  const colorFamilies = useMemo(() => {
    if (!tokens?.global?.colors) return []
    return Object.keys(tokens.global.colors).filter(k => k !== 'neutral').sort()
  }, [tokens])

  // Get first color of a family for preview
  const getPreviewColor = (familyName: string): string => {
    const family = tokens?.global?.colors?.[familyName]
    if (!family) return 'transparent'
    // Try to get step 70 or the first available
    const step70 = family['70']
    if (step70?.$value) return step70.$value
    const firstStep = Object.values(family)[0]
    return (firstStep as { $value?: string })?.$value || 'transparent'
  }

  // Count tokens in categories
  const typographyCount = useMemo(() => {
    if (!tokens?.global?.typography) return 0
    return Object.values(tokens.global.typography).reduce((acc, sub) => {
      if (typeof sub === 'object' && sub !== null) {
        return acc + Object.keys(sub).length
      }
      return acc
    }, 0)
  }, [tokens])

  const spacingCount = useMemo(() => {
    if (!tokens?.global?.spacing) return 0
    return Object.keys(tokens.global.spacing).length
  }, [tokens])

  const radiusCount = useMemo(() => {
    if (!tokens?.global?.radius) return 0
    return Object.keys(tokens.global.radius).length
  }, [tokens])

  const toggleSection = (section: GlobalTokenSection) => {
    setExpandedSection(prev => prev === section ? null : section)
  }

  const isColorFamilySelected = (name: string) =>
    sidebarView.type === 'colorFamily' && sidebarView.familyName === name

  return (
    <div className="space-y-0.5">
      {/* Colors */}
      <SidebarSubSection
        title="Colors"
        count={colorFamilies.length}
        isExpanded={expandedSection === 'colors'}
        onToggle={() => toggleSection('colors')}
        action={<SidebarAddButton onClick={onAddColorFamily} />}
      >
        <div className="py-1">
          {colorFamilies.map((name) => (
            <SidebarItem
              key={name}
              isSelected={isColorFamilySelected(name)}
              onClick={() => navigateToColorFamily(name)}
            >
              <div className="flex items-center gap-2">
                <ColorPreview color={getPreviewColor(name)} size="sm" />
                <span className="capitalize">{name}</span>
              </div>
            </SidebarItem>
          ))}
        </div>
      </SidebarSubSection>

      {/* Typography */}
      <SidebarSubSection
        title="Typography"
        count={typographyCount}
        isExpanded={false}
        onToggle={() => {}}
        onClick={() => navigateToGlobalSection('typography')}
      />

      {/* Spacing */}
      <SidebarSubSection
        title="Spacing"
        count={spacingCount}
        isExpanded={false}
        onToggle={() => {}}
        onClick={() => navigateToGlobalSection('spacing')}
      />

      {/* Radius */}
      <SidebarSubSection
        title="Radius"
        count={radiusCount}
        isExpanded={false}
        onToggle={() => {}}
        onClick={() => navigateToGlobalSection('radius')}
      />
    </div>
  )
}
