# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Orbit Theme Builder is a React-based design token editor for managing multi-brand themes. It allows users to edit semantic design tokens across multiple brands (e.g., orbit, mooney, atm, comersud) and export/import brand-specific token files.

## Commands

```bash
npm run dev       # Start development server (Vite)
npm run build     # Type-check and build for production
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

## Architecture

### Data Flow

1. **Token Source**: Loads from `public/orbit-tokens.json` on first run, then persists in IndexedDB (database: `OrbitThemeBuilder`)
2. **State Management**: Zustand store ([src/store/themeStore.ts](src/store/themeStore.ts)) manages all token state and operations
3. **Persistence**: Dexie (IndexedDB wrapper) in [src/db/database.ts](src/db/database.ts)

### Token Structure

The token system uses a multi-brand architecture defined in [src/types/tokens.ts](src/types/tokens.ts):

- **Global tokens**: Single-value primitives (colors, radius, typography, spacing)
- **Semantic tokens**: Multi-brand values where each token has `$value: { brandA: "...", brandB: "..." }`
- **Aliases**: Reference format `{path.to.token}` resolving to global or semantic values

### Key Utilities

- [src/utils/tokenFlattener.ts](src/utils/tokenFlattener.ts): Converts nested token structure to flat array for UI, extracts brand names, updates token values immutably
- [src/utils/tokenResolver.ts](src/utils/tokenResolver.ts): Resolves alias references recursively, provides autocomplete suggestions
- [src/utils/exportFormat.ts](src/utils/exportFormat.ts): Creates single-brand export files (`semantic-{brand}.json`), merges imports

### UI Components

- Layout: [src/components/layout/](src/components/layout/) - AppLayout, Sidebar (brand selection), Header
- Editor: [src/components/editor/TokenEditor.tsx](src/components/editor/TokenEditor.tsx) - Token table grouped by category
- Modals: [src/components/modals/](src/components/modals/) - Upload, Import, Add/Delete theme dialogs
- UI primitives: Radix UI + shadcn/ui in [src/components/ui/](src/components/ui/)

### Path Alias

Uses `@/` alias pointing to `src/` directory (configured in [vite.config.ts](vite.config.ts)).

## Token File Format

**Input file** (`orbit-tokens.json`):
```json
{
  "global": { "colors": { "blue": { "70": { "$value": "#0072ef", "$type": "color" }}}},
  "semantic": {
    "brand": { "primary": { "main": { "$value": { "orbit": "{colors.blue.70}", "mooney": "#..." }, "$type": "color" }}},
    "colors": { "background": { "page": { "$value": { "orbit": "#fff", "mooney": "#..." }, "$type": "color" }}}
  }
}
```

**Export file** (`semantic-{brand}.json`):
```json
{
  "semantic": {
    "brand": { "primary": { "main": { "$value": { "orbit": "{colors.blue.70}" }, "$type": "color" }}}
  }
}
```
