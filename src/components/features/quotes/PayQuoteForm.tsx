'use client'

import { useActionState } from 'react'
import { payQuote } from '@/lib/quotes/actions'

type ActionState = { error?: string } | null

const PAYMENT_METHODS = [
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'tarjeta', label: 'Tarjeta' },
]

export function PayQuoteForm({ quoteId }: { quoteId: string }) {
  const [state, action, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      const paymentMethod = formData.get('paymentMethod') as string
      if (!paymentMethod) return { error: 'Elegí una forma de pago.' }
      const result = await payQuote(quoteId, paymentMethod)
      return result.success ? null : { error: result.error }
    },
    null
  )

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action} className="flex items-center gap-2">
        <select
          name="paymentMethod"
          defaultValue=""
          required
          className="h-8 text-xs border border-input rounded-lg px-2 bg-transparent"
        >
          <option value="" disabled>
            Forma de pago
          </option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="h-8 text-xs font-medium px-3 rounded-lg border hover:bg-muted disabled:opacity-50 whitespace-nowrap"
        >
          {isPending ? 'Pagando…' : 'Pagar presupuesto'}
        </button>
      </form>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  )
}
