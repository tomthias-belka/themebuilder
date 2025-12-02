import { useState, useMemo } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
// Select components are not used in this component - Tabs are used instead
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import type { SingleValueToken, TokenType } from '@/types/tokens'
import { sortByTShirtSize } from '@/utils/tshirtSizeSort'

interface TypographyManagerProps {
  onBack: () => void
}

type TypographyCategory = 'fontFamily' | 'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing'

const CATEGORY_CONFIG: Record<TypographyCategory, {
  title: string
  type: TokenType
  placeholder: string
}> = {
  fontFamily: {
    title: 'Font Family',
    type: 'fontFamily',
    placeholder: 'Inter, sans-serif'
  },
  fontSize: {
    title: 'Font Size',
    type: 'fontSize',
    placeholder: '16px'
  },
  fontWeight: {
    title: 'Font Weight',
    type: 'fontWeight',
    placeholder: '400'
  },
  lineHeight: {
    title: 'Line Height',
    type: 'lineHeight',
    placeholder: '24px'
  },
  letterSpacing: {
    title: 'Letter Spacing',
    type: 'string',
    placeholder: '0.5px'
  }
}

export function TypographyManager({ onBack }: TypographyManagerProps) {
  const { tokens, addGlobalToken, updateGlobalToken, deleteGlobalToken } = useThemeStore()
  const [activeTab, setActiveTab] = useState<TypographyCategory>('fontFamily')
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newValue, setNewValue] = useState('')
  const [editingToken, setEditingToken] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const config = CATEGORY_CONFIG[activeTab]

  const tokenList = useMemo(() => {
    const typography = tokens?.global?.typography as Record<string, Record<string, SingleValueToken>> | undefined
    const data = typography?.[activeTab]
    if (!data) return []
    return Object.entries(data)
      .map(([name, token]) => ({
        name,
        value: token.$value,
        type: token.$type
      }))
      .sort((a, b) => sortByTShirtSize(a.name, b.name))
  }, [tokens, activeTab])

  const handleAdd = async () => {
    if (!newName.trim() || !newValue.trim()) return

    try {
      await addGlobalToken(`typography.${activeTab}`, newName.trim(), newValue.trim(), config.type)
      setNewName('')
      setNewValue('')
      setIsAdding(false)
    } catch (error) {
      console.error('Failed to add token:', error)
    }
  }

  const handleUpdate = async (name: string) => {
    if (!editValue.trim()) return

    try {
      await updateGlobalToken(`typography.${activeTab}`, name, editValue.trim())
      setEditingToken(null)
      setEditValue('')
    } catch (error) {
      console.error('Failed to update token:', error)
    }
  }

  const handleDelete = async (name: string) => {
    try {
      await deleteGlobalToken(`typography.${activeTab}`, name)
    } catch (error) {
      console.error('Failed to delete token:', error)
    }
  }

  const startEditing = (name: string, value: string) => {
    setEditingToken(name)
    setEditValue(value)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TypographyCategory)
    setIsAdding(false)
    setEditingToken(null)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">Typography</h2>
          <p className="text-sm text-muted-foreground">Manage font families, sizes, weights, and more</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="fontFamily">Family</TabsTrigger>
          <TabsTrigger value="fontSize">Size</TabsTrigger>
          <TabsTrigger value="fontWeight">Weight</TabsTrigger>
          <TabsTrigger value="lineHeight">Line Height</TabsTrigger>
          <TabsTrigger value="letterSpacing">Spacing</TabsTrigger>
        </TabsList>

        {Object.keys(CATEGORY_CONFIG).map((category) => (
          <TabsContent key={category} value={category} className="space-y-4 mt-4">
            {/* Add Button */}
            {!isAdding && (
              <Button onClick={() => setIsAdding(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add {CATEGORY_CONFIG[category as TypographyCategory].title}
              </Button>
            )}

            {/* Add Form */}
            {isAdding && activeTab === category && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <h3 className="font-medium">Add New Token</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-name">Name</Label>
                    <Input
                      id="new-name"
                      placeholder="e.g., heading, body, caption"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-value">Value</Label>
                    <Input
                      id="new-value"
                      placeholder={CATEGORY_CONFIG[category as TypographyCategory].placeholder}
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAdd} disabled={!newName.trim() || !newValue.trim()}>
                    Add
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsAdding(false)
                    setNewName('')
                    setNewValue('')
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Token Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="w-[200px]">Alias</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokenList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No {CATEGORY_CONFIG[category as TypographyCategory].title.toLowerCase()} tokens found
                      </TableCell>
                    </TableRow>
                  ) : (
                    tokenList.map((token) => (
                      <TableRow key={token.name}>
                        <TableCell className="font-medium">{token.name}</TableCell>
                        <TableCell>
                          {editingToken === token.name ? (
                            <div className="flex gap-2">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="font-mono h-8"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdate(token.name)
                                  if (e.key === 'Escape') {
                                    setEditingToken(null)
                                    setEditValue('')
                                  }
                                }}
                                autoFocus
                              />
                              <Button size="sm" onClick={() => handleUpdate(token.name)}>
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => {
                                setEditingToken(null)
                                setEditValue('')
                              }}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <span
                              className="font-mono cursor-pointer hover:bg-muted px-2 py-1 rounded"
                              onClick={() => startEditing(token.name, token.value)}
                              style={category === 'fontFamily' ? { fontFamily: token.value } : undefined}
                            >
                              {token.value}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs text-muted-foreground">
                            {`{typography.${category}.${token.name}}`}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(token.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
