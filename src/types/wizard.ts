// Types for the Theme Creation Wizard

export interface WizardData {
  themeName: string
  templateBrand: string
  primaryColor: ColorSelection
  secondaryColor: ColorSelection
  accentColor: ColorSelection
}

export interface ColorSelection {
  family: string  // e.g., "teal", "blue", "coffee"
  step: number    // e.g., 80, 100, 200
}

export interface PrimaryVariants {
  main: string
  soft: string
  light: string
  dark: string
  faded: string
}

export interface SecondaryVariants {
  main: string
  soft: string
  light: string
  dark: string
}

export interface AccentVariants {
  main: string
  soft: string
  light: string
  dark: string
}

export interface GeneratedBrandColors {
  primary: PrimaryVariants
  secondary: SecondaryVariants
  accent: AccentVariants
}

// Extended config for brand creation with additional settings
export interface BrandCreationConfig {
  colors: GeneratedBrandColors
  radius?: RadiusSize  // Optional radius setting
  // Can add fontFamily in future if needed
}

// Color family info extracted from global.colors
export interface ColorFamily {
  name: string
  steps: number[]
  sampleColor: string  // hex value of a middle step for preview
}

// Extended wizard config for v2 with radius and font
export type RadiusSize = 'sm' | 'md' | 'lg' | 'xl'

export interface WizardConfig {
  themeName: string
  templateBrand: string
  primaryColor: ColorSelection
  secondaryColor: ColorSelection
  accentColor: ColorSelection
  fontFamily: string
  radius: RadiusSize
}

// Radius mapping to global.radius tokens
export const RADIUS_MAP: Record<RadiusSize, string> = {
  sm: '{radius.xs}',
  md: '{radius.sm}',
  lg: '{radius.md}',
  xl: '{radius.lg}',
}

// Preview theme values (resolved hex colors)
export interface PreviewTheme {
  primary: string
  primarySoft: string
  primaryLight: string
  primaryDark: string
  secondary: string
  secondarySoft: string
  accent: string
  accentSoft: string
  radius: string
  fontFamily: string
}
