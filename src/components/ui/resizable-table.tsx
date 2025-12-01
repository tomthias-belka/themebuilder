import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface ColumnDef {
  key: string
  header: string
  minWidth?: number
  defaultWidth?: number
}

interface ResizableTableProps {
  columns: ColumnDef[]
  children: React.ReactNode
  className?: string
}

export function ResizableTable({ columns, children, className }: ResizableTableProps) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {}
    columns.forEach((col) => {
      widths[col.key] = col.defaultWidth || 200
    })
    return widths
  })

  const tableRef = useRef<HTMLTableElement>(null)
  const resizingRef = useRef<{
    key: string
    startX: number
    startWidth: number
  } | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent, key: string) => {
    e.preventDefault()
    resizingRef.current = {
      key,
      startX: e.clientX,
      startWidth: columnWidths[key],
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return
      const { key, startX, startWidth } = resizingRef.current
      const diff = e.clientX - startX
      const col = columns.find((c) => c.key === key)
      const minWidth = col?.minWidth || 80
      const newWidth = Math.max(minWidth, startWidth + diff)

      setColumnWidths((prev) => ({
        ...prev,
        [key]: newWidth,
      }))
    }

    const handleMouseUp = () => {
      resizingRef.current = null
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [columnWidths, columns])

  return (
    <div className={cn('overflow-auto', className)}>
      <table
        ref={tableRef}
        className="w-full caption-bottom text-sm border-collapse"
        style={{ tableLayout: 'fixed' }}
      >
        <colgroup>
          {columns.map((col) => (
            <col key={col.key} style={{ width: columnWidths[col.key] }} />
          ))}
        </colgroup>
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50">
            {columns.map((col, index) => (
              <th
                key={col.key}
                className="h-10 px-3 text-left align-middle font-medium text-muted-foreground relative"
                style={{ width: columnWidths[col.key] }}
              >
                <span className="truncate block">{col.header}</span>
                {index < columns.length - 1 && (
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary group"
                    onMouseDown={(e) => handleMouseDown(e, col.key)}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-border group-hover:bg-primary/70 transition-colors" />
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {children}
        </tbody>
      </table>
    </div>
  )
}

interface ResizableTableRowProps {
  children: React.ReactNode
  className?: string
  id?: string
}

export function ResizableTableRow({ children, className, id }: ResizableTableRowProps) {
  return (
    <tr
      id={id}
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className
      )}
    >
      {children}
    </tr>
  )
}

interface ResizableTableCellProps {
  children: React.ReactNode
  className?: string
  title?: string
}

export function ResizableTableCell({ children, className, title }: ResizableTableCellProps) {
  return (
    <td
      className={cn('p-3 align-middle overflow-hidden', className)}
      title={title}
    >
      <div className="truncate">{children}</div>
    </td>
  )
}
