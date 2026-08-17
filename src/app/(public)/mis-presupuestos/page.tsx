export const dynamic = 'force-dynamic'

import { getQuotesByClient, getPendingQuoteRequestsByClient } from '@/lib/quotes/queries'
import { getClientIdByProfileId } from '@/lib/interest-lists/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { redirect } from 'next/navigation'

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
  requested: 'Solicitado',
}

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis Presupuestos</h1>
        <p className="text-sm text-muted-foreground">
          Revisá y respondé los presupuestos de nuestro equipo.
        </p>
      </div>

      {pendingRequests.map((req) => (
        <div
          key={req.id}
          className="rounded-lg border bg-purple-50 border-purple-200 px-4 py-3 text-sm text-purple-800"
        >
          <span className="font-medium">Presupuesto enviado.</span> Pronto un vendedor se pondrá
          en contacto con usted.
          <span className="block text-xs text-purple-600 mt-0.5 mb-2">
            Solicitado el {new Date(req.createdAt).toLocaleDateString('es-AR')}
          </span>
          <ul className="text-xs text-purple-700 space-y-0.5">
            {req.items.map((item) => (
              <li key={item.id}>
                {item.quantity}× {item.productName}{' '}
                <span className="font-mono text-purple-500">({item.productSku})</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {quotes.length === 0 && pendingRequests.length === 0 && (
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
      )}

      {quotes.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">N°</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Ítems</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 text-muted-foreground font-mono">#{q.quoteNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(q.createdAt).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3">{q.itemCount} producto{q.itemCount !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_COLORS[q.status] ?? 'bg-gray-100'}>
                        {STATUS_LABELS[q.status] ?? q.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/mis-presupuestos/${q.id}`}
                        className={buttonVariants({ variant: 'outline', size: 'sm' })}
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
