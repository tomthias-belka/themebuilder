/**
 * Theme Exporter Utility
 *
 * Provides export functionality for ThemeBuilder similar to Orbit Station.
 * Supports W3C JSON format with complete and per-brand export options.
 */

import type { OrbitTokensJson, TokenValue } from '@/types/tokens'

// ============================================================================
// Types
// ============================================================================

export interface ExportOptions {
  format: 'complete' | 'per-brand'
  brands?: string[]
  includeTextStyles: boolean
  textStyleProperties: string[]
  includeGlobal?: boolean
}

export interface ExportFile {
  filename: string
  content: string
  size: number
}

export interface ExportResult {
  success: boolean
  message: string
  files: ExportFile[]
}

export interface TextStyleToken {
  $type: 'typography'
  $value: {
    fontFamily?: string
    fontSize?: { value: number; unit: string } | string
    fontWeight?: string | number
    lineHeight?: { value: number; unit: string } | string | number
    letterSpacing?: { value: number; unit: string } | string | number
  }
  $description?: string
  $extensions?: {
    fontFile?: string | { [brand: string]: string }
  }
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TEXT_STYLE_PROPERTIES = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing'
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a value is a multi-brand value object
 * A multi-brand value is an object where:
 * - It's not null or an array
 * - All keys are non-$ prefixed strings (brand names)
 * - All values are strings (color hex, alias references, etc.)
 */
function isMultiBrandValue(value: unknown): value is Record<string, TokenValue> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const keys = Object.keys(value)

  // Empty object or object with $-prefixed keys is not a multi-brand value
  if (keys.length === 0) return false
  if (keys.some(key => key.startsWith('$'))) return false

  // All values should be strings (hex colors, aliases, etc.)
  return keys.every(key => typeof (value as Record<string, unknown>)[key] === 'string')
}

/**
 * Check if an object is a token (has $value and $type)
 */
function isToken(obj: unknown): obj is { $value: unknown; $type: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '$value' in obj &&
    '$type' in obj
  )
}

/**
 * Recursively extract tokens for a specific brand
 */
function extractBrandFromObject(obj: unknown, brand: string): unknown {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  // If this is a token with $value
  if (isToken(obj)) {
    // Multi-brand value? Extract only this brand's value
    if (isMultiBrandValue(obj.$value)) {
      const brandValue = obj.$value[brand]
      if (brandValue !== undefined) {
        return {
          $value: brandValue,
          $type: obj.$type,
          ...('$description' in obj && obj.$description
            ? { $description: obj.$description }
            : {}),
          ...('$extensions' in obj && obj.$extensions
            ? { $extensions: obj.$extensions }
            : {})
        }
      }
      // Brand not found, return first available value as fallback
      const firstBrand = Object.keys(obj.$value)[0]
      if (firstBrand) {
        return {
          $value: obj.$value[firstBrand],
          $type: obj.$type,
          ...('$description' in obj && obj.$description
            ? { $description: obj.$description }
            : {})
        }
      }
    }
    // Single value or alias - keep as-is
    return obj
  }

  // Recurse into object
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = extractBrandFromObject(value, brand)
  }
  return result
}

/**
 * Extract brand names from tokens
 */
