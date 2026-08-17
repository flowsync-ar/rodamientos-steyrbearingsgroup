'use client'

import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { PayQuoteForm } from './PayQuoteForm'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-red-100 text-red-600',
  requested: 'bg-purple-100 text-purple-700',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'En proceso',
  pending_approval: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  sent: 'Listo para revisar',
  accepted: 'Aceptado',
  declined: 'Declinado',
  requested: 'Solicitado, sin asignar',
}

export interface PresupuestoRow {
  id: string
  quoteNumber: number | null
  createdAt: Date
  itemCount: number
  status: string
  paidAt: Date | null
  href: string | null
}

export function PresupuestosTable({ rows }: { rows: PresupuestoRow[] }) {
  const columns: DataTableColumn<PresupuestoRow>[] = [
    {
      key: 'quoteNumber',
      label: 'N°',
      sortValue: (r) => r.quoteNumber ?? 0,
      render: (r) => (
        <span className="font-mono text-muted-foreground">
          {r.quoteNumber ? `#${r.quoteNumber}` : '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Fecha',
      sortValue: (r) => r.createdAt.getTime(),
      render: (r) => (
        <span className="text-muted-foreground">
          {new Date(r.createdAt).toLocaleDateString('es-AR')}
        </span>
      ),
    },
    {
      key: 'itemCount',
      label: 'Ítems',
      sortValue: (r) => r.itemCount,
      render: (r) => `${r.itemCount} producto${r.itemCount !== 1 ? 's' : ''}`,
    },
    {
      key: 'status',
      label: 'Estado',
      sortValue: (r) => STATUS_LABELS[r.status] ?? r.status,
      render: (r) => (
        <Badge className={STATUS_COLORS[r.status] ?? 'bg-gray-100'}>
          {STATUS_LABELS[r.status] ?? r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) =>
        r.status === 'accepted' && !r.paidAt ? (
          <PayQuoteForm quoteId={r.id} />
        ) : r.href ? (
          <Link href={r.href} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Ver
          </Link>
        ) : null,
    },
  ]

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowKey={(r) => r.id}
      emptyMessage="No hay presupuestos que coincidan con la búsqueda."
      searchPlaceholder="Buscar por número o estado..."
      searchValue={(r) => `#${r.quoteNumber ?? ''} ${STATUS_LABELS[r.status] ?? r.status}`}
    />
  )
}
