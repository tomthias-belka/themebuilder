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
