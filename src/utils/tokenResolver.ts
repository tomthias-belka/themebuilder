import type { OrbitTokensJson, TokenValue, AliasSuggestion, TokenType } from '@/types/tokens'

/**
 * Checks if a value is an alias reference
 * Aliases are in the format: {path.to.token}
 */
export function isAlias(value: TokenValue): boolean {
  return typeof value === 'string' && value.startsWith('{') && value.endsWith('}')
}

/**
 * Extracts the path from an alias
 * e.g., "{colors.blue.70}" -> "colors.blue.70"
 */
export function extractAliasPath(alias: TokenValue): string {
  if (!isAlias(alias)) return alias
  return alias.slice(1, -1)
}

/**
 * Gets a value from a nested object by dot-notation path
 */
function getValueByPath(obj: unknown, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

/**
 * Resolves a token value to its final value
 * Handles alias references like {colors.blue.70} or {brand.primary.main}
 *
 * @param value - The token value (can be alias or direct value)
 * @param tokens - The complete tokens JSON
 * @param brandName - The brand to resolve values for (for semantic tokens)
 * @param maxDepth - Maximum recursion depth to prevent infinite loops
 */
export function resolveTokenValue(
  value: TokenValue,
  tokens: OrbitTokensJson,
  brandName: string,
  maxDepth = 10
): string {
  if (maxDepth <= 0) {
    console.warn('Token resolution exceeded max depth, returning original value:', value)
    return value
  }

  if (!isAlias(value)) {
    return value
  }

  const path = extractAliasPath(value)

  // Try to resolve from global tokens first (colors, radius, etc.)
  // Global paths start with the category directly: colors.blue.70
  const globalValue = getValueByPath(tokens.global, path)
  if (globalValue && typeof globalValue === 'object' && '$value' in globalValue) {
    const resolvedValue = (globalValue as { $value: string }).$value
    // Recursively resolve if the value is also an alias
    return resolveTokenValue(resolvedValue, tokens, brandName, maxDepth - 1)
  }

  // Try to resolve from semantic tokens
  // Semantic paths: brand.primary.main, colors.background.page
  const semanticValue = getValueByPath(tokens.semantic, path)
  if (semanticValue && typeof semanticValue === 'object' && '$value' in semanticValue) {
    const valueObj = (semanticValue as { $value: unknown }).$value

    // Check if it's a multi-brand value
    if (typeof valueObj === 'object' && valueObj !== null && brandName in valueObj) {
      const brandValue = (valueObj as Record<string, string>)[brandName]
      // Recursively resolve if the brand value is also an alias
      return resolveTokenValue(brandValue, tokens, brandName, maxDepth - 1)
    }

    // Single value
    if (typeof valueObj === 'string') {
      return resolveTokenValue(valueObj, tokens, brandName, maxDepth - 1)
    }
  }

  // Could not resolve, return original
  console.warn('Could not resolve token alias:', value)
  return value
}

/**
 * Gets all available aliases from the global tokens for autocomplete
 */
export function getGlobalAliases(tokens: OrbitTokensJson): AliasSuggestion[] {
  const suggestions: AliasSuggestion[] = []

  function traverseGlobal(obj: unknown, path: string, category: string) {
    if (!obj || typeof obj !== 'object') return

    for (const [key, value] of Object.entries(obj)) {
      const newPath = path ? `${path}.${key}` : key

      if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
        const tokenValue = value as { $value: string; $type: string }
        if (tokenValue.$type === 'color') {
          suggestions.push({
            alias: `{${newPath}}`,
            resolvedValue: tokenValue.$value,
            path: newPath,
            category
          })
        }
      } else if (value && typeof value === 'object') {
        traverseGlobal(value, newPath, category || key)
      }
    }
  }

  traverseGlobal(tokens.global, '', '')

  return suggestions
}

/**
 * Gets semantic aliases (brand references) for autocomplete
 */
