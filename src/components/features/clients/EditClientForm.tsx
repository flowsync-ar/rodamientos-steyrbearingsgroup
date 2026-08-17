'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

type ActionState = { error?: string } | null

interface Client {
  fullName: string
  companyName: string | null
  phone: string | null
  razonSocial: string | null
  cuit: string
  industry: string | null
}

interface Props {
  clientId: string
  client: Client
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

export function EditClientForm({ clientId, client, action }: Props) {
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Datos del cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={client.fullName}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Empresa</Label>
            <Input
              id="companyName"
              name="companyName"
              defaultValue={client.companyName ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={client.phone ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="razonSocial">Razón social</Label>
            <Input
              id="razonSocial"
              name="razonSocial"
              defaultValue={client.razonSocial ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuit">CUIT</Label>
            <Input
              id="cuit"
              name="cuit"
              defaultValue={client.cuit}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industria</Label>
            <Input
              id="industry"
              name="industry"
              defaultValue={client.industry ?? ''}
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
            <Link
              href={`/admin/clientes/${clientId}`}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
