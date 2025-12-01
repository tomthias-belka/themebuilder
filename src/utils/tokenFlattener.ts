import type { OrbitTokensJson, FlattenedToken, TokenType, TokenValue, TokenTreeNode } from '@/types/tokens'
import type { GeneratedBrandColors, RadiusSize } from '@/types/wizard'
import { getRadiusAlias } from '@/types/wizard'

/**
 * Flattens the semantic tokens structure for display in the editor table
 * Returns an array of flattened tokens for a specific brand
 */
export function flattenSemanticTokens(
  tokens: OrbitTokensJson,
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
export function extractBrandNames(tokens: OrbitTokensJson): string[] {
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
  tokens: OrbitTokensJson,
  path: string,
  brandName: string,
  newValue: TokenValue
): OrbitTokensJson {
  // Deep clone the tokens
  const newTokens = JSON.parse(JSON.stringify(tokens)) as OrbitTokensJson

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
  tokens: OrbitTokensJson,
  newBrandName: string,
  sourceBrandName?: string
): OrbitTokensJson {
  const newTokens = JSON.parse(JSON.stringify(tokens)) as OrbitTokensJson

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
  tokens: OrbitTokensJson,
  brandName: string
): OrbitTokensJson {
  const newTokens = JSON.parse(JSON.stringify(tokens)) as OrbitTokensJson

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

/**
 * Adds a new brand with custom generated colors
 * 1. Copies all tokens from template brand
 * 2. Overwrites brand.primary.*, brand.secondary.*, brand.accent.* with generated colors
 * 3. Optionally sets the brand.radius token
 */
export function addBrandWithCustomColors(
  tokens: OrbitTokensJson,
  newBrandName: string,
  templateBrandName: string,
  brandColors: GeneratedBrandColors,
  radius?: RadiusSize
): OrbitTokensJson {
  // First, copy all tokens from template
  const newTokens = addBrandToTokens(tokens, newBrandName, templateBrandName)

  // Then overwrite the brand color tokens with generated colors
  const brand = newTokens.semantic?.brand
  if (!brand) return newTokens

  // Apply primary variants
  const primary = brand.primary
  if (primary && typeof primary === 'object') {
    for (const [variant, alias] of Object.entries(brandColors.primary)) {
      const token = (primary as Record<string, unknown>)[variant]
      if (token && typeof token === 'object' && '$value' in token) {
        const values = (token as { $value: Record<string, TokenValue> }).$value
        values[newBrandName] = alias
      }
    }
  }

  // Apply secondary variants
  const secondary = brand.secondary
  if (secondary && typeof secondary === 'object') {
    for (const [variant, alias] of Object.entries(brandColors.secondary)) {
      const token = (secondary as Record<string, unknown>)[variant]
      if (token && typeof token === 'object' && '$value' in token) {
        const values = (token as { $value: Record<string, TokenValue> }).$value
        values[newBrandName] = alias
      }
    }
  }

  // Apply accent variants
  const accent = brand.accent
  if (accent && typeof accent === 'object') {
    for (const [variant, alias] of Object.entries(brandColors.accent)) {
      const token = (accent as Record<string, unknown>)[variant]
      if (token && typeof token === 'object' && '$value' in token) {
        const values = (token as { $value: Record<string, TokenValue> }).$value
        values[newBrandName] = alias
      }
    }
  }

  // Apply radius if specified
  if (radius) {
    const radiusToken = brand.radius as unknown
    if (radiusToken && typeof radiusToken === 'object' && '$value' in (radiusToken as Record<string, unknown>)) {
      const tokenWithValue = radiusToken as { $value: Record<string, TokenValue> }
      tokenWithValue.$value[newBrandName] = getRadiusAlias(radius)
    }
  }

  // Fix: Set the theme token value to the new brand name (not copied from template)
  const themeToken = brand.theme as unknown
  if (themeToken && typeof themeToken === 'object' && '$value' in (themeToken as Record<string, unknown>)) {
    const tokenWithValue = themeToken as { $value: Record<string, TokenValue> }
    tokenWithValue.$value[newBrandName] = newBrandName
  }

  return newTokens
}

/**
 * Builds a tree structure from semantic tokens for navigation
 * Returns an array of root nodes (brand, colors, etc.)
 */
export function buildTokenTree(
  tokens: OrbitTokensJson,
  brandName: string
): TokenTreeNode[] {
  const roots: TokenTreeNode[] = []

  function buildNode(obj: unknown, name: string, path: string, brand: string): TokenTreeNode {
    const node: TokenTreeNode = {
      name,
      path,
      children: [],
      tokenCount: 0
    }

    if (!obj || typeof obj !== 'object') return node

    for (const [key, value] of Object.entries(obj)) {
      const childPath = path ? `${path}.${key}` : key

      if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
        // This is a token leaf node
        const tokenValue = value as { $value: unknown }
        if (typeof tokenValue.$value === 'object' && tokenValue.$value !== null) {
          if (brand in (tokenValue.$value as Record<string, unknown>)) {
            node.children.push({
              name: key,
              path: childPath,
              children: [],
              tokenCount: 1
            })
          }
        }
      } else if (value && typeof value === 'object') {
        // This is a group, recurse
        const childNode = buildNode(value, key, childPath, brand)
        if (childNode.tokenCount > 0 || childNode.children.length > 0) {
          node.children.push(childNode)
        }
      }
    }

    // Calculate total token count
    node.tokenCount = node.children.reduce((sum, child) => sum + child.tokenCount, 0)

    return node
  }

  // Build tree from semantic tokens
  if (tokens.semantic) {
    for (const [key, value] of Object.entries(tokens.semantic)) {
      if (value && typeof value === 'object') {
        const node = buildNode(value, key, key, brandName)
        if (node.tokenCount > 0 || node.children.length > 0) {
          roots.push(node)
        }
      }
    }
  }

  return roots
}
