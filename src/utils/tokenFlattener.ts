import type { ClaraTokensJson, FlattenedToken, TokenType, TokenValue } from '@/types/tokens'

/**
 * Flattens the semantic tokens structure for display in the editor table
 * Returns an array of flattened tokens for a specific brand
 */
export function flattenSemanticTokens(
  tokens: ClaraTokensJson,
  brandName: string
): FlattenedToken[] {
  const flattened: FlattenedToken[] = []

  function traverse(
    obj: unknown,
    path: string,
    fullPath: string,
    category: 'brand' | 'colors' | 'other',
    subcategory?: string
  ) {
    if (!obj || typeof obj !== 'object') return

    for (const [key, value] of Object.entries(obj)) {
      const newPath = path ? `${path}.${key}` : key
      const newFullPath = fullPath ? `${fullPath}.${key}` : `semantic.${key}`

      if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
        const tokenValue = value as { $value: unknown; $type: TokenType }

        // Check if it's a multi-brand value
        if (typeof tokenValue.$value === 'object' && tokenValue.$value !== null) {
          const brandValue = (tokenValue.$value as Record<string, TokenValue>)[brandName]
          if (brandValue !== undefined) {
            flattened.push({
              path: newPath,
              fullPath: newFullPath,
              value: brandValue,
              type: tokenValue.$type,
              category,
              subcategory
            })
          }
        }
      } else if (value && typeof value === 'object') {
        // Determine category and subcategory
        let newCategory = category
        let newSubcategory = subcategory

        if (path === '') {
          // Top level of semantic
          if (key === 'brand') {
            newCategory = 'brand'
          } else if (key === 'colors') {
            newCategory = 'colors'
          } else {
            newCategory = 'other'
          }
        } else if (path === 'brand' || path === 'colors') {
          newSubcategory = key
        }

        traverse(value, newPath, newFullPath, newCategory, newSubcategory)
      }
    }
  }

  traverse(tokens.semantic, '', '', 'other')

  return flattened
}

/**
 * Groups flattened tokens by category and subcategory for UI display
 */
export function groupTokensByCategory(
  tokens: FlattenedToken[]
): Map<string, Map<string, FlattenedToken[]>> {
  const groups = new Map<string, Map<string, FlattenedToken[]>>()

  for (const token of tokens) {
    const category = token.category
    const subcategory = token.subcategory || 'general'

    if (!groups.has(category)) {
      groups.set(category, new Map())
    }

    const categoryGroup = groups.get(category)!
    if (!categoryGroup.has(subcategory)) {
      categoryGroup.set(subcategory, [])
    }

    categoryGroup.get(subcategory)!.push(token)
  }

  return groups
}

/**
 * Extracts all brand names from the tokens structure
 */
export function extractBrandNames(tokens: ClaraTokensJson): string[] {
  // Get brand names from the brand.theme token which contains all brand keys
  const themeToken = tokens.semantic?.brand?.theme
  if (themeToken && '$value' in themeToken) {
    const value = themeToken.$value
    if (typeof value === 'object' && value !== null) {
      return Object.keys(value)
    }
  }

  // Fallback: extract from any multi-brand token
  const brandToken = tokens.semantic?.brand?.primary?.main
  if (brandToken && '$value' in brandToken) {
    const value = (brandToken as { $value: unknown }).$value
    if (typeof value === 'object' && value !== null) {
      return Object.keys(value)
    }
  }

  return []
}

/**
 * Updates a token value in the tokens structure
 * Returns a new tokens object (immutable update)
 */
export function updateTokenValue(
  tokens: ClaraTokensJson,
  path: string,
  brandName: string,
  newValue: TokenValue
): ClaraTokensJson {
  // Deep clone the tokens
  const newTokens = JSON.parse(JSON.stringify(tokens)) as ClaraTokensJson

  // Navigate to the token and update
  const parts = path.split('.')
  let current: unknown = newTokens.semantic

  for (let i = 0; i < parts.length - 1; i++) {
    if (!current || typeof current !== 'object') return tokens
    current = (current as Record<string, unknown>)[parts[i]]
  }

  const lastKey = parts[parts.length - 1]
  if (current && typeof current === 'object') {
    const token = (current as Record<string, unknown>)[lastKey]
    if (token && typeof token === 'object' && '$value' in token) {
      const valueObj = (token as { $value: unknown }).$value
      if (typeof valueObj === 'object' && valueObj !== null) {
        (valueObj as Record<string, TokenValue>)[brandName] = newValue
      }
    }
  }

  return newTokens
}

/**
 * Adds a new brand to all multi-brand tokens
 * Copies values from a source brand or uses defaults
 */
export function addBrandToTokens(
  tokens: ClaraTokensJson,
  newBrandName: string,
  sourceBrandName?: string
): ClaraTokensJson {
  const newTokens = JSON.parse(JSON.stringify(tokens)) as ClaraTokensJson

  function traverse(obj: unknown) {
    if (!obj || typeof obj !== 'object') return

    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object' && '$value' in value) {
        const token = value as { $value: unknown }
        if (typeof token.$value === 'object' && token.$value !== null) {
          const values = token.$value as Record<string, TokenValue>

          // Copy from source brand or use first available value
          if (sourceBrandName && sourceBrandName in values) {
            values[newBrandName] = values[sourceBrandName]
          } else {
            const firstValue = Object.values(values)[0]
            if (firstValue) {
              values[newBrandName] = firstValue
            }
          }
        }
      } else if (value && typeof value === 'object') {
        traverse(value)
      }
    }
  }

  traverse(newTokens.semantic)

  return newTokens
}

/**
 * Removes a brand from all multi-brand tokens
 */
export function removeBrandFromTokens(
  tokens: ClaraTokensJson,
  brandName: string
): ClaraTokensJson {
  const newTokens = JSON.parse(JSON.stringify(tokens)) as ClaraTokensJson

  function traverse(obj: unknown) {
    if (!obj || typeof obj !== 'object') return

    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object' && '$value' in value) {
        const token = value as { $value: unknown }
        if (typeof token.$value === 'object' && token.$value !== null) {
          const values = token.$value as Record<string, TokenValue>
          delete values[brandName]
        }
      } else if (value && typeof value === 'object') {
        traverse(value)
      }
    }
  }

  traverse(newTokens.semantic)

  return newTokens
}
