import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useThemeStore } from '@/store/themeStore'
import { getAllAliases, isAlias, resolveTokenValue } from '@/utils/tokenResolver'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { TokenType, AliasSuggestion } from '@/types/tokens'

interface ValuePickerProps {
  value: string
  type: TokenType
  onChange: (value: string) => void
  className?: string
}

export function ValuePicker({ value, type, onChange, className }: ValuePickerProps) {
  const { tokens, selectedBrand } = useThemeStore()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState(value)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

  // Resolve current value
  const resolvedValue = tokens && selectedBrand && isAlias(value)
    ? resolveTokenValue(value, tokens, selectedBrand)
    : value

  // Get suggestions based on type
  const allAliases = tokens && selectedBrand
    ? getAllAliases(tokens, selectedBrand)
    : []

  // Filter suggestions by type and search
  const searchTerm = (search || '').toString().toLowerCase()
  const suggestions = allAliases
    .filter((alias) => {
      // Filter by search term
      const aliasStr = (alias.alias || '').toString().toLowerCase()
      const pathStr = (alias.path || '').toString().toLowerCase()
      return aliasStr.includes(searchTerm) || pathStr.includes(searchTerm)
    })
    .slice(0, 50)

  // Update search when value changes externally
  useEffect(() => {
    setSearch(value)
  }, [value])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
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
        } else if (search) {
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
    setSearch(e.target.value)
    setSelectedIndex(0)
  }

  const handleContainerClick = () => {
    setIsOpen(true)
    inputRef.current?.focus()
  }

  const handleBlur = () => {
    setTimeout(() => {
      if (search !== value) {
        onChange(search)
      }
      setIsOpen(false)
    }, 150)
  }

  // Scroll selected item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      selectedElement?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex, isOpen])

  // Update dropdown position
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 280),
      })
    }
  }, [isOpen, search])

  // Check if value is a color
  const isColorValue = type === 'color' && resolvedValue &&
    (resolvedValue.startsWith('#') || resolvedValue.startsWith('rgb'))

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
    >
      {/* Main picker - Figma style (no chevron) */}
      <div
        className={cn(
          'flex items-center gap-2 h-9 px-3 rounded-md border bg-background cursor-pointer transition-colors',
          'hover:border-ring focus-within:border-ring focus-within:ring-1 focus-within:ring-ring',
          isOpen && 'border-ring ring-1 ring-ring'
        )}
        onClick={handleContainerClick}
      >
        {/* Color swatch (only for colors) */}
        {isColorValue && (
          <div
            className="w-5 h-5 rounded border border-border shrink-0"
            style={{ backgroundColor: resolvedValue }}
          />
        )}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="flex-1 bg-transparent text-sm font-mono outline-none min-w-0"
          placeholder="Enter value..."
        />
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && createPortal(
        <div
          className="fixed z-[9999] bg-popover border rounded-md shadow-lg"
          role="listbox"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
        >
          <ScrollArea className="max-h-64">
            <div ref={listRef} className="p-1">
              {suggestions.map((suggestion, index) => {
                const suggestionIsColor = suggestion.resolvedValue &&
                  (suggestion.resolvedValue.startsWith('#') ||
                  suggestion.resolvedValue.startsWith('rgb'))

                return (
                  <div
                    key={suggestion.alias}
                    data-index={index}
                    role="option"
                    aria-selected={index === selectedIndex}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-sm',
                      index === selectedIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    )}
                    onClick={() => handleSelect(suggestion)}
                  >
                    {/* Color swatch in dropdown */}
                    {suggestionIsColor && (
                      <div
                        className="w-4 h-4 rounded border border-border shrink-0"
                        style={{ backgroundColor: suggestion.resolvedValue }}
                      />
                    )}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <span className="font-mono truncate">{suggestion.alias}</span>
                      {suggestion.resolvedValue && (
                        <span className="text-xs text-muted-foreground truncate">
                          {suggestion.resolvedValue}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>,
        document.body
      )}
    </div>
  )
}
