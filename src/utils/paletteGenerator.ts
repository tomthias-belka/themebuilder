import type { OklchColor, PaletteConfig, PaletteStep } from '@/types/globalTokens'
import type { SingleValueToken } from '@/types/tokens'

// Orbit lightness distribution (16 steps)
// Analyzed from existing orbit-tokens.json color families
const ORBIT_LIGHTNESS_MAP: Record<string, number> = {
  '5': 95,
  '10': 92,
  '20': 88,
  '30': 80,
  '40': 70,
  '50': 60,
  '60': 52,
  '70': 45,
  '80': 40,
  '90': 36,
  '100': 32,
  '200': 28,
  '300': 24,
  '400': 20,
  '500': 16,
  '600': 13,
}

const ORBIT_STEPS = ['5', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100', '200', '300', '400', '500', '600']

// ===== COLOR CONVERSION FUNCTIONS =====

/**
 * Convert hex to RGB (0-1 range)
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) throw new Error(`Invalid hex color: ${hex}`)
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ]
}

/**
 * Convert RGB (0-1) to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const clamped = Math.max(0, Math.min(1, c))
    const hex = Math.round(clamped * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Convert sRGB to linear RGB
 */
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/**
 * Convert linear RGB to sRGB
 */
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

/**
 * Convert linear RGB to OKLab
 */
function linearRgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)

  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  ]
}

/**
 * Convert OKLab to linear RGB
 */
function oklabToLinearRgb(L: number, a: number, b: number): [number, number, number] {
  const l = L + 0.3963377774 * a + 0.2158037573 * b
  const m = L - 0.1055613458 * a - 0.0638541728 * b
  const s = L - 0.0894841775 * a - 1.2914855480 * b

  const l3 = l * l * l
  const m3 = m * m * m
  const s3 = s * s * s

  return [
    +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3
  ]
}

/**
 * Convert OKLab to OKLCH
 */
function oklabToOklch(L: number, a: number, b: number): OklchColor {
  const c = Math.sqrt(a * a + b * b)
  let h = Math.atan2(b, a) * 180 / Math.PI
  if (h < 0) h += 360
  return { l: L * 100, c, h }
}

/**
 * Convert OKLCH to OKLab
 */
function oklchToOklab(oklch: OklchColor): [number, number, number] {
  const L = oklch.l / 100
  const a = oklch.c * Math.cos(oklch.h * Math.PI / 180)
  const b = oklch.c * Math.sin(oklch.h * Math.PI / 180)
  return [L, a, b]
}

/**
 * Convert hex to OKLCH
 */
export function hexToOklch(hex: string): OklchColor {
  const [r, g, b] = hexToRgb(hex)
  const [lr, lg, lb] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)]
  const [L, a, bLab] = linearRgbToOklab(lr, lg, lb)
  return oklabToOklch(L, a, bLab)
}

/**
 * Convert OKLCH to hex
 */
export function oklchToHex(oklch: OklchColor): string {
  const [L, a, b] = oklchToOklab(oklch)
  const [lr, lg, lb] = oklabToLinearRgb(L, a, b)
  const [r, g, bRgb] = [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)]
  return rgbToHex(r, g, bRgb)
}

// ===== EASING FUNCTIONS =====

function applyEasing(t: number, type: PaletteConfig['easingType']): number {
  switch (type) {
    case 'ease-in':
      return t * t
    case 'ease-out':
      return 1 - (1 - t) * (1 - t)
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    default: // linear
      return t
  }
}

// ===== PALETTE GENERATION =====

/**
 * Calculate hue shift based on position in the palette
 */
function calculateHueShift(
  baseHue: number,
  shiftAmount: number,
  stepIndex: number,
  totalSteps: number,
  easingType: PaletteConfig['easingType']
): number {
  // Apply shift gradually from light to dark
  const t = stepIndex / (totalSteps - 1)
  const easedT = applyEasing(t, easingType)
  // Shift goes from -shiftAmount/2 at lightest to +shiftAmount/2 at darkest
  const shift = shiftAmount * (easedT - 0.5)
  return (baseHue + shift + 360) % 360
}

/**
 * Calculate chroma based on lightness
 * Chroma typically peaks in the mid-tones and reduces at extremes
 */
function calculateChroma(baseChroma: number, lightness: number): number {
  // Reduce chroma at very light and very dark values
  // Peak at around 50% lightness
  const lightnessNormalized = lightness / 100
  const chromaScale = 4 * lightnessNormalized * (1 - lightnessNormalized)
  return baseChroma * Math.max(0.3, chromaScale)
}

/**
 * Generate a complete color palette from a base color
 */
export function generatePalette(config: PaletteConfig): PaletteStep[] {
  const baseOklch = hexToOklch(config.baseColor)
  const steps: PaletteStep[] = []

  ORBIT_STEPS.forEach((stepName, index) => {
    const targetLightness = ORBIT_LIGHTNESS_MAP[stepName]

    // Calculate hue with optional shift
    const hue = calculateHueShift(
      baseOklch.h,
      config.hueShift,
      index,
      ORBIT_STEPS.length,
      config.easingType
    )

    // Calculate chroma - reduce at extremes
    const chroma = calculateChroma(baseOklch.c, targetLightness)

    const oklch: OklchColor = {
      l: targetLightness,
      c: chroma,
      h: hue
    }

    steps.push({
      name: stepName,
      lightness: targetLightness,
      hex: oklchToHex(oklch)
    })
  })

  return steps
}

/**
 * Convert palette steps to token format for storage
 */
export function paletteToTokens(steps: PaletteStep[]): Record<string, SingleValueToken> {
  const tokens: Record<string, SingleValueToken> = {}

  steps.forEach(step => {
    tokens[step.name] = {
      $value: step.hex,
      $type: 'color'
    }
  })

  return tokens
}

/**
 * Validate a color family name
 */
export function validateFamilyName(name: string, existingFamilies: string[]): string | null {
  if (!name.trim()) {
    return 'Name is required'
  }

  if (!/^[a-z][a-z0-9]*$/i.test(name)) {
    return 'Name must start with a letter and contain only letters and numbers'
  }

  if (existingFamilies.includes(name.toLowerCase())) {
    return 'A color family with this name already exists'
  }

  if (name.toLowerCase() === 'neutral') {
    return 'Cannot use "neutral" as a family name'
  }

  return null
}

/**
 * Get default palette config
 */
export function getDefaultPaletteConfig(): PaletteConfig {
  return {
    baseColor: '#0072ef',
    familyName: '',
    hueShift: 0,
    easingType: 'linear'
  }
}
