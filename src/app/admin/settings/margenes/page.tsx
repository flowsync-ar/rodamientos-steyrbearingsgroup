export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/get-user'
import { canAccessSettings } from '@/lib/auth/roles'
import { getAllIndustryMargins, getDefaultMarginPercent } from '@/lib/pricing/queries'
import {
  createIndustryMargin,
  updateIndustryMargin,
  deleteIndustryMargin,
  setDefaultMarginPercent,
} from '@/lib/pricing/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ActionTooltip } from '@/components/ui/action-tooltip'
import { ConfirmDeleteButton } from '@/components/ui/confirm-delete-button'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function MargenesSettingsPage({ searchParams }: Props) {
  const user = await getUser()
  if (!user) redirect('/login')
  if (!canAccessSettings(user.role)) redirect('/admin/settings')

  const { error } = await searchParams
  const [margins, defaultMargin] = await Promise.all([
    getAllIndustryMargins(),
    getDefaultMarginPercent(),
  ])

  async function handleCreate(formData: FormData) {
    'use server'
    const industry = formData.get('industry') as string
    const marginPercent = Number(formData.get('marginPercent'))
    const result = await createIndustryMargin(industry, marginPercent)
    if (result.success) redirect('/admin/settings/margenes')
    redirect(`/admin/settings/margenes?error=${encodeURIComponent(result.error)}`)
  }

  async function handleSaveDefault(formData: FormData) {
    'use server'
    const marginPercent = Number(formData.get('defaultMarginPercent'))
    await setDefaultMarginPercent(marginPercent)
    redirect('/admin/settings/margenes')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/settings" className="text-sm text-muted-foreground hover:underline">
          ← Configuración
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Márgenes por rubro</h1>
        <p className="text-sm text-muted-foreground">
          El precio de venta de cada producto se calcula como costo × (1 + margen), según el
          rubro (industria) del cliente que recibe el presupuesto.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Margen por defecto</CardTitle>
          <CardDescription>
            Se aplica a clientes sin rubro asignado, o cuyo rubro no tiene una regla configurada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSaveDefault} className="flex items-end gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="defaultMarginPercent">Margen (%)</Label>
              <Input
                id="defaultMarginPercent"
                name="defaultMarginPercent"
                type="number"
                step="0.01"
                min="0"
                defaultValue={defaultMargin}
                className="w-32"
                required
              />
            </div>
            <Button type="submit">Guardar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuevo rubro</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleCreate} className="flex items-end gap-2">
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="industry">Rubro</Label>
              <Input id="industry" name="industry" required placeholder="ej. Agrícola" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="marginPercent">Margen (%)</Label>
              <Input
                id="marginPercent"
                name="marginPercent"
                type="number"
                step="0.01"
                min="0"
                required
                className="w-32"
              />
            </div>
            <Button type="submit">Agregar</Button>
          </form>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rubros configurados ({margins.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {margins.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Todavía no configuraste ningún rubro.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Rubro</th>
                  <th className="px-4 py-3 font-medium">Margen</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {margins.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{m.industry}</td>
                    <td className="px-4 py-3">
                      <form
                        action={async (formData) => {
                          'use server'
                          const marginPercent = Number(formData.get('marginPercent'))
                          await updateIndustryMargin(m.id, marginPercent)
                        }}
                        className="flex items-center gap-2"
                      >
                        <Input
                          name="marginPercent"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={m.marginPercent}
                          className="w-24 h-8"
                        />
                        <button type="submit" className="text-xs underline text-muted-foreground hover:text-foreground">
                          Guardar
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionTooltip label="Eliminar">
                        <ConfirmDeleteButton
                          itemLabel={`el rubro ${m.industry}`}
                          action={async () => {
                            'use server'
                            await deleteIndustryMargin(m.id)
                          }}
                        />
                      </ActionTooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