export function extractBrandNamesFromTokens(tokens: OrbitTokensJson): string[] {
  const brandNames = new Set<string>()

  function traverse(obj: unknown): void {
    if (!obj || typeof obj !== 'object') return

    if (isToken(obj) && isMultiBrandValue(obj.$value)) {
      Object.keys(obj.$value).forEach(brand => brandNames.add(brand))
      return
    }

    if (!Array.isArray(obj)) {
      for (const value of Object.values(obj)) {
        traverse(value)
      }
    }
  }

  traverse(tokens.semantic)
  return Array.from(brandNames)
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export complete W3C JSON with all tokens and all brands
 */
export function exportCompleteW3C(
  tokens: OrbitTokensJson,
  options: ExportOptions
): ExportFile[] {
  const exportData: Record<string, unknown> = {}

  // Always include global tokens
  if (tokens.global) {
    exportData.global = tokens.global
  }

  // Include semantic tokens with all brands
  if (tokens.semantic) {
    exportData.semantic = tokens.semantic
  }

  // Include text styles if available and requested
  if (options.includeTextStyles && 'textStyles' in tokens) {
    exportData.textStyles = filterTextStyleProperties(
      (tokens as Record<string, unknown>).textStyles,
      options.textStyleProperties
    )
  }

  const content = JSON.stringify(exportData, null, 2)

  return [{
    filename: 'orbit-tokens.json',
    content,
    size: new Blob([content]).size
  }]
}

/**
 * Export per-brand semantic tokens (single brand per file)
 */
export function exportPerBrand(
  tokens: OrbitTokensJson,
  options: ExportOptions
): ExportFile[] {
  const brands = options.brands || []
  const files: ExportFile[] = []

  for (const brand of brands) {
    const exportData: Record<string, unknown> = {}

    // Optionally include global tokens
    if (options.includeGlobal && tokens.global) {
      exportData.global = tokens.global
    }

    // Extract semantic tokens for this brand
    if (tokens.semantic) {
      exportData.semantic = extractBrandFromObject(tokens.semantic, brand)
    }

    // Include text styles if available and requested
    if (options.includeTextStyles && 'textStyles' in tokens) {
      exportData.textStyles = filterTextStyleProperties(
        extractBrandFromObject((tokens as Record<string, unknown>).textStyles, brand),
        options.textStyleProperties
      )
    }

    const content = JSON.stringify(exportData, null, 2)

    files.push({
      filename: `${brand}-semantic.tokens.json`,
      content,
      size: new Blob([content]).size
    })
  }

  return files
}

/**
 * Filter text style properties to include only selected ones
 */
function filterTextStyleProperties(
  textStyles: unknown,
  selectedProperties: string[]
): unknown {
  if (!textStyles || typeof textStyles !== 'object') {
    return textStyles
  }

  if (selectedProperties.length === 0) {
    return textStyles
  }

  const result: Record<string, unknown> = {}

  for (const [styleName, styleValue] of Object.entries(textStyles)) {
    if (isToken(styleValue) && typeof styleValue.$value === 'object') {
      const filteredValue: Record<string, unknown> = {}

      for (const prop of selectedProperties) {
        if (prop in (styleValue.$value as object)) {
          filteredValue[prop] = (styleValue.$value as Record<string, unknown>)[prop]
        }
      }

      result[styleName] = {
        $type: styleValue.$type,
        $value: filteredValue,
        ...('$description' in styleValue && styleValue.$description
          ? { $description: styleValue.$description }
          : {}),
        ...('$extensions' in styleValue && styleValue.$extensions
          ? { $extensions: styleValue.$extensions }
          : {})
      }
    } else if (typeof styleValue === 'object' && styleValue !== null) {
      // Recursively process nested text styles
      result[styleName] = filterTextStyleProperties(styleValue, selectedProperties)
    } else {
      result[styleName] = styleValue
    }
  }

  return result
}

/**
 * Main export function - routes to appropriate export method
 */
export function exportTheme(
  tokens: OrbitTokensJson,
  options: ExportOptions
): ExportFile[] {
  if (options.format === 'complete') {
    return exportCompleteW3C(tokens, options)
  } else {
    return exportPerBrand(tokens, options)
  }
}

/**
 * Execute export and return result
 */
export function executeExport(
  tokens: OrbitTokensJson | null,
  options: ExportOptions
): ExportResult {
  if (!tokens) {
    return {
      success: false,
      message: 'No tokens loaded. Please upload a token file first.',
      files: []
    }
  }

  try {
    const files = exportTheme(tokens, options)

    if (files.length === 0) {
      return {
        success: false,
        message: 'No files were generated. Please check your export options.',
        files: []
      }
    }

    const totalSize = files.reduce((sum, f) => sum + f.size, 0)
    const sizeKB = (totalSize / 1024).toFixed(2)

    return {
      success: true,
      message: `Successfully exported ${files.length} file${files.length > 1 ? 's' : ''} (${sizeKB} KB total)`,
      files
    }
  } catch (error) {
    return {
      success: false,
      message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      files: []
    }
  }
}

// ============================================================================
// Download Utilities
// ============================================================================

/**
 * Download a single file
 */
export function downloadFile(file: ExportFile): void {
  const blob = new Blob([file.content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = file.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Download multiple files (sequentially with small delay)
 */
export function downloadFiles(files: ExportFile[]): void {
  files.forEach((file, index) => {
    setTimeout(() => downloadFile(file), index * 200)
  })
}

/**
 * Create a ZIP file containing multiple exports
 * Note: ZIP functionality requires JSZip to be installed (npm install jszip)
 * Returns false and falls back to individual downloads if JSZip is not available
 */
export async function downloadAsZip(
  files: ExportFile[],
  _zipFilename: string = 'orbit-tokens-export.zip'
): Promise<boolean> {
  // For now, fall back to individual downloads
  // To enable ZIP: npm install jszip and uncomment the JSZip code below
  downloadFiles(files)
  return false

  /*
  try {
    // Dynamic import of JSZip (if available)
    const JSZip = (await import('jszip')).default

    const zip = new JSZip()

    for (const file of files) {
      zip.file(file.filename, file.content)
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = zipFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    return true
  } catch {
    // JSZip not available, fall back to individual downloads
    downloadFiles(files)
    return false
  }
  */
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate export options
 */
export function validateExportOptions(options: ExportOptions): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (options.format === 'per-brand') {
    if (!options.brands || options.brands.length === 0) {
      errors.push('At least one brand must be selected for per-brand export')
    }
  }

  if (options.includeTextStyles && options.textStyleProperties.length === 0) {
    errors.push('At least one text style property must be selected')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// ============================================================================
// Presets
// ============================================================================

export const EXPORT_PRESETS = {
  completeW3C: {
    format: 'complete' as const,
    brands: [],
    includeTextStyles: true,
    textStyleProperties: DEFAULT_TEXT_STYLE_PROPERTIES,
    includeGlobal: true
  },
  singleBrand: (brand: string) => ({
    format: 'per-brand' as const,
    brands: [brand],
    includeTextStyles: true,
    textStyleProperties: DEFAULT_TEXT_STYLE_PROPERTIES,
    includeGlobal: false
  }),
  allBrands: (brands: string[]) => ({
    format: 'per-brand' as const,
    brands,
    includeTextStyles: true,
    textStyleProperties: DEFAULT_TEXT_STYLE_PROPERTIES,
    includeGlobal: false
  })
}

export { DEFAULT_TEXT_STYLE_PROPERTIES }