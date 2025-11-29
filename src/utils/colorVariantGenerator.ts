import type { OrbitTokensJson } from '@/types/tokens'
import type {
  ColorSelection,
  ColorFamily,
  PrimaryVariants,
  SecondaryVariants,
  AccentVariants,
  GeneratedBrandColors
} from '@/types/wizard'

// Available steps in the color system
const AVAILABLE_STEPS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600]

// Offset patterns from Clara Plugin
const PRIMARY_OFFSETS = {
  main: 0,
  light: -50,
  soft: -75,
  dark: +330,
  faded: -40
}

const SECONDARY_OFFSETS = {
  main: 0,
  soft: -70,
  light: -50,
  dark: +300
}

const ACCENT_OFFSETS = {
  main: 0,
  soft: -60,
  light: -30,
  dark: +250
}

/**
 * Finds the nearest available step to the target
 */
export function findNearestStep(target: number): number {
  return AVAILABLE_STEPS.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
  )
}

/**
 * Calculates a variant step from base step + offset
 * Clamps to available range and finds nearest step
 */
function calculateVariantStep(baseStep: number, offset: number): number {
  const targetStep = baseStep + offset
  const minStep = AVAILABLE_STEPS[0]
  const maxStep = AVAILABLE_STEPS[AVAILABLE_STEPS.length - 1]
  const clampedTarget = Math.max(minStep, Math.min(maxStep, targetStep))
  return findNearestStep(clampedTarget)
}

/**
 * Creates a color alias string
 */
function createAlias(family: string, step: number): string {
  return `{colors.${family}.${step}}`
}

/**
 * Generates primary color variants (5 variants)
 */
export function generatePrimaryVariants(color: ColorSelection): PrimaryVariants {
  const { family, step } = color
  return {
    main: createAlias(family, calculateVariantStep(step, PRIMARY_OFFSETS.main)),
    soft: createAlias(family, calculateVariantStep(step, PRIMARY_OFFSETS.soft)),
    light: createAlias(family, calculateVariantStep(step, PRIMARY_OFFSETS.light)),
    dark: createAlias(family, calculateVariantStep(step, PRIMARY_OFFSETS.dark)),
    faded: createAlias(family, calculateVariantStep(step, PRIMARY_OFFSETS.faded)),
  }
}

/**
 * Generates secondary color variants (4 variants)
 */
export function generateSecondaryVariants(color: ColorSelection): SecondaryVariants {
  const { family, step } = color
  return {
    main: createAlias(family, calculateVariantStep(step, SECONDARY_OFFSETS.main)),
    soft: createAlias(family, calculateVariantStep(step, SECONDARY_OFFSETS.soft)),
    light: createAlias(family, calculateVariantStep(step, SECONDARY_OFFSETS.light)),
    dark: createAlias(family, calculateVariantStep(step, SECONDARY_OFFSETS.dark)),
  }
}

/**
 * Generates accent color variants (4 variants)
 */
export function generateAccentVariants(color: ColorSelection): AccentVariants {
  const { family, step } = color
  return {
    main: createAlias(family, calculateVariantStep(step, ACCENT_OFFSETS.main)),
    soft: createAlias(family, calculateVariantStep(step, ACCENT_OFFSETS.soft)),
    light: createAlias(family, calculateVariantStep(step, ACCENT_OFFSETS.light)),
    dark: createAlias(family, calculateVariantStep(step, ACCENT_OFFSETS.dark)),
  }
}

/**
 * Generates all brand colors from the 3 base color selections
 */
export function generateAllBrandColors(
  primary: ColorSelection,
  secondary: ColorSelection,
  accent: ColorSelection
): GeneratedBrandColors {
  return {
    primary: generatePrimaryVariants(primary),
    secondary: generateSecondaryVariants(secondary),
    accent: generateAccentVariants(accent),
  }
}

/**
 * Extracts color families from global tokens
 * Returns an array of color families with their available steps
 */
export function extractColorFamilies(tokens: OrbitTokensJson): ColorFamily[] {
  const colors = tokens.global?.colors
  if (!colors) return []

  const families: ColorFamily[] = []

  for (const [familyName, familyColors] of Object.entries(colors)) {
    // Skip special entries like "neutral"
    if (familyName === 'neutral') continue

    if (typeof familyColors === 'object' && familyColors !== null) {
      const steps: number[] = []
      let sampleColor = ''

      for (const [stepKey, stepValue] of Object.entries(familyColors)) {
        const stepNum = parseInt(stepKey, 10)
        if (!isNaN(stepNum) && stepValue && typeof stepValue === 'object' && '$value' in stepValue) {
          steps.push(stepNum)
          // Use step 70 or 80 as sample, or first available
          if (stepNum === 70 || stepNum === 80 || !sampleColor) {
            sampleColor = stepValue.$value as string
          }
        }
      }

      if (steps.length > 0) {
        steps.sort((a, b) => a - b)
        families.push({
          name: familyName,
          steps,
          sampleColor
        })
      }
    }
  }

  // Sort families alphabetically
  families.sort((a, b) => a.name.localeCompare(b.name))

  return families
}

/**
 * Gets the hex color value for a specific family and step
 */
export function getColorValue(tokens: OrbitTokensJson, family: string, step: number): string | null {
  const colors = tokens.global?.colors
  if (!colors) return null

  const familyColors = colors[family]
  if (!familyColors || typeof familyColors !== 'object') return null

  const stepToken = (familyColors as Record<string, { $value?: string }>)[String(step)]
  if (!stepToken || !('$value' in stepToken)) return null

  return stepToken.$value || null
}

/**
 * Gets the available steps for a color family
 */
export function getFamilySteps(tokens: OrbitTokensJson, family: string): number[] {
  const colors = tokens.global?.colors
  if (!colors) return []

  const familyColors = colors[family]
  if (!familyColors || typeof familyColors !== 'object') return []

  const steps: number[] = []
  for (const stepKey of Object.keys(familyColors)) {
    const stepNum = parseInt(stepKey, 10)
    if (!isNaN(stepNum)) {
      steps.push(stepNum)
    }
  }

  return steps.sort((a, b) => a - b)
}

/**
 * Checks if a color selection is valid
 */
export function isValidColorSelection(
  tokens: OrbitTokensJson,
  color: ColorSelection
): boolean {
  if (!color.family || !color.step) return false
  const value = getColorValue(tokens, color.family, color.step)
  return value !== null
}
