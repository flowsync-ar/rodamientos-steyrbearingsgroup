'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Input } from './input'
import type { ReactNode } from 'react'

export interface DataTableColumn<T> {
  key: string
  label: string
  align?: 'left' | 'right'
  render: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
}

interface DataTableProps<T> {
  rows: T[]
  columns: DataTableColumn<T>[]
  getRowKey: (row: T) => string
  emptyMessage: string
  searchPlaceholder?: string
  searchValue?: (row: T) => string
}

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  emptyMessage,
  searchPlaceholder,
  searchValue,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const filtered = useMemo(() => {
    if (!searchValue || !query.trim()) return rows
    const q = query.trim().toLowerCase()
    return rows.filter((row) => searchValue(row).toLowerCase().includes(q))
  }, [rows, query, searchValue])

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.sortValue) return filtered
    const { sortValue } = col
    return [...filtered].sort((a, b) => {
      const va = sortValue(a)
      const vb = sortValue(b)
      const cmp = va < vb ? -1 : va > vb ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir, columns])

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div>
      {searchValue && (
        <div className="p-4 border-b">
          <Input
            placeholder={searchPlaceholder ?? 'Buscar...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>
      )}
      {sorted.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={getRowKey(row)} className="border-b last:border-0 hover:bg-muted/40">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
