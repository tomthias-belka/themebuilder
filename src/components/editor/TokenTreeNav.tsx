import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, PanelLeftClose, PanelLeft } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { buildTokenTree } from '@/utils/tokenFlattener'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { TokenTreeNode } from '@/types/tokens'

interface TreeNodeProps {
  node: TokenTreeNode
  level: number
  onSelect: (path: string) => void
  selectedPath: string | null
}

function TreeNode({ node, level, onSelect, selectedPath }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0)
  const hasChildren = node.children.length > 0
  const isLeaf = node.tokenCount === 1 && node.children.length === 0
  const isSelected = selectedPath === node.path

  const handleClick = () => {
    if (isLeaf) {
      onSelect(node.path)
    } else {
      setIsExpanded(!isExpanded)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'flex items-center gap-1 py-1 px-2 rounded-sm cursor-pointer text-sm',
          'hover:bg-accent/50 transition-colors',
          'focus:outline-none focus:ring-1 focus:ring-ring',
          isSelected && 'bg-accent text-accent-foreground',
          level > 0 && 'ml-3'
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {/* Expand/collapse icon */}
        {hasChildren ? (
          <span className="w-4 h-4 flex items-center justify-center shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </span>
        ) : (
          <span className="w-4 h-4 shrink-0" />
        )}

        {/* Node name */}
        <span className="flex-1 truncate">{node.name}</span>

        {/* Token count badge */}
        {node.tokenCount > 1 && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {node.tokenCount}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="border-l border-border/50 ml-[11px]">
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function TokenTreeNav() {
  const {
    tokens,
    selectedBrand,
    isTokenTreeOpen,
    setTokenTreeOpen,
    selectedTokenPath,
    setSelectedTokenPath
  } = useThemeStore()

  // Build tree from tokens
  const tree = useMemo(() => {
    if (!tokens || !selectedBrand) return []
    return buildTokenTree(tokens, selectedBrand)
  }, [tokens, selectedBrand])

  // Toggle button when collapsed
  if (!isTokenTreeOpen) {
    return (
      <div className="border-r border-border bg-muted/30 flex flex-col items-center py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTokenTreeOpen(true)}
          title="Open token navigator"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-56 border-r border-border bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-border shrink-0">
        <span className="text-sm font-medium">Tokens</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setTokenTreeOpen(false)}
          title="Close token navigator"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {tree.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tokens available
            </p>
          ) : (
            tree.map((node) => (
              <TreeNode
                key={node.path}
                node={node}
                level={0}
                onSelect={setSelectedTokenPath}
                selectedPath={selectedTokenPath}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
