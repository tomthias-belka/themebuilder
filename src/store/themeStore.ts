import { create } from 'zustand'
import { db, dbOperations } from '@/db/database'
import type { Brand, OrbitTokensJson, FlattenedToken, SingleValueToken, TokenType } from '@/types/tokens'
import { flattenSemanticTokens, extractBrandNames, updateTokenValue, addBrandToTokens, removeBrandFromTokens, addBrandWithCustomColors } from '@/utils/tokenFlattener'
import type { GeneratedBrandColors, RadiusSize } from '@/types/wizard'
import type { SidebarView, GlobalTokenSection } from '@/types/globalTokens'
import { createSemanticBrandExport, generateExportFilename, downloadJson, mergeSemanticBrandImport } from '@/utils/exportFormat'
import type { ExportOptions, ExportResult } from '@/utils/themeExporter'
import { executeExport, extractBrandNamesFromTokens } from '@/utils/themeExporter'

interface ThemeState {
  // Data
  tokens: OrbitTokensJson | null
  brands: Brand[]
  selectedBrand: string | null
  flattenedTokens: FlattenedToken[]

  // UI State
  isLoading: boolean
  isInitialized: boolean
  hasUnsavedChanges: boolean
  viewMode: 'table' | 'json'
  jsonEditorError: string | null
  selectedTokenPath: string | null
  isTokenTreeOpen: boolean

  // Sidebar Navigation
  sidebarView: SidebarView

  // Actions
  initialize: () => Promise<void>
  loadTokensFromFile: (jsonData: OrbitTokensJson) => Promise<void>
  selectBrand: (brandName: string) => void
  updateToken: (path: string, newValue: string) => void
  saveChanges: () => Promise<void>

  // Brand management
  addBrand: (brandName: string, sourceBrand?: string) => Promise<void>
  addBrandWithColors: (brandName: string, templateBrand: string, brandColors: GeneratedBrandColors, radius?: RadiusSize) => Promise<void>
  deleteBrand: (brandName: string) => Promise<void>

  // Export/Import
  exportSemanticBrand: (brandName?: string) => void
  exportFullTokens: () => void
  importSemanticBrand: (jsonData: unknown) => Promise<{ success: boolean; brandName?: string; error?: string }>

  // Advanced Export
  exportAdvanced: (options: ExportOptions) => ExportResult
  getAvailableBrands: () => string[]

  // View Mode
  setViewMode: (mode: 'table' | 'json') => void
  setJsonEditorError: (error: string | null) => void
  updateTokensFromJson: (jsonString: string) => { success: boolean; error?: string }

  // Token Navigation
  setSelectedTokenPath: (path: string | null) => void
  setTokenTreeOpen: (open: boolean) => void

  // Sidebar Navigation
  setSidebarView: (view: SidebarView) => void
  navigateToThemes: () => void
  navigateToGlobalSection: (section: GlobalTokenSection) => void
  navigateToColorFamily: (familyName: string) => void

  // Global Token CRUD
  addColorFamily: (name: string, steps: Record<string, SingleValueToken>) => Promise<void>
  deleteColorFamily: (name: string) => Promise<void>
  addGlobalToken: (category: string, name: string, value: string, type: string) => Promise<void>
  updateGlobalToken: (category: string, name: string, value: string) => Promise<void>
  deleteGlobalToken: (category: string, name: string) => Promise<void>
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  // Initial state
  tokens: null,
  brands: [],
  selectedBrand: null,
  flattenedTokens: [],
  isLoading: false,
  isInitialized: false,
  hasUnsavedChanges: false,
  viewMode: 'table',
  jsonEditorError: null,
  selectedTokenPath: null,
  isTokenTreeOpen: false,
  sidebarView: { type: 'themes' },

  // Initialize from IndexedDB or preload default tokens
  initialize: async () => {
    set({ isLoading: true })

    try {
      // Load tokens from IndexedDB
      let storedTokens = await dbOperations.getGlobalTokens()
      let storedBrands = await dbOperations.getAllBrands()

      // If no tokens in DB, preload from public/orbit-tokens.json
      if (!storedTokens) {
        try {
          const basePath = import.meta.env.BASE_URL || '/'
          const response = await fetch(`${basePath}orbit-tokens.json`)
          if (response.ok) {
            const defaultTokens = await response.json() as OrbitTokensJson

            // Validate structure
            if (defaultTokens.global && defaultTokens.semantic) {
              // Extract brand names and save to IndexedDB
              const brandNames = extractBrandNames(defaultTokens)

              await db.brands.clear()
              for (const name of brandNames) {
                await dbOperations.addBrand(name)
              }
              await dbOperations.setGlobalTokens(defaultTokens)

              storedTokens = defaultTokens
              storedBrands = await dbOperations.getAllBrands()
            }
          }
        } catch (fetchError) {
          console.warn('Could not preload default tokens:', fetchError)
        }
      }

      if (storedTokens) {
        const brandNames = extractBrandNames(storedTokens)
        const selectedBrand = brandNames[0] || null
        const flattened = selectedBrand
          ? flattenSemanticTokens(storedTokens, selectedBrand)
          : []

        set({
          tokens: storedTokens,
          brands: storedBrands,
          selectedBrand,
          flattenedTokens: flattened,
          isInitialized: true,
          isLoading: false
        })
      } else {
        set({
          isInitialized: true,
          isLoading: false
        })
      }
    } catch (error) {
      console.error('Failed to initialize store:', error)
      set({ isLoading: false, isInitialized: true })
    }
  },

