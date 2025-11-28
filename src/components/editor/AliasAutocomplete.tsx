import { useState, useRef, useEffect, useCallback } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { getAllAliases, isAlias, resolveTokenValue } from '@/utils/tokenResolver'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ColorPreview } from './ColorPreview'
import { cn } from '@/lib/utils'
import type { AliasSuggestion } from '@/types/tokens'

interface AliasAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
}

export function AliasAutocomplete({
  value,
  onChange,
  onBlur,
  placeholder = 'Enter value or alias...',
  className,
}: AliasAutocompleteProps) {
  const { tokens, selectedBrand } = useThemeStore()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState(value)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Get all aliases for autocomplete
  const allAliases = tokens && selectedBrand
    ? getAllAliases(tokens, selectedBrand)
    : []

  // Filter suggestions based on search
  const suggestions = allAliases.filter((alias) =>
    alias.alias.toLowerCase().includes(search.toLowerCase()) ||
    alias.path.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 50) // Limit to 50 suggestions

  // Resolve current value to show preview
  const resolvedValue = tokens && selectedBrand && isAlias(value)
    ? resolveTokenValue(value, tokens, selectedBrand)
    : value

  // Update search when value changes externally
  useEffect(() => {
    setSearch(value)
  }, [value])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex])
        } else {
          onChange(search)
          setIsOpen(false)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearch(value)
        break
      case 'Tab':
        if (suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex])
        }
        setIsOpen(false)
        break
    }
  }, [isOpen, suggestions, selectedIndex, search, value, onChange])

  const handleSelect = (suggestion: AliasSuggestion) => {
    onChange(suggestion.alias)
    setSearch(suggestion.alias)
    setIsOpen(false)
    setSelectedIndex(0)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearch(newValue)
    setIsOpen(true)
    setSelectedIndex(0)
  }

  const handleBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      if (search !== value) {
        onChange(search)
      }
      setIsOpen(false)
      onBlur?.()
    }, 150)
  }

  // Scroll selected item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      selectedElement?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex, isOpen])

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-2">
        {resolvedValue && resolvedValue.startsWith('#') && (
          <ColorPreview color={resolvedValue} size="sm" />
        )}
        <Input
          ref={inputRef}
          value={search}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="flex-1 font-mono text-sm"
        />
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          <ScrollArea className="max-h-64">
            <div ref={listRef} className="p-1">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.alias}
                  data-index={index}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-sm',
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  )}
                  onClick={() => handleSelect(suggestion)}
                >
                  <ColorPreview color={suggestion.resolvedValue} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono truncate">{suggestion.alias}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {suggestion.resolvedValue}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
