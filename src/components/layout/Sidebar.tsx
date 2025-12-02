import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/themeStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'
import { Trash2, Check } from 'lucide-react'
import { extractBrandNames } from '@/utils/tokenFlattener'
import { SidebarSection, SidebarAddButton } from './SidebarSection'
import { GlobalTokensNav } from './GlobalTokensNav'

interface SidebarProps {
  onAddTheme: () => void
  onDeleteTheme: (brandName: string) => void
  onAddColorFamily: () => void
}

export function Sidebar({ onAddTheme, onDeleteTheme, onAddColorFamily }: SidebarProps) {
  const { tokens, selectedBrand, selectBrand, sidebarView, navigateToThemes } = useThemeStore()

  const brandNames = tokens ? extractBrandNames(tokens) : []
  const isThemesExpanded = sidebarView.type === 'themes'
  const isGlobalsExpanded = sidebarView.type === 'globalSection' || sidebarView.type === 'colorFamily'

  const handleSelectBrand = (brand: string) => {
    selectBrand(brand)
    navigateToThemes()
  }

  return (
    <div className="w-64 h-full bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Logo size={28} />
          <div>
            <h1 className="text-lg font-semibold">Orbit</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        {/* Themes Section */}
        <SidebarSection
          title="Themes"
          count={brandNames.length}
          isExpanded={isThemesExpanded}
          onToggle={navigateToThemes}
          action={tokens ? <SidebarAddButton onClick={onAddTheme} /> : undefined}
        >
          {!tokens ? (
            <div className="px-4 py-2 text-center">
              <p className="text-sm text-sidebar-foreground/60">
                Upload a tokens file to get started
              </p>
            </div>
          ) : brandNames.length === 0 ? (
            <div className="px-4 py-2 text-center">
              <p className="text-sm text-sidebar-foreground/60">No themes found</p>
            </div>
          ) : (
            <div className="space-y-0.5 px-2">
              {brandNames.map((brand) => (
                <ThemeItem
                  key={brand}
                  name={brand}
                  isSelected={selectedBrand === brand && sidebarView.type === 'themes'}
                  onSelect={() => handleSelectBrand(brand)}
                  onDelete={() => onDeleteTheme(brand)}
                  canDelete={brandNames.length > 1}
                />
              ))}
            </div>
          )}
        </SidebarSection>

        {/* Global Tokens Section */}
        {tokens && (
          <SidebarSection
            title="Global Tokens"
            isExpanded={isGlobalsExpanded}
            onToggle={() => {
              if (isGlobalsExpanded) {
                navigateToThemes()
              } else {
                useThemeStore.getState().navigateToGlobalSection('colors')
              }
            }}
          >
            <GlobalTokensNav onAddColorFamily={onAddColorFamily} />
          </SidebarSection>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40 text-center">
          v1.0.0
        </p>
      </div>
    </div>
  )
}

interface ThemeItemProps {
  name: string
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  canDelete: boolean
}

function ThemeItem({ name, isSelected, onSelect, onDelete, canDelete }: ThemeItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center justify-between px-2 py-2 rounded-md cursor-pointer transition-colors',
        isSelected
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isSelected && <Check className="h-4 w-4 shrink-0 text-sidebar-primary" />}
        <span className={cn('text-sm truncate', !isSelected && 'ml-6')}>
          {name}
        </span>
      </div>

      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-sidebar-foreground/60 hover:text-destructive hover:bg-transparent"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
