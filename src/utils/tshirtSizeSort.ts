/**
 * T-shirt size ordering for design tokens
 * Ensures tokens with size names (xs, sm, md, lg, xl, etc.) are sorted correctly
 */

const TSHIRT_SIZE_ORDER = [
  'none',
  '5xs',
  '4xs',
  '3xs',
  '2xs',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl'
] as const

/**
 * Extract numeric value from a token value string
 * Supports formats like: "16px", "1.5", "400", "0.5rem", etc.
 *
 * @param value Token value string
 * @returns Numeric value or NaN if not parseable
 */
function extractNumericValue(value: string): number {
  // Remove common CSS units and parse the number
  const match = value.match(/^-?\d+\.?\d*/)
  return match ? parseFloat(match[0]) : NaN
}

/**
 * Comparator function that sorts T-shirt size names in the correct order
 * Falls back to alphabetical sorting for non-T-shirt size names
 *
 * @param a First token name to compare
 * @param b Second token name to compare
 * @returns Negative if a < b, positive if a > b, zero if equal
 *
 * @example
 * ['xl', 'sm', '2xl', 'md'].sort(sortByTShirtSize)
 * // => ['sm', 'md', 'xl', '2xl']
 */
export function sortByTShirtSize(a: string, b: string): number {
  const indexA = TSHIRT_SIZE_ORDER.indexOf(a as typeof TSHIRT_SIZE_ORDER[number])
  const indexB = TSHIRT_SIZE_ORDER.indexOf(b as typeof TSHIRT_SIZE_ORDER[number])

  // Both are T-shirt sizes - compare by position in order array
  if (indexA !== -1 && indexB !== -1) {
    return indexA - indexB
  }

  // Only a is a T-shirt size - a comes first
  if (indexA !== -1) return -1

  // Only b is a T-shirt size - b comes first
  if (indexB !== -1) return 1

  // Neither is a T-shirt size - fallback to alphabetical sort
  return a.localeCompare(b)
}

/**
 * Comparator function that sorts tokens by their numeric value
 * Falls back to T-shirt size sorting if values are not numeric
 *
 * @param aName First token name
 * @param aValue First token value
 * @param bName Second token name
 * @param bValue Second token value
 * @returns Negative if a < b, positive if a > b, zero if equal
 *
 * @example
 * tokens.sort((a, b) => sortByNumericValue(a.name, a.value, b.name, b.value))
 * // => [{ name: 'condensed', value: '12' }, { name: 'compact', value: '16' }, ...]
 */
export function sortByNumericValue(
  aName: string,
  aValue: string,
  bName: string,
  bValue: string
): number {
  const numA = extractNumericValue(aValue)
  const numB = extractNumericValue(bValue)

  // Both values are numeric - sort by numeric value
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB
  }

  // Fallback to T-shirt size / name sorting
  return sortByTShirtSize(aName, bName)
}
