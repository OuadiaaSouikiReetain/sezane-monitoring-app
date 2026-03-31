import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export interface Column<T> {
  key: keyof T | string
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T) => string | number
  emptyMessage?: string
  className?: string
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No data available.',
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('overflow-auto', className)}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-8 text-center text-[13px] text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={keyExtractor(row)}>
                {columns.map((col) => (
                  <td key={String(col.key)} className={col.className}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
