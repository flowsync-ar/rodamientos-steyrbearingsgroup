export const dynamic = 'force-dynamic'

import { getQuotesByClient, getPendingQuoteRequestsByClient } from '@/lib/quotes/queries'
import { getClientIdByProfileId } from '@/lib/interest-lists/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { PresupuestosTable, type PresupuestoRow } from '@/components/features/quotes/PresupuestosTable'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function MisPresupuestosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const clientId = await getClientIdByProfileId(user.id)
  if (!clientId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Mis Presupuestos</h1>
        <p className="text-sm text-muted-foreground">
          No se encontró perfil de cliente. Por favor completá tu registro.
        </p>
      </div>
    )
  }

  const [quotes, pendingRequests] = await Promise.all([
    getQuotesByClient(clientId),
    getPendingQuoteRequestsByClient(clientId),
  ])

  const rows: PresupuestoRow[] = [
    ...pendingRequests.map((req) => ({
      id: req.id,
      quoteNumber: null,
      createdAt: req.createdAt,
      itemCount: req.items.length,
      status: 'requested',
      paidAt: null,
      href: null,
    })),
    ...quotes.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      createdAt: q.createdAt,
      itemCount: q.itemCount,
      status: q.status,
      paidAt: q.paidAt,
      href: `/mis-presupuestos/${q.id}`,
    })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis Presupuestos</h1>
        <p className="text-sm text-muted-foreground">
          Revisá y respondé los presupuestos de nuestro equipo.
        </p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sin presupuestos aún. Agregá productos a tu{' '}
              <Link href="/mi-lista" className="underline">
                lista de interés
              </Link>{' '}
              y solicitá un presupuesto.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <PresupuestosTable rows={rows} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
