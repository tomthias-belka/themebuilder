# GitHub Integration - Implementazione Futura

Questo documento contiene tutte le informazioni sull'integrazione GitHub che è stata sviluppata ma rimossa a causa di problemi CORS con GitHub Pages.

## Problema Riscontrato

L'integrazione GitHub OAuth Device Flow fallisce quando deployata su GitHub Pages con errore CORS:

```
Access to fetch at 'https://github.com/login/device/code' from origin 'https://tomthias-belka.github.io'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Causa del Problema

GitHub OAuth Device Flow richiede chiamate server-side o domini autorizzati. GitHub Pages è un hosting statico e le chiamate cross-origin agli endpoint OAuth vengono bloccate dal browser.

## Soluzione Proposta: Personal Access Token (PAT)

### Vantaggi del PAT
- ✅ Nessun problema CORS: GitHub API accetta PAT via Authorization header
- ✅ Nessun backend necessario: chiamate dirette da browser
- ✅ Soluzione immediata: funziona senza infrastruttura aggiuntiva
- ✅ UX semplice: l'utente incolla il token in una modal

### Piano di Implementazione

Il piano completo è documentato in: `.claude/plans/streamed-stirring-hejlsberg.md`

**Modifiche necessarie:**

1. **`src/utils/githubAuth.ts`**
   - Rimuovere: `requestDeviceCode()`, `pollForAccessToken()`
   - Aggiungere: `validateAndSavePAT(token: string)`
   - Mantenere: funzioni encryption/storage token (riutilizzabili per PAT)

2. **`src/components/modals/GitHubAuthModal.tsx`**
   - Sostituire UI OAuth con form input token
   - Aggiungere istruzioni per creare PAT
   - Link: https://github.com/settings/tokens
   - Scopes richiesti: `repo` (read/write)

3. **`src/store/themeStore.ts`**
   - Sostituire: `authenticateWithGitHub()` con `authenticateWithPAT()`
   - Mantenere: `syncFromGitHub()`, `pushToGitHub()`, `logoutFromGitHub()`

4. **`src/App.tsx`**
   - Aggiornare handler: `handleAuthenticate()` per accettare token string

**Files che NON necessitano modifiche:**
- `src/utils/githubApi.ts` ✓ (già compatibile con PAT)
- `src/components/empty/EmptyState.tsx` ✓ (cambiamento testo minore)
- Push/sync logic ✓ (già implementata)

## Codice Sorgente Completo

### 1. GitHub OAuth Authentication (`src/utils/githubAuth.ts`)

```typescript
/**
 * GitHub OAuth Device Flow Authentication
 *
 * Implements GitHub's device flow for OAuth authentication without redirects.
 * Perfect for SPAs deployed on static hosts like GitHub Pages.
 *
 * @see https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow
 */

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || ''

interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

interface GitHubUser {
  login: string
  name: string
  avatar_url: string
}

export interface GitHubAuthState {
  isAuthenticated: boolean
  accessToken: string | null
  username: string | null
  avatarUrl: string | null
}

/**
 * Step 1: Request a device code from GitHub
 */
export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const response = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: 'repo',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to request device code')
  }

  return response.json()
}

/**
 * Step 2: Poll for access token
 */
export async function pollForAccessToken(
  deviceCode: string,
  interval: number,
  onProgress?: (status: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          }),
        })

        const data = await response.json()

        if (data.error) {
          if (data.error === 'authorization_pending') {
            onProgress?.('Waiting for authorization...')
            return // Continue polling
          }
          if (data.error === 'slow_down') {
            onProgress?.('Slowing down...')
            return // Continue polling
          }
          if (data.error === 'expired_token') {
            clearInterval(pollInterval)
            reject(new Error('Device code expired'))
            return
          }
          if (data.error === 'access_denied') {
            clearInterval(pollInterval)
            reject(new Error('Access denied by user'))
            return
          }
          clearInterval(pollInterval)
          reject(new Error(data.error_description || data.error))
          return
        }

        if (data.access_token) {
          clearInterval(pollInterval)
          resolve(data.access_token)
        }
      } catch (error) {
        clearInterval(pollInterval)
        reject(error)
      }
    }, interval * 1000)
  })
}

