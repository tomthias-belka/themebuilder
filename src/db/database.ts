import Dexie, { type EntityTable } from 'dexie'
import type { Brand, ClaraTokensJson } from '@/types/tokens'

// Database schema for storing brands and tokens
interface OrbitDatabase extends Dexie {
  brands: EntityTable<Brand, 'id'>
  globalTokens: EntityTable<{ id: number; data: ClaraTokensJson }, 'id'>
}

const db = new Dexie('OrbitThemeBuilder') as OrbitDatabase

// Define schema
db.version(1).stores({
  brands: '++id, name, createdAt, updatedAt',
  globalTokens: 'id' // Single entry with id=1
})

// Export database instance
export { db }

// Database operations
export const dbOperations = {
  // Brand operations
  async getAllBrands(): Promise<Brand[]> {
    return db.brands.toArray()
  },

  async getBrandByName(name: string): Promise<Brand | undefined> {
    return db.brands.where('name').equals(name).first()
  },

  async addBrand(name: string): Promise<number> {
    const now = new Date()
    const id = await db.brands.add({
      name,
      createdAt: now,
      updatedAt: now
    })
    return id as number
  },

  async deleteBrand(id: number): Promise<void> {
    await db.brands.delete(id)
  },

  async updateBrandName(id: number, newName: string): Promise<void> {
    await db.brands.update(id, {
      name: newName,
      updatedAt: new Date()
    })
  },

  // Global tokens operations (single entry)
  async getGlobalTokens(): Promise<ClaraTokensJson | null> {
    const entry = await db.globalTokens.get(1)
    return entry?.data ?? null
  },

  async setGlobalTokens(tokens: ClaraTokensJson): Promise<void> {
    await db.globalTokens.put({ id: 1, data: tokens })
  },

  async clearGlobalTokens(): Promise<void> {
    await db.globalTokens.delete(1)
  },

  // Clear all data
  async clearAll(): Promise<void> {
    await db.brands.clear()
    await db.globalTokens.clear()
  }
}