  // Load tokens from uploaded JSON file
  loadTokensFromFile: async (jsonData: OrbitTokensJson) => {
    set({ isLoading: true })

    try {
      // Validate structure
      if (!jsonData.global || !jsonData.semantic) {
        throw new Error('Invalid token file structure. Must have global and semantic sections.')
      }

      // Extract brand names and sync with IndexedDB
      const brandNames = extractBrandNames(jsonData)

      // Clear existing brands and add new ones
      await db.brands.clear()
      for (const name of brandNames) {
        await dbOperations.addBrand(name)
      }

      // Store tokens
      await dbOperations.setGlobalTokens(jsonData)

      // Update state
      const brands = await dbOperations.getAllBrands()
      const selectedBrand = brandNames[0] || null
      const flattened = selectedBrand
        ? flattenSemanticTokens(jsonData, selectedBrand)
        : []

      set({
        tokens: jsonData,
        brands,
        selectedBrand,
        flattenedTokens: flattened,
        isLoading: false,
        hasUnsavedChanges: false
      })
    } catch (error) {
      console.error('Failed to load tokens:', error)
      set({ isLoading: false })
      throw error
    }
  },

  // Select a brand to edit
  selectBrand: (brandName: string) => {
    const { tokens } = get()
    if (!tokens) return

    const flattened = flattenSemanticTokens(tokens, brandName)

    set({
      selectedBrand: brandName,
      flattenedTokens: flattened
    })
  },

  // Update a token value
  updateToken: (path: string, newValue: string) => {
    const { tokens, selectedBrand } = get()
    if (!tokens || !selectedBrand) return

    const updatedTokens = updateTokenValue(tokens, path, selectedBrand, newValue)
    const flattened = flattenSemanticTokens(updatedTokens, selectedBrand)

    set({
      tokens: updatedTokens,
      flattenedTokens: flattened,
      hasUnsavedChanges: true
    })
  },

  // Save changes to IndexedDB
  saveChanges: async () => {
    const { tokens } = get()
    if (!tokens) return

    try {
      await dbOperations.setGlobalTokens(tokens)
      set({ hasUnsavedChanges: false })
    } catch (error) {
      console.error('Failed to save changes:', error)
      throw error
    }
  },

  // Add a new brand
  addBrand: async (brandName: string, sourceBrand?: string) => {
    const { tokens } = get()
    if (!tokens) return

    // Check if brand already exists
    const existingBrands = extractBrandNames(tokens)
    if (existingBrands.includes(brandName)) {
      throw new Error(`Brand "${brandName}" already exists`)
    }

    // Add brand to tokens
    const updatedTokens = addBrandToTokens(tokens, brandName, sourceBrand)

    // Add to IndexedDB
    await dbOperations.addBrand(brandName)
    await dbOperations.setGlobalTokens(updatedTokens)

    // Update state
    const brands = await dbOperations.getAllBrands()
    const flattened = flattenSemanticTokens(updatedTokens, brandName)

    set({
      tokens: updatedTokens,
      brands,
      selectedBrand: brandName,
      flattenedTokens: flattened,
      hasUnsavedChanges: false
    })
  },

  // Add a new brand with custom generated colors
  addBrandWithColors: async (brandName: string, templateBrand: string, brandColors: GeneratedBrandColors, radius?: RadiusSize) => {
    const { tokens } = get()
    if (!tokens) return

    // Check if brand already exists
    const existingBrands = extractBrandNames(tokens)
    if (existingBrands.includes(brandName)) {
      throw new Error(`Brand "${brandName}" already exists`)
    }

    // Add brand to tokens with custom colors and optional radius
    const updatedTokens = addBrandWithCustomColors(tokens, brandName, templateBrand, brandColors, radius)

    // Add to IndexedDB
    await dbOperations.addBrand(brandName)
    await dbOperations.setGlobalTokens(updatedTokens)

    // Update state
    const brands = await dbOperations.getAllBrands()
    const flattened = flattenSemanticTokens(updatedTokens, brandName)

    set({
      tokens: updatedTokens,
      brands,
      selectedBrand: brandName,
      flattenedTokens: flattened,
      hasUnsavedChanges: false
    })
  },