/**
 * Fetch authenticated user info from GitHub
 */
export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user info')
  }

  return response.json()
}

/**
 * Encrypt access token before storing in localStorage
 */
async function encryptToken(token: string): Promise<string> {
  // For simplicity, we'll use base64 encoding
  // In production, consider using Web Crypto API for proper encryption
  return btoa(token)
}

/**
 * Decrypt access token from localStorage
 */
async function decryptToken(encrypted: string): Promise<string> {
  return atob(encrypted)
}

/**
 * Save auth state to localStorage
 */
export async function saveAuthState(state: GitHubAuthState): Promise<void> {
  if (state.accessToken) {
    const encrypted = await encryptToken(state.accessToken)
    localStorage.setItem('github_auth', JSON.stringify({
      ...state,
      accessToken: encrypted,
    }))
  }
}

/**
 * Load auth state from localStorage
 */
export async function loadAuthState(): Promise<GitHubAuthState | null> {
  const stored = localStorage.getItem('github_auth')
  if (!stored) return null

  try {
    const parsed = JSON.parse(stored)
    if (parsed.accessToken) {
      parsed.accessToken = await decryptToken(parsed.accessToken)
    }
    return parsed
  } catch {
    return null
  }
}

/**
 * Clear auth state from localStorage
 */
export function clearAuthState(): void {
  localStorage.removeItem('github_auth')
}

/**
 * Complete OAuth flow: request device code, poll for token, fetch user info
 */
export async function authenticateWithGitHub(
  onDeviceCode: (userCode: string, verificationUri: string) => void,
  onProgress?: (status: string) => void
): Promise<GitHubAuthState> {
  // Step 1: Request device code
  const deviceCodeData = await requestDeviceCode()

  // Show user code to user
  onDeviceCode(deviceCodeData.user_code, deviceCodeData.verification_uri)

  // Step 2: Poll for access token
  const accessToken = await pollForAccessToken(
    deviceCodeData.device_code,
    deviceCodeData.interval,
    onProgress
  )

  // Step 3: Fetch user info
  const user = await fetchGitHubUser(accessToken)

  const authState: GitHubAuthState = {
    isAuthenticated: true,
    accessToken,
    username: user.login,
    avatarUrl: user.avatar_url,
  }

  // Save to localStorage
  await saveAuthState(authState)

  return authState
}
```

### 2. GitHub API Client (`src/utils/githubApi.ts`)

```typescript
/**
 * GitHub API Client
 *
 * Provides methods to interact with GitHub repository contents API
 * for reading and writing token files.
 */

const REPO_OWNER = import.meta.env.VITE_GITHUB_REPO_OWNER || 'tomthias-belka'
const REPO_NAME = import.meta.env.VITE_GITHUB_REPO_NAME || 'themebuilder'
const TOKENS_PATH = import.meta.env.VITE_GITHUB_TOKENS_PATH || 'TOKENS'

interface GitHubFileContent {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string
  type: 'file' | 'dir'
  content?: string
  encoding?: string
}

interface GitHubCommitResponse {
  content: GitHubFileContent
  commit: {
    sha: string
    message: string
  }
}

/**
 * Base fetch with authentication
 */
async function githubFetch(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message || `GitHub API error: ${response.status}`)
  }

  return response
}

/**
 * List files in the TOKENS directory
 */
export async function listTokenFiles(accessToken: string): Promise<GitHubFileContent[]> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${TOKENS_PATH}`
  const response = await githubFetch(url, accessToken)
  return response.json()
}

/**
 * Get file content from repository
 */
export async function getFileContent(
  accessToken: string,
  filePath: string
): Promise<string> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`
  const response = await githubFetch(url, accessToken)
  const data: GitHubFileContent = await response.json()

  if (!data.content || data.encoding !== 'base64') {
    throw new Error('Invalid file content format')
  }

  // Decode base64 content
  return atob(data.content.replace(/\n/g, ''))
}

/**
 * Get file SHA (required for updates)
 */
