// Types for Global Tokens Management

// ===== SIDEBAR STATE =====

export type GlobalTokenSection = 'colors' | 'typography' | 'spacing' | 'radius'

export type SidebarView =
  | { type: 'themes' }
  | { type: 'globalSection'; section: GlobalTokenSection }
  | { type: 'colorFamily'; familyName: string }

// ===== COLOR PALETTE TYPES =====

export interface OklchColor {
  l: number  // Lightness 0-100
  c: number  // Chroma 0-0.4
  h: number  // Hue 0-360
}

export interface PaletteConfig {
  baseColor: string           // Hex input
  familyName: string          // e.g., "purple", "gold"
  hueShift: number            // -30 to +30 degrees
  easingType: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

export interface PaletteStep {
  name: string      // "5", "10"... "600"
  lightness: number
  hex: string       // Computed hex
}

// Orbit lightness distribution (16 steps)
// From light (5) to dark (600)
export const ORBIT_STEPS = [
  { name: '5',   lightness: 97 },
  { name: '10',  lightness: 94 },
  { name: '20',  lightness: 90 },
  { name: '30',  lightness: 82 },
  { name: '40',  lightness: 72 },
  { name: '50',  lightness: 62 },
  { name: '60',  lightness: 55 },
  { name: '70',  lightness: 48 },   // typical base color
  { name: '80',  lightness: 43 },
  { name: '90',  lightness: 38 },
  { name: '100', lightness: 33 },
  { name: '200', lightness: 29 },
  { name: '300', lightness: 25 },
  { name: '400', lightness: 21 },
  { name: '500', lightness: 17 },
  { name: '600', lightness: 14 },
] as const

// ===== TOKEN DATA TYPES =====

export interface ColorFamilyData {
  name: string
  steps: Array<{ step: string; hex: string }>
}

export interface TypographyTokenData {
  fontFamily: Array<{ name: string; value: string }>
  fontSize: Array<{ name: string; value: string }>
  fontWeight: Array<{ name: string; value: string }>
  lineHeight: Array<{ name: string; value: string }>
  letterSpacing: Array<{ name: string; value: string }>
}

export interface GenericTokenData {
  name: string
  value: string
  type: string
}
