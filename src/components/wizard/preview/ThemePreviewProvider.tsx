import { createContext, useContext, useMemo, useEffect, type ReactNode } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { resolveTokenValue } from '@/utils/tokenResolver'
import {
  generatePrimaryVariants,
  generateSecondaryVariants,
  generateAccentVariants,
  isValidColorSelection,
} from '@/utils/colorVariantGenerator'
import type { WizardConfig, PreviewTheme } from '@/types/wizard'

interface ThemePreviewContextValue {
  theme: PreviewTheme
  isValid: boolean
}

const defaultTheme: PreviewTheme = {
  primary: '#3b82f6',
  primarySoft: '#dbeafe',
  primaryLight: '#93c5fd',
  primaryDark: '#1e40af',
  secondary: '#6b7280',
  secondarySoft: '#f3f4f6',
  accent: '#f59e0b',
  accentSoft: '#fef3c7',
  radius: '8px',
  fontFamily: 'Inter, system-ui, sans-serif',
}

const ThemePreviewContext = createContext<ThemePreviewContextValue>({
  theme: defaultTheme,
  isValid: false,
})

export function usePreviewTheme() {
  return useContext(ThemePreviewContext)
}

interface ThemePreviewProviderProps {
  config: WizardConfig
  children: ReactNode
}

export function ThemePreviewProvider({ config, children }: ThemePreviewProviderProps) {
  const { tokens } = useThemeStore()

  // Load Google Font dynamically
  useEffect(() => {
    if (!config.fontFamily || config.fontFamily === 'Inter') return

    const fontName = config.fontFamily.replace(/\s+/g, '+')
    const linkId = 'preview-font-link'

    // Remove existing link
    const existing = document.getElementById(linkId)
    if (existing) existing.remove()

    // Add new font link
    const link = document.createElement('link')
    link.id = linkId
    link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700&display=swap`
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    return () => {
      const toRemove = document.getElementById(linkId)
      if (toRemove) toRemove.remove()
    }
  }, [config.fontFamily])

  const { theme, isValid } = useMemo(() => {
    if (!tokens) {
      return { theme: defaultTheme, isValid: false }
    }

    const anyBrand = Object.keys(tokens.semantic?.brand?.primary?.main?.$value || {})[0]
    if (!anyBrand) {
      return { theme: defaultTheme, isValid: false }
    }

    // Check if colors are valid
    const primaryValid = isValidColorSelection(tokens, config.primaryColor)
    const secondaryValid = isValidColorSelection(tokens, config.secondaryColor)
    const accentValid = isValidColorSelection(tokens, config.accentColor)

    if (!primaryValid || !secondaryValid || !accentValid) {
      return { theme: defaultTheme, isValid: false }
    }

    // Generate variants
    const primaryVariants = generatePrimaryVariants(config.primaryColor)
    const secondaryVariants = generateSecondaryVariants(config.secondaryColor)
    const accentVariants = generateAccentVariants(config.accentColor)

    // Resolve aliases to hex colors
    const resolveAlias = (alias: string): string => {
      const resolved = resolveTokenValue(alias, tokens, anyBrand)
      return resolved || '#cccccc'
    }

    // Get radius px value from tokens
    const getRadiusPx = (radiusKey: string): string => {
      if (!tokens?.global?.radius?.[radiusKey]) return '8px'
      const radiusToken = tokens.global.radius[radiusKey] as { $value: number | string }
      const value = radiusToken.$value
      if (typeof value === 'number') {
        return value === 9999 ? '9999px' : `${value}px`
      }
      return '8px'
    }

    const resolvedTheme: PreviewTheme = {
      primary: resolveAlias(primaryVariants.main),
      primarySoft: resolveAlias(primaryVariants.soft),
      primaryLight: resolveAlias(primaryVariants.light),
      primaryDark: resolveAlias(primaryVariants.dark),
      secondary: resolveAlias(secondaryVariants.main),
      secondarySoft: resolveAlias(secondaryVariants.soft),
      accent: resolveAlias(accentVariants.main),
      accentSoft: resolveAlias(accentVariants.soft),
      radius: getRadiusPx(config.radius),
      fontFamily: `${config.fontFamily}, system-ui, sans-serif`,
    }

    return { theme: resolvedTheme, isValid: true }
  }, [tokens, config])

  // Generate CSS variables style
  const cssVars = useMemo(
    () =>
      ({
        '--preview-primary': theme.primary,
        '--preview-primary-soft': theme.primarySoft,
        '--preview-primary-light': theme.primaryLight,
        '--preview-primary-dark': theme.primaryDark,
        '--preview-secondary': theme.secondary,
        '--preview-secondary-soft': theme.secondarySoft,
        '--preview-accent': theme.accent,
        '--preview-accent-soft': theme.accentSoft,
        '--preview-radius': theme.radius,
        '--preview-font': theme.fontFamily,
      }) as React.CSSProperties,
    [theme]
  )

  return (
    <ThemePreviewContext.Provider value={{ theme, isValid }}>
      <div style={cssVars} className="h-full">
        {children}
      </div>
    </ThemePreviewContext.Provider>
  )
}