export async function getFileSha(
  accessToken: string,
  filePath: string
): Promise<string | null> {
  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`
    const response = await githubFetch(url, accessToken)
    const data: GitHubFileContent = await response.json()
    return data.sha
  } catch {
    return null // File doesn't exist
  }
}

/**
 * Create or update a file in the repository
 */
export async function createOrUpdateFile(
  accessToken: string,
  filePath: string,
  content: string,
  message: string,
  sha?: string
): Promise<GitHubCommitResponse> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`

  const body: Record<string, string> = {
    message,
    content: btoa(content), // Base64 encode
    branch: 'main',
  }

  // If file exists, include SHA for update
  if (sha) {
    body.sha = sha
  }

  const response = await githubFetch(url, accessToken, {
    method: 'PUT',
    body: JSON.stringify(body),
  })

  return response.json()
}

/**
 * Create a new branch
 */
export async function createBranch(
  accessToken: string,
  branchName: string,
  fromBranch: string = 'main'
): Promise<void> {
  // Get the SHA of the base branch
  const refUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/${fromBranch}`
  const refResponse = await githubFetch(refUrl, accessToken)
  const refData = await refResponse.json()
  const baseSha = refData.object.sha

  // Create new branch
  const createUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`
  await githubFetch(createUrl, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    }),
  })
}

/**
 * Create a pull request
 */
export async function createPullRequest(
  accessToken: string,
  title: string,
  body: string,
  head: string,
  base: string = 'main'
): Promise<{ html_url: string; number: number }> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls`
  const response = await githubFetch(url, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      title,
      body,
      head,
      base,
    }),
  })

  return response.json()
}

/**
 * Get repository info
 */
export async function getRepositoryInfo(accessToken: string): Promise<{
  name: string
  full_name: string
  default_branch: string
}> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`
  const response = await githubFetch(url, accessToken)
  return response.json()
}

/**
 * Check rate limit status
 */
export async function getRateLimit(accessToken: string): Promise<{
  limit: number
  remaining: number
  reset: number
}> {
  const url = 'https://api.github.com/rate_limit'
  const response = await githubFetch(url, accessToken)
  const data = await response.json()
  return data.resources.core
}
```

### 3. Store Implementation (`src/store/themeStore.ts`)

Sezione GitHub dello store Zustand:

```typescript
interface ThemeState {
  // ... altri campi dello store

  // GitHub Integration
  githubAuth: GitHubAuthState
  githubSync: {
    status: 'idle' | 'syncing' | 'success' | 'error'
    lastSync: Date | null
    error: string | null
  }

  // GitHub Actions
  authenticateWithGitHub: (
    onDeviceCode: (userCode: string, verificationUri: string) => void,
    onProgress?: (status: string) => void
  ) => Promise<void>

  syncFromGitHub: () => Promise<void>
  pushToGitHub: () => Promise<void>
  logoutFromGitHub: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // ... altri campi

      githubAuth: {
        isAuthenticated: false,
        accessToken: null,
        username: null,
        avatarUrl: null,
      },

      githubSync: {
        status: 'idle',
        lastSync: null,
        error: null,
      },

      // GitHub authentication
      authenticateWithGitHub: async (onDeviceCode, onProgress) => {
        try {
          const authState = await authenticateWithGitHub(onDeviceCode, onProgress)
          set({ githubAuth: authState })
        } catch (error) {
          throw error
        }
      },

      // Sync from GitHub
      syncFromGitHub: async () => {
        const { githubAuth } = get()
        if (!githubAuth.isAuthenticated || !githubAuth.accessToken) {
          throw new Error('Not authenticated')
        }

        set({ githubSync: { status: 'syncing', lastSync: null, error: null } })

        try {
          // 1. List files in TOKENS directory
          const files = await listTokenFiles(githubAuth.accessToken)

          // 2. Read orbit-tokens.json
          const orbitTokensFile = files.find(f => f.name === 'orbit-tokens.json')
          if (!orbitTokensFile) {
            throw new Error('orbit-tokens.json not found in repository')
          }

          const content = await getFileContent(githubAuth.accessToken, orbitTokensFile.path)
          const tokens: TokenStructure = JSON.parse(content)

          // 3. Update store with synced tokens
          set({
            tokens,
            githubSync: {
              status: 'success',
              lastSync: new Date(),
              error: null
            }
          })

          // 4. Save to IndexedDB
          await db.settings.put({ id: 1, data: tokens })

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          set({
            githubSync: {
              status: 'error',
              lastSync: null,
              error: errorMessage
            }
          })
          throw error
        }
      },