  // Delete a brand
  deleteBrand: async (brandName: string) => {
    const { tokens, selectedBrand } = get()
    if (!tokens) return

    // Don't delete the last brand
    const existingBrands = extractBrandNames(tokens)
    if (existingBrands.length <= 1) {
      throw new Error('Cannot delete the last brand')
    }

    // Remove brand from tokens
    const updatedTokens = removeBrandFromTokens(tokens, brandName)

    // Remove from IndexedDB
    const brand = await dbOperations.getBrandByName(brandName)
    if (brand?.id) {
      await dbOperations.deleteBrand(brand.id)
    }
    await dbOperations.setGlobalTokens(updatedTokens)

    // Update state
    const brands = await dbOperations.getAllBrands()
    const newBrands = extractBrandNames(updatedTokens)
    const newSelectedBrand = selectedBrand === brandName
      ? newBrands[0] || null
      : selectedBrand

    const flattened = newSelectedBrand
      ? flattenSemanticTokens(updatedTokens, newSelectedBrand)
      : []

    set({
      tokens: updatedTokens,
      brands,
      selectedBrand: newSelectedBrand,
      flattenedTokens: flattened,
      hasUnsavedChanges: false
    })
  },

  // Export semantic-brand.json for selected brand
  exportSemanticBrand: (brandName?: string) => {
    const { tokens, selectedBrand } = get()
    if (!tokens) return

    const targetBrand = brandName || selectedBrand
    if (!targetBrand) return

    const exportData = createSemanticBrandExport(tokens, targetBrand)
    const filename = generateExportFilename(targetBrand)

    downloadJson(exportData, filename)
  },

  // Export full orbit-tokens.json with all brands
  exportFullTokens: () => {
    const { tokens } = get()
    if (!tokens) return

    downloadJson(tokens, 'orbit-tokens.json')
  },

  // Import semantic-brand.json
  importSemanticBrand: async (jsonData: unknown) => {
    const { tokens } = get()
    if (!tokens) {
      return { success: false, error: 'No tokens loaded. Please upload orbit-tokens.json first.' }
    }

    try {
      // Validate structure
      if (!jsonData || typeof jsonData !== 'object' || !('semantic' in jsonData)) {
        return { success: false, error: 'Invalid file format. Must have a "semantic" section.' }
      }

      const result = mergeSemanticBrandImport(tokens, jsonData as { semantic: Record<string, unknown> })

      if (!result.brandName) {
        return { success: false, error: 'Could not detect brand name in the imported file.' }
      }

      // Save merged tokens
      await dbOperations.setGlobalTokens(result.tokens)

      // Check if brand exists, add if not
      const existingBrands = extractBrandNames(result.tokens)
      if (!existingBrands.includes(result.brandName)) {
        await dbOperations.addBrand(result.brandName)
      }

      // Update state
      const brands = await dbOperations.getAllBrands()
      const flattened = flattenSemanticTokens(result.tokens, result.brandName)

      set({
        tokens: result.tokens,
        brands,
        selectedBrand: result.brandName,
        flattenedTokens: flattened,
        hasUnsavedChanges: false
      })

      return { success: true, brandName: result.brandName }
    } catch (error) {
      console.error('Failed to import semantic brand:', error)
      return { success: false, error: String(error) }
    }
  },

  // Advanced Export - returns result only, component handles download
  exportAdvanced: (options: ExportOptions): ExportResult => {
    const { tokens } = get()
    return executeExport(tokens, options)
  },

  getAvailableBrands: (): string[] => {
    const { tokens } = get()
    if (!tokens) return []
    return extractBrandNamesFromTokens(tokens)
  },

  // View Mode Actions
  setViewMode: (mode) => set({ viewMode: mode }),

  setJsonEditorError: (error) => set({ jsonEditorError: error }),

  updateTokensFromJson: (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString) as OrbitTokensJson

      // Validate structure
      if (!parsed.global || !parsed.semantic) {
        return { success: false, error: 'Invalid structure: missing "global" or "semantic" section' }
      }

      const { selectedBrand, brands: currentBrands } = get()
      const newBrandNames = extractBrandNames(parsed)

      // Update selected brand if it no longer exists
      const newSelectedBrand = selectedBrand && newBrandNames.includes(selectedBrand)
        ? selectedBrand
        : newBrandNames[0] || null

      const flattened = newSelectedBrand
        ? flattenSemanticTokens(parsed, newSelectedBrand)
        : []

      // Create updated brands list with IDs from current brands where possible
      const now = new Date()
      const updatedBrands: Brand[] = newBrandNames.map(name => {
        const existing = currentBrands.find(b => b.name === name)
        return existing || { name, createdAt: now, updatedAt: now }
      })

