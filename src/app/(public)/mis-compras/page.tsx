export const dynamic = 'force-dynamic'

import { getPaidQuotesByClient } from '@/lib/quotes/queries'
import { getClientIdByProfileId } from '@/lib/interest-lists/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { ComprasTable, type CompraRow } from '@/components/features/quotes/ComprasTable'
import { redirect } from 'next/navigation'

export default async function MisComprasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const clientId = await getClientIdByProfileId(user.id)
  if (!clientId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Mis Compras</h1>
        <p className="text-sm text-muted-foreground">
          No se encontró perfil de cliente. Por favor completá tu registro.
        </p>
      </div>
    )
  }

  const quotes = await getPaidQuotesByClient(clientId)

  const rows: CompraRow[] = quotes.map((q) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    itemCount: q.itemCount,
    total: Number(q.total),
    paymentMethod: q.paymentMethod,
    paidAt: q.paidAt as Date,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis Compras</h1>
        <p className="text-sm text-muted-foreground">Presupuestos aceptados y pagados.</p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Todavía no registraste ninguna compra.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ComprasTable rows={rows} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
