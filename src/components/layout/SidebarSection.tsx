import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarSectionProps {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: ReactNode
  action?: ReactNode
  count?: number
}

export function SidebarSection({
  title,
  isExpanded,
  onToggle,
  children,
  action,
  count
}: SidebarSectionProps) {
  return (
    <div className="border-b border-sidebar-border">
      <div
        className="flex items-center justify-between px-2 py-2 cursor-pointer hover:bg-sidebar-accent/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-1">
          <ChevronRight
            className={cn(
              "h-4 w-4 text-sidebar-foreground/60 transition-transform duration-200",
              isExpanded && "rotate-90"
            )}
          />
          <span className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
            {title}
          </span>
          {count !== undefined && (
            <span className="text-xs text-sidebar-foreground/40 ml-1">
              ({count})
            </span>
          )}
        </div>
        {action && (
          <div onClick={(e) => e.stopPropagation()}>
            {action}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="pb-2">
          {children}
        </div>
      )}
    </div>
  )
}

interface SidebarSubSectionProps {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children?: ReactNode
  action?: ReactNode
  count?: number
  onClick?: () => void
}

export function SidebarSubSection({
  title,
  isExpanded,
  onToggle,
  children,
  action,
  count,
  onClick
}: SidebarSubSectionProps) {
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      onToggle()
    }
  }

  return (
    <div>
      <div
        className="flex items-center justify-between px-4 py-1.5 cursor-pointer hover:bg-sidebar-accent/50 transition-colors"
        onClick={handleClick}
      >
        <div className="flex items-center gap-1">
          {children && (
            <ChevronRight
              className={cn(
                "h-3 w-3 text-sidebar-foreground/50 transition-transform duration-200",
                isExpanded && "rotate-90"
              )}
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
              }}
            />
          )}
          <span className="text-sm text-sidebar-foreground capitalize">
            {title}
          </span>
          {count !== undefined && (
            <span className="text-xs text-sidebar-foreground/40 ml-1">
              ({count})
            </span>
          )}
        </div>
        {action && (
          <div onClick={(e) => e.stopPropagation()}>
            {action}
          </div>
        )}
      </div>

      {isExpanded && children && (
        <div className="ml-4">
          {children}
        </div>
      )}
    </div>
  )
}

interface SidebarItemProps {
  children: ReactNode
  isSelected?: boolean
  onClick?: () => void
  action?: ReactNode
  className?: string
}

export function SidebarItem({
  children,
  isSelected,
  onClick,
  action,
  className
}: SidebarItemProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-6 py-1.5 cursor-pointer transition-colors group",
        isSelected
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "hover:bg-sidebar-accent/50 text-sidebar-foreground",
        className
      )}
      onClick={onClick}
    >
      <span className="text-sm truncate">{children}</span>
      {action && (
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {action}
        </div>
      )}
    </div>
  )
}

export function SidebarAddButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-5 w-5 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
      onClick={onClick}
    >
      <span className="text-lg leading-none">+</span>
    </Button>
  )
}
