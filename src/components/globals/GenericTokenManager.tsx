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
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import type { SingleValueToken } from '@/types/tokens'
import { sortByTShirtSize } from '@/utils/tshirtSizeSort'

interface GenericTokenManagerProps {
  section: 'spacing' | 'radius'
  onBack: () => void
}

const SECTION_CONFIG = {
  spacing: {
    title: 'Spacing',
    type: 'spacing' as const,
    placeholder: '16px',
    description: 'Spacing values for margins, padding, and gaps'
  },
  radius: {
    title: 'Radius',
    type: 'borderRadius' as const,
    placeholder: '8px',
    description: 'Border radius values for rounded corners'
  }
}

export function GenericTokenManager({ section, onBack }: GenericTokenManagerProps) {
  const { tokens, addGlobalToken, updateGlobalToken, deleteGlobalToken } = useThemeStore()
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newValue, setNewValue] = useState('')
  const [editingToken, setEditingToken] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const config = SECTION_CONFIG[section]

  const tokenList = useMemo(() => {
    const data = tokens?.global?.[section] as Record<string, SingleValueToken> | undefined
    if (!data) return []
    return Object.entries(data)
      .map(([name, token]) => ({
        name,
        value: token.$value,
        type: token.$type
      }))
      .sort((a, b) => sortByTShirtSize(a.name, b.name))
  }, [tokens, section])

  const handleAdd = async () => {
    if (!newName.trim() || !newValue.trim()) return

    try {
      await addGlobalToken(section, newName.trim(), newValue.trim(), config.type)
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
      await updateGlobalToken(section, name, editValue.trim())
      setEditingToken(null)
      setEditValue('')
    } catch (error) {
      console.error('Failed to update token:', error)
    }
  }

  const handleDelete = async (name: string) => {
    try {
      await deleteGlobalToken(section, name)
    } catch (error) {
      console.error('Failed to delete token:', error)
    }
  }

  const startEditing = (name: string, value: string) => {
    setEditingToken(name)
    setEditValue(value)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">{config.title}</h2>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {/* Add Button */}
      {!isAdding && (
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add {config.title} Token
        </Button>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <h3 className="font-medium">Add New Token</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Name</Label>
              <Input
                id="new-name"
                placeholder="e.g., lg, xl, 2xl"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-value">Value</Label>
              <Input
                id="new-value"
                placeholder={config.placeholder}
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
              <TableHead className="w-[150px]">Alias</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokenList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No {section} tokens found
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
                      >
                        {token.value}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-muted-foreground">
                      {`{${section}.${token.name}}`}
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
    </div>
  )
}
