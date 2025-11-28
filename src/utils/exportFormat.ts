import type { ClaraTokensJson, TokenValue } from '@/types/tokens'

/**
 * Export format for semantic-brand.json
 * Contains the entire semantic block with only the selected brand's values
 */
export interface SemanticBrandExport {
  semantic: Record<string, unknown>
}

/**
 * Creates the export JSON with only a single brand's values
 * The format keeps the full semantic structure but each $value contains only the selected brand
 */
export function createSemanticBrandExport(
  tokens: ClaraTokensJson,
  brandName: string
): SemanticBrandExport {
  function traverse(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') return obj

    // Check if this is a token with $value and $type
    if ('$value' in obj && '$type' in obj) {
      const token = obj as { $value: unknown; $type: string }

      // If $value is a multi-brand object, extract only the selected brand
      if (typeof token.$value === 'object' && token.$value !== null) {
        const values = token.$value as Record<string, TokenValue>
        if (brandName in values) {
          return {
            $value: {
              [brandName]: values[brandName]
            },
            $type: token.$type
          }
        }
      }

      // Single value token, keep as is
      return {
        $value: token.$value,
        $type: token.$type
      }
    }

    // Not a token, recursively process children
    const processed: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      processed[key] = traverse(value)
    }
    return processed
  }

  const semantic = traverse(tokens.semantic) as Record<string, unknown>

  return { semantic }
}

/**
 * Generates the filename for the export
 */
export function generateExportFilename(brandName: string): string {
  return `semantic-${brandName}.json`
}

/**
 * Downloads a JSON file
 */
export function downloadJson(data: unknown, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Merges an imported semantic-brand.json into the existing tokens
 * Updates only the values for the brand present in the import
 */
export function mergeSemanticBrandImport(
  existingTokens: ClaraTokensJson,
  importedData: SemanticBrandExport
): { tokens: ClaraTokensJson; brandName: string | null } {
  // Extract brand name from the imported data
  let detectedBrand: string | null = null

  function findBrandName(obj: unknown): string | null {
    if (!obj || typeof obj !== 'object') return null

    if ('$value' in obj) {
      const token = obj as { $value: unknown }
      if (typeof token.$value === 'object' && token.$value !== null) {
        const keys = Object.keys(token.$value)
        if (keys.length === 1) {
          return keys[0]
        }
      }
      return null
    }

    for (const value of Object.values(obj)) {
      const found = findBrandName(value)
      if (found) return found
    }

    return null
  }

  detectedBrand = findBrandName(importedData.semantic)

  if (!detectedBrand) {
    return { tokens: existingTokens, brandName: null }
  }

  // Deep clone existing tokens
  const newTokens = JSON.parse(JSON.stringify(existingTokens)) as ClaraTokensJson

  function mergeValues(existing: unknown, imported: unknown, brand: string): void {
    if (!existing || !imported) return
    if (typeof existing !== 'object' || typeof imported !== 'object') return

    // If this is a token, merge the brand value
    if ('$value' in existing && '$value' in imported) {
      const existingToken = existing as { $value: unknown }
      const importedToken = imported as { $value: unknown }

      if (
        typeof existingToken.$value === 'object' &&
        existingToken.$value !== null &&
        typeof importedToken.$value === 'object' &&
        importedToken.$value !== null
      ) {
        const existingValues = existingToken.$value as Record<string, TokenValue>
        const importedValues = importedToken.$value as Record<string, TokenValue>

        if (brand in importedValues) {
          existingValues[brand] = importedValues[brand]
        }
      }
      return
    }

    // Recursively merge children
    for (const key of Object.keys(imported)) {
      if (key in (existing as Record<string, unknown>)) {
        mergeValues(
          (existing as Record<string, unknown>)[key],
          (imported as Record<string, unknown>)[key],
          brand
        )
      }
    }
  }

  mergeValues(newTokens.semantic, importedData.semantic, detectedBrand)

  return { tokens: newTokens, brandName: detectedBrand }
}
