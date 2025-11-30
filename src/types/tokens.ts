// Token types matching the orbit-tokens.json structure

export type TokenType =
  | 'color'
  | 'borderRadius'
  | 'spacing'
  | 'fontFamily'
  | 'fontWeight'
  | 'fontSize'
  | 'lineHeight'
  | 'string'

// Brand names available in the system
export type BrandName = string // e.g., 'orbit', 'mooney', 'atm', 'comersud'

// A token value can be a direct value (hex, px, etc.) or an alias reference
export type TokenValue = string // e.g., "#ffffff" or "{colors.blue.70}"

// Multi-brand value object - each brand has its own value
export interface MultiBrandValue {
  [brandName: string]: TokenValue
}

// A single token with multi-brand support
export interface Token {
  $value: MultiBrandValue
  $type: TokenType
}

// Single-value token (used in global colors, radius, etc.)
export interface SingleValueToken {
  $value: string
  $type: TokenType
}

// Recursive token structure for nested tokens
export interface TokenGroup {
  [key: string]: Token | TokenGroup | SingleValueToken
}

// Global tokens structure (colors, radius, typography, etc.)
export interface GlobalTokens {
  colors: {
    [family: string]: {
      [level: string]: SingleValueToken
    }
  }
  radius?: {
    [size: string]: SingleValueToken
  }
  typography?: TokenGroup
  spacing?: {
    [size: string]: SingleValueToken
  }
  [key: string]: TokenGroup | undefined
}

// Brand section of semantic tokens
export interface SemanticBrand {
  primary: TokenGroup
  secondary: TokenGroup
  accent: TokenGroup
  radius?: TokenGroup
  theme: Token
  [key: string]: TokenGroup | Token | undefined
}

// Colors section of semantic tokens
export interface SemanticColors {
  background: TokenGroup
  text: TokenGroup
  border: TokenGroup
  feedback: TokenGroup
  icon: TokenGroup
  gradient?: TokenGroup
  [key: string]: TokenGroup | undefined
}

// Semantic tokens structure (brand-specific values)
export interface SemanticTokens {
  brand: SemanticBrand
  colors: SemanticColors
  [key: string]: SemanticBrand | SemanticColors | TokenGroup | undefined
}

// Complete orbit-tokens.json structure
export interface OrbitTokensJson {
  global: GlobalTokens
  semantic: SemanticTokens
}

// Brand configuration stored in IndexedDB
export interface Brand {
  id?: number
  name: string
  createdAt: Date
  updatedAt: Date
}

// Flattened token for display in the editor
export interface FlattenedToken {
  path: string // e.g., "brand.primary.main" or "colors.background.page"
  fullPath: string // e.g., "semantic.brand.primary.main"
  value: TokenValue // The value for the selected brand
  type: TokenType
  category: 'brand' | 'colors' | 'other'
  subcategory?: string // e.g., "primary", "background", "text"
}

// Token alias suggestion for autocomplete
export interface AliasSuggestion {
  alias: string // e.g., "{colors.blue.70}"
  resolvedValue: string // e.g., "#0072ef"
  path: string // e.g., "colors.blue.70"
  category: string // e.g., "colors"
}

// Tree structure for navigation sidebar
export interface TokenTreeNode {
  name: string
  path: string
  children: TokenTreeNode[]
  tokenCount: number
}

// Export format - single brand semantic tokens
export interface SemanticBrandJson {
  semantic: {
    brand: {
      [key: string]: {
        [subkey: string]: {
          $value: {
            [brandName: string]: TokenValue
          }
          $type: TokenType
        } | SemanticBrandJson['semantic']['brand']
      } | {
        $value: {
          [brandName: string]: TokenValue
        }
        $type: TokenType
      }
    }
    colors: TokenGroup
    [key: string]: TokenGroup | undefined
  }
}
