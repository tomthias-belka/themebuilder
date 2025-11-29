import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { WizardStep1 } from './WizardStep1'
import { WizardStep2 } from './WizardStep2'
import { WizardStep3 } from './WizardStep3'
import { useThemeStore } from '@/store/themeStore'
import { isValidColorSelection, generateAllBrandColors } from '@/utils/colorVariantGenerator'
import { extractBrandNames } from '@/utils/tokenFlattener'
import type { WizardData, ColorSelection } from '@/types/wizard'

interface ThemeWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const initialColorSelection: ColorSelection = { family: '', step: 0 }

const initialWizardData: WizardData = {
  themeName: '',
  templateBrand: '',
  primaryColor: { ...initialColorSelection },
  secondaryColor: { ...initialColorSelection },
  accentColor: { ...initialColorSelection },
}

export function ThemeWizard({ open, onOpenChange }: ThemeWizardProps) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardData>({ ...initialWizardData })
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const { tokens, addBrandWithColors } = useThemeStore()

  const existingBrands = useMemo(() => {
    if (!tokens) return []
    return extractBrandNames(tokens)
  }, [tokens])

  // Validation for each step
  const isStep1Valid = useMemo(() => {
    const nameValid = data.themeName.length >= 2 &&
      data.themeName.length <= 50 &&
      !existingBrands.includes(data.themeName)
    const templateValid = data.templateBrand !== ''
    return nameValid && templateValid && !error
  }, [data.themeName, data.templateBrand, existingBrands, error])

  const isStep2Valid = useMemo(() => {
    if (!tokens) return false
    return isValidColorSelection(tokens, data.primaryColor) &&
      isValidColorSelection(tokens, data.secondaryColor) &&
      isValidColorSelection(tokens, data.accentColor)
  }, [tokens, data.primaryColor, data.secondaryColor, data.accentColor])

  const handleDataChange = (partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }))
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleCreate = async () => {
    setIsCreating(true)
    setError(null)

    try {
      const brandColors = generateAllBrandColors(
        data.primaryColor,
        data.secondaryColor,
        data.accentColor
      )

      await addBrandWithColors(data.themeName, data.templateBrand, brandColors)

      // Reset and close
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create theme')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setData({ ...initialWizardData })
    setError(null)
    onOpenChange(false)
  }

  const canProceed = step === 1 ? isStep1Valid : step === 2 ? isStep2Valid : true

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Theme</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Choose a name and template for your new theme'}
            {step === 2 && 'Select the base colors for your theme'}
            {step === 3 && 'Review and confirm your new theme'}
          </DialogDescription>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s === step
                    ? 'bg-primary text-primary-foreground'
                    : s < step
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <WizardStep1
              data={data}
              onChange={handleDataChange}
              error={error}
              setError={setError}
            />
          )}
          {step === 2 && (
            <WizardStep2
              data={data}
              onChange={handleDataChange}
            />
          )}
          {step === 3 && (
            <WizardStep3 data={data} />
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>

          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button onClick={handleNext} disabled={!canProceed}>
                Next
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Theme'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
