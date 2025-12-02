import { useState, useEffect, useRef } from 'react'
import { Input } from './input'
import { Label } from './label'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
}

export function ColorPicker({ value, onChange, label, className }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue)
    }
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
  }

  const handleBlur = () => {
    // Reset to valid value if input is invalid
    if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
      setInputValue(value)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-10 h-10 rounded-md border border-input shadow-sm shrink-0 cursor-pointer hover:ring-2 hover:ring-ring hover:ring-offset-2 transition-all"
              style={{ backgroundColor: value }}
              aria-label="Pick color"
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-3">
              <input
                type="color"
                value={value}
                onChange={handleColorChange}
                className="w-full h-32 cursor-pointer rounded border-0"
              />
              <div className="text-xs text-muted-foreground text-center">
                Click to pick a color
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="#000000"
          className="font-mono flex-1"
          maxLength={7}
        />
      </div>
    </div>
  )
}