export function getSemanticAliases(
  tokens: OrbitTokensJson,
  brandName: string
): AliasSuggestion[] {
  const suggestions: AliasSuggestion[] = []

  function traverseSemantic(obj: unknown, path: string, category: string) {
    if (!obj || typeof obj !== 'object') return

    for (const [key, value] of Object.entries(obj)) {
      const newPath = path ? `${path}.${key}` : key

      if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
        const tokenValue = value as { $value: unknown; $type: string }

        // Check if it's a multi-brand value
        if (typeof tokenValue.$value === 'object' && tokenValue.$value !== null) {
          const brandValue = (tokenValue.$value as Record<string, string>)[brandName]
          if (brandValue && tokenValue.$type === 'color') {
            const resolved = resolveTokenValue(brandValue, tokens, brandName)
            suggestions.push({
              alias: `{${newPath}}`,
              resolvedValue: resolved,
              path: newPath,
              category: category || key
            })
          }
        }
      } else if (value && typeof value === 'object') {
        traverseSemantic(value, newPath, category || key)
      }
    }
  }

  // Only traverse brand section for semantic aliases
  traverseSemantic(tokens.semantic.brand, 'brand', 'brand')

  return suggestions
}

/**
 * Gets all aliases (global + semantic brand) for autocomplete
 */
export function getAllAliases(
  tokens: OrbitTokensJson,
  brandName: string
): AliasSuggestion[] {
  return [
    ...getGlobalAliases(tokens),
    ...getSemanticAliases(tokens, brandName)
  ]
}

/**
 * Validates if an alias exists in the tokens
 */
export function isValidAlias(alias: TokenValue, tokens: OrbitTokensJson): boolean {
  if (!isAlias(alias)) return false

  const path = extractAliasPath(alias)

  // Check global
  const globalValue = getValueByPath(tokens.global, path)
  if (globalValue && typeof globalValue === 'object' && '$value' in globalValue) {
    return true
  }

  // Check semantic
  const semanticValue = getValueByPath(tokens.semantic, path)
  if (semanticValue && typeof semanticValue === 'object' && '$value' in semanticValue) {
    return true
  }

  return false
}

/**
 * Mapping from token type to global categories
 */
const TYPE_TO_CATEGORIES: Record<string, string[]> = {
  color: ['colors'],
  spacing: ['spacing'],
  borderRadius: ['radius'],
  number: ['spacing', 'radius'],
}

/**
 * Gets global aliases filtered by token type
 * - color → colors.*
 * - spacing → spacing.*
 * - borderRadius → radius.*
 * - number → spacing.* + radius.* (both)
 */
export function getGlobalAliasesByType(
  tokens: OrbitTokensJson,
  tokenType: TokenType
): AliasSuggestion[] {
  const suggestions: AliasSuggestion[] = []
  const categories = TYPE_TO_CATEGORIES[tokenType] || ['colors']

  function traverseCategory(obj: unknown, path: string, rootCategory: string) {
    if (!obj || typeof obj !== 'object') return

    for (const [key, value] of Object.entries(obj)) {
      const newPath = path ? `${path}.${key}` : key

      if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
        const tokenValue = value as { $value: string | number; $type: string }
        const resolvedValue = typeof tokenValue.$value === 'number'
          ? `${tokenValue.$value}${tokenValue.$type === 'spacing' ? 'px' : ''}`
          : String(tokenValue.$value)

        suggestions.push({
          alias: `{${newPath}}`,
          resolvedValue,
          path: newPath,
          category: rootCategory
        })
      } else if (value && typeof value === 'object') {
        traverseCategory(value, newPath, rootCategory)
      }
    }
  }

  // Traverse only the relevant categories
  for (const category of categories) {
    const categoryObj = tokens.global[category as keyof typeof tokens.global]
    if (categoryObj) {
      traverseCategory(categoryObj, category, category)
    }
  }

  return suggestions
}

/**
 * Gets all aliases filtered by token type (global + semantic brand for colors)
 */
export function getAllAliasesByType(
  tokens: OrbitTokensJson,
  brandName: string,
  tokenType: TokenType
): AliasSuggestion[] {
  const globalAliases = getGlobalAliasesByType(tokens, tokenType)

  // For color tokens, also include semantic brand aliases
  if (tokenType === 'color') {
    return [...globalAliases, ...getSemanticAliases(tokens, brandName)]
  }

  return globalAliases
}
