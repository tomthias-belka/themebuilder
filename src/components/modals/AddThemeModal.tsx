import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { extractBrandNames } from '@/utils/tokenFlattener'

interface AddThemeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddThemeModal({ open, onOpenChange }: AddThemeModalProps) {
  const [name, setName] = useState('')
  const [sourceBrand, setSourceBrand] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { tokens, addBrand } = useThemeStore()

  const existingBrands = tokens ? extractBrandNames(tokens) : []

  const handleSubmit = async () => {
    const trimmedName = name.trim().toLowerCase()

    if (!trimmedName) {
      setError('Please enter a theme name')
      return
    }

    if (existingBrands.includes(trimmedName)) {
      setError('A theme with this name already exists')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await addBrand(trimmedName, sourceBrand || undefined)
      onOpenChange(false)
      setName('')
      setSourceBrand('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create theme')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setSourceBrand('')
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Theme</DialogTitle>
          <DialogDescription>
            Create a new brand theme. You can optionally copy values from an existing theme.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Theme name */}
          <div className="space-y-2">
            <Label htmlFor="theme-name">Theme Name</Label>
            <Input
              id="theme-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., newbrand"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Use lowercase letters only, no spaces
            </p>
          </div>

          {/* Source brand */}
          {existingBrands.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="source-brand">Copy values from (optional)</Label>
              <select
                id="source-brand"
                value={sourceBrand}
                onChange={(e) => setSourceBrand(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Start from scratch</option>
                {existingBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isLoading}>
            {isLoading ? 'Creating...' : 'Create Theme'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
