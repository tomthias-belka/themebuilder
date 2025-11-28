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
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'

interface DeleteThemeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brandName: string
}

export function DeleteThemeModal({ open, onOpenChange, brandName }: DeleteThemeModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { deleteBrand } = useThemeStore()

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await deleteBrand(brandName)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete theme')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Theme
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the theme "{brandName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            All token values associated with this theme will be permanently removed from your tokens file.
          </p>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm mt-4">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete Theme'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
