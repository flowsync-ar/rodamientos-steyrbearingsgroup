'use client'

import { buttonVariants } from '@/components/ui/button'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import Link from 'next/link'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  cheque: 'Cheque',
  tarjeta: 'Tarjeta',
}

export interface CompraRow {
  id: string
  quoteNumber: number
  itemCount: number
  total: number
  paymentMethod: string | null
  paidAt: Date
}

export function ComprasTable({ rows }: { rows: CompraRow[] }) {
  const columns: DataTableColumn<CompraRow>[] = [
    {
      key: 'quoteNumber',
      label: 'N°',
      sortValue: (r) => r.quoteNumber,
      render: (r) => <span className="font-mono text-muted-foreground">#{r.quoteNumber}</span>,
    },
    {
      key: 'itemCount',
      label: 'Ítems',
      sortValue: (r) => r.itemCount,
      render: (r) => `${r.itemCount} producto${r.itemCount !== 1 ? 's' : ''}`,
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      sortValue: (r) => r.total,
      render: (r) => <span className="font-mono font-medium">${r.total.toFixed(2)}</span>,
    },
    {
      key: 'paymentMethod',
      label: 'Forma de pago',
      sortValue: (r) => PAYMENT_METHOD_LABELS[r.paymentMethod ?? ''] ?? '',
      render: (r) => PAYMENT_METHOD_LABELS[r.paymentMethod ?? ''] ?? r.paymentMethod ?? '—',
    },
    {
      key: 'paidAt',
      label: 'Pagado el',
      sortValue: (r) => r.paidAt.getTime(),
      render: (r) => (
        <span className="text-muted-foreground">
          {new Date(r.paidAt).toLocaleDateString('es-AR')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <Link
          href={`/mis-presupuestos/${r.id}`}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          Ver
        </Link>
      ),
    },
  ]

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowKey={(r) => r.id}
      emptyMessage="No hay compras que coincidan con la búsqueda."
      searchPlaceholder="Buscar por número o forma de pago..."
      searchValue={(r) => `#${r.quoteNumber} ${PAYMENT_METHOD_LABELS[r.paymentMethod ?? ''] ?? ''}`}
    />
  )
}