      // Push to GitHub
      pushToGitHub: async () => {
        const { githubAuth, tokens } = get()
        if (!githubAuth.isAuthenticated || !githubAuth.accessToken) {
          throw new Error('Not authenticated')
        }
        if (!tokens) {
          throw new Error('No tokens to push')
        }

        try {
          // 1. Get current file SHA
          const sha = await getFileSha(
            githubAuth.accessToken,
            `${TOKENS_PATH}/orbit-tokens.json`
          )

          // 2. Push orbit-tokens.json
          await createOrUpdateFile(
            githubAuth.accessToken,
            `${TOKENS_PATH}/orbit-tokens.json`,
            JSON.stringify(tokens, null, 2),
            'Update tokens via Orbit Theme Builder',
            sha || undefined
          )

          // 3. Export and push semantic-{brand}.json files
          const brands = extractBrandNames(tokens.semantic)
          for (const brand of brands) {
            const exportData = createBrandExport(tokens, brand)
            const brandSha = await getFileSha(
              githubAuth.accessToken,
              `${TOKENS_PATH}/semantic-${brand}.json`
            )

            await createOrUpdateFile(
              githubAuth.accessToken,
              `${TOKENS_PATH}/semantic-${brand}.json`,
              JSON.stringify(exportData, null, 2),
              `Update ${brand} tokens via Orbit Theme Builder`,
              brandSha || undefined
            )
          }

        } catch (error) {
          throw error
        }
      },

      // Logout
      logoutFromGitHub: () => {
        clearAuthState()
        set({
          githubAuth: {
            isAuthenticated: false,
            accessToken: null,
            username: null,
            avatarUrl: null,
          }
        })
      },
    }),
    {
      name: 'orbit-theme-builder',
      storage: createJSONStorage(() => indexedDBStorage),
    }
  )
)
```

### 4. UI Components

**GitHubAuthModal** (`src/components/modals/GitHubAuthModal.tsx`):

```typescript
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ExternalLink, Copy, Check } from 'lucide-react'

interface GitHubAuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthenticate: (
    onDeviceCode: (userCode: string, verificationUri: string) => void,
    onProgress?: (status: string) => void
  ) => Promise<void>
}

