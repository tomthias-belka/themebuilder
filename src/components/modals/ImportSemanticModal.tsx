import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'

interface ImportSemanticModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportSemanticModal({ open, onOpenChange }: ImportSemanticModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { importSemanticBrand } = useThemeStore()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.json')) {
        setError('Please select a JSON file')
        return
      }
      setFile(selectedFile)
      setError(null)
      setSuccess(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.json')) {
        setError('Please drop a JSON file')
        return
      }
      setFile(droppedFile)
      setError(null)
      setSuccess(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const text = await file.text()
      const json = JSON.parse(text)

      const result = await importSemanticBrand(json)

      if (result.success) {
        setSuccess(`Successfully imported theme: ${result.brandName}`)
        setTimeout(() => {
          onOpenChange(false)
          setFile(null)
          setSuccess(null)
        }, 1500)
      } else {
        setError(result.error || 'Failed to import file')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setError(null)
    setSuccess(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Semantic Brand</DialogTitle>
          <DialogDescription>
            Import a semantic-brand.json file to update or add a theme's token values.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileSelect}
            />

            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileJson className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to select or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  semantic-*.json files
                </p>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || isLoading}>
            {isLoading ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