      set({
        tokens: parsed,
        brands: updatedBrands,
        selectedBrand: newSelectedBrand,
        flattenedTokens: flattened,
        hasUnsavedChanges: true,
        jsonEditorError: null
      })

      return { success: true }
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Invalid JSON'
      set({ jsonEditorError: error })
      return { success: false, error }
    }
  },

  // Token Navigation
  setSelectedTokenPath: (path) => set({ selectedTokenPath: path }),
  setTokenTreeOpen: (open) => set({ isTokenTreeOpen: open }),

  // Sidebar Navigation
  setSidebarView: (view) => set({ sidebarView: view }),
  navigateToThemes: () => set({ sidebarView: { type: 'themes' } }),
  navigateToGlobalSection: (section) => set({ sidebarView: { type: 'globalSection', section } }),
  navigateToColorFamily: (familyName) => set({ sidebarView: { type: 'colorFamily', familyName } }),

  // Global Token CRUD
  addColorFamily: async (name, steps) => {
    const { tokens } = get()
    if (!tokens) return

    // Check if family already exists
    if (tokens.global?.colors?.[name]) {
      throw new Error(`Color family "${name}" already exists`)
    }

    const newTokens = JSON.parse(JSON.stringify(tokens)) as OrbitTokensJson
    if (!newTokens.global.colors) {
      newTokens.global.colors = {}
    }
    newTokens.global.colors[name] = steps

    await dbOperations.setGlobalTokens(newTokens)
    set({ tokens: newTokens, hasUnsavedChanges: false })
  },

  deleteColorFamily: async (name) => {
    const { tokens } = get()
    if (!tokens?.global?.colors?.[name]) return

    const newTokens = JSON.parse(JSON.stringify(tokens)) as OrbitTokensJson
    delete newTokens.global.colors[name]

    await dbOperations.setGlobalTokens(newTokens)
    set({ tokens: newTokens, hasUnsavedChanges: false, sidebarView: { type: 'globalSection', section: 'colors' } })
  },

  addGlobalToken: async (category, name, value, type) => {
    const { tokens } = get()
    if (!tokens) return

    const newTokens = JSON.parse(JSON.stringify(tokens)) as OrbitTokensJson

    // Handle nested typography structure
    if (category.startsWith('typography.')) {
      const subCategory = category.split('.')[1]
      if (!newTokens.global.typography) {
        newTokens.global.typography = {}
      }
      const typography = newTokens.global.typography as Record<string, Record<string, SingleValueToken>>
      if (!typography[subCategory]) {
        typography[subCategory] = {}
      }
      typography[subCategory][name] = { $value: value, $type: type as TokenType }
    } else {
      // Handle flat categories (spacing, radius, opacity, borderWidth)
      if (!newTokens.global[category]) {
        newTokens.global[category] = {}
      }
      (newTokens.global[category] as Record<string, SingleValueToken>)[name] = { $value: value, $type: type as TokenType }
    }

    await dbOperations.setGlobalTokens(newTokens)
    set({ tokens: newTokens, hasUnsavedChanges: false })
  },

  updateGlobalToken: async (category, name, value) => {
    const { tokens } = get()
    if (!tokens) return

    const newTokens = JSON.parse(JSON.stringify(tokens)) as OrbitTokensJson

    if (category.startsWith('typography.')) {
      const subCategory = category.split('.')[1]
      const typography = newTokens.global.typography as Record<string, Record<string, SingleValueToken>> | undefined
      if (typography?.[subCategory]?.[name]) {
        typography[subCategory][name].$value = value
      }
    } else {
      const cat = newTokens.global[category] as Record<string, SingleValueToken> | undefined
      if (cat?.[name]) {
        cat[name].$value = value
      }
    }

    await dbOperations.setGlobalTokens(newTokens)
    set({ tokens: newTokens, hasUnsavedChanges: false })
  },

  deleteGlobalToken: async (category, name) => {
    const { tokens } = get()
    if (!tokens) return

    const newTokens = JSON.parse(JSON.stringify(tokens)) as OrbitTokensJson

    if (category.startsWith('typography.')) {
      const subCategory = category.split('.')[1]
      const typography = newTokens.global.typography as Record<string, Record<string, SingleValueToken>> | undefined
      if (typography?.[subCategory]?.[name]) {
        delete typography[subCategory][name]
      }
    } else {
      const cat = newTokens.global[category] as Record<string, SingleValueToken> | undefined
      if (cat?.[name]) {
        delete cat[name]
      }
    }

    await dbOperations.setGlobalTokens(newTokens)
    set({ tokens: newTokens, hasUnsavedChanges: false })
  }
}))