export function GitHubAuthModal({ open, onOpenChange, onAuthenticate }: GitHubAuthModalProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [userCode, setUserCode] = useState<string | null>(null)
  const [verificationUri, setVerificationUri] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleAuthenticate = async () => {
    setIsAuthenticating(true)
    setError(null)
    setUserCode(null)
    setVerificationUri(null)
    setProgress('')

    try {
      await onAuthenticate(
        (code, uri) => {
          setUserCode(code)
          setVerificationUri(uri)
          setProgress('Waiting for authorization...')
        },
        (status) => {
          setProgress(status)
        }
      )

      // Success - close modal
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleCopyCode = async () => {
    if (userCode) {
      await navigator.clipboard.writeText(userCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    if (!isAuthenticating) {
      setUserCode(null)
      setVerificationUri(null)
      setProgress('')
      setError(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to GitHub</DialogTitle>
          <DialogDescription>
            Authenticate with your GitHub account to sync design tokens
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!userCode && !isAuthenticating && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You'll be redirected to GitHub to authorize this application.
              </p>
              <Button onClick={handleAuthenticate} className="w-full">
                Start Authentication
              </Button>
            </div>
          )}

          {userCode && verificationUri && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <p className="font-medium mb-2">Copy this code:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded font-mono text-lg font-bold tracking-wider">
                      {userCode}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyCode}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>

              <Button
                variant="default"
                className="w-full gap-2"
                onClick={() => window.open(verificationUri, '_blank')}
              >
                Open GitHub to Authorize
                <ExternalLink className="h-4 w-4" />
              </Button>

              {progress && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progress}
                </div>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isAuthenticating && !userCode && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting to GitHub...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**EmptyState** (`src/components/empty/EmptyState.tsx`):

```typescript
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Github } from 'lucide-react'

interface EmptyStateProps {
  onSyncFromGitHub: () => void
  isLoading: boolean
  error: string | null
}

export function EmptyState({ onSyncFromGitHub, isLoading, error }: EmptyStateProps) {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-6 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome to Orbit Theme Builder</h1>
          <p className="text-muted-foreground">
            Get started by syncing your design tokens from GitHub
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={onSyncFromGitHub}
          disabled={isLoading}
          className="w-full gap-2"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Syncing from GitHub...
            </>
          ) : (
            <>
              <Github className="h-5 w-5" />
              Sync from GitHub
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          You'll need to authenticate with your GitHub account
        </p>
      </div>
    </div>
  )
}
```

## Variabili d'Ambiente

File `.env.example`:

```bash
# GitHub OAuth Configuration
# Create a GitHub OAuth App at: https://github.com/settings/developers
# Enable Device Flow in your OAuth App settings

# Your GitHub OAuth App Client ID
VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id_here

# GitHub Repository Configuration
VITE_GITHUB_REPO_OWNER=tomthias-belka
VITE_GITHUB_REPO_NAME=themebuilder
VITE_GITHUB_TOKENS_PATH=TOKENS
```

## GitHub Actions Deployment

File `.github/workflows/deploy.yml` (righe 34-37):

```yaml
- name: Build
  run: npm run build
  env:
    VITE_GITHUB_CLIENT_ID: ${{ secrets.VITE_GITHUB_CLIENT_ID }}
```

## Istruzioni per Creare Personal Access Token (Soluzione Futura)

1. Vai su https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Nome: `Orbit Theme Builder`
4. Expiration: A scelta (90 giorni, 1 anno, o no expiration)
5. **Seleziona scopes**: ✓ `repo` (full control of private repositories)
6. Click "Generate token"
7. **Copia il token** (mostrato una volta sola!)
8. Incolla nel modal di Orbit Theme Builder

**Nota Sicurezza**: Il token viene salvato encrypted in localStorage del browser

## Testing Checklist

Dopo l'implementazione PAT:
- [ ] Modal input token mostra istruzioni corrette
- [ ] Token invalido mostra messaggio di errore
- [ ] Token valido autentica con successo
- [ ] Token salvato encrypted in localStorage
- [ ] Sync da GitHub funziona con PAT
- [ ] Push a GitHub funziona con PAT
- [ ] Logout pulisce il token
- [ ] Re-autenticazione funziona dopo logout

## Commits da Ripristinare (Se Necessario)

```bash
# Ultimo commit prima di GitHub integration
git reset --hard 774c326

# Commits GitHub da rimuovere:
1d0587a - chore: add GitHub Client ID to deployment workflow
6a0e821 - feat: implement GitHub OAuth integration and sync
```

## Files Creati per GitHub Integration

Files da rimuovere o modificare per implementazione PAT:

1. `src/utils/githubAuth.ts` - Sostituire OAuth con PAT validation
2. `src/utils/githubApi.ts` - Mantenere (già compatibile con PAT)
3. `src/components/modals/GitHubAuthModal.tsx` - Sostituire UI
4. `src/components/empty/EmptyState.tsx` - Minori aggiustamenti
5. Sezione GitHub in `src/store/themeStore.ts` - Aggiornare action

## Alternative Future

### Opzione 1: Backend Proxy
- Deploy serverless function (Vercel/Netlify)
- Proxy requests to GitHub OAuth endpoints
- Più sicuro ma richiede infrastruttura

### Opzione 2: GitHub App invece di OAuth App
- Usa GitHub App Installation tokens
- Può evitare alcuni problemi CORS
- Più complesso da configurare

### Opzione 3: Browser Extension
- Extension bypassa CORS restrictions
- Migliore UX per utenti power
- Distribuzione su Chrome/Firefox stores

---

**Data implementazione**: Dicembre 2025
**Rimosso il**: Dicembre 2025
**Motivo**: Problemi CORS con GitHub OAuth Device Flow su GitHub Pages
