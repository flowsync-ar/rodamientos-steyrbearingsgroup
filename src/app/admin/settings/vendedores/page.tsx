export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/get-user'
import { canAccessSettings } from '@/lib/auth/roles'
import { getAllVendedores } from '@/lib/staff/queries'
import { createVendedor, deleteVendedor, resetVendedorPassword } from '@/lib/staff/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ActionTooltip } from '@/components/ui/action-tooltip'
import { ConfirmDeleteButton } from '@/components/ui/confirm-delete-button'
import { Pencil, KeyRound } from 'lucide-react'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function VendedoresSettingsPage({ searchParams }: Props) {
  const user = await getUser()
  if (!user) redirect('/login')
  if (!canAccessSettings(user.role)) redirect('/admin/settings')

  const { error } = await searchParams
  const vendedores = await getAllVendedores()

  async function handleCreate(formData: FormData) {
    'use server'
    const result = await createVendedor({
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || undefined,
    })

    if (result.success) {
      redirect('/admin/settings/vendedores')
    }
    redirect(`/admin/settings/vendedores?error=${encodeURIComponent(result.error)}`)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/settings" className="text-sm text-muted-foreground hover:underline">
          ← Configuración
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Vendedores</h1>
        <p className="text-sm text-muted-foreground">
          Creá las cuentas de los vendedores de tu equipo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuevo vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="off" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
            <p className="text-xs text-muted-foreground">
              Le vamos a mandar un email para que cree su propia contraseña.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit">Crear vendedor</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipo actual ({vendedores.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {vendedores.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Todavía no creaste ningún vendedor.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium">Creado</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {vendedores.map((v) => (
                  <tr key={v.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{v.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.email ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(v.createdAt).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <ActionTooltip label="Editar">
                          <Link
                            href={`/admin/settings/vendedores/${v.id}/editar`}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                        </ActionTooltip>
                        <ActionTooltip label="Blanquear contraseña">
                          <form
                            action={async () => {
                              'use server'
                              if (v.email) await resetVendedorPassword(v.id, v.email, v.fullName)
                            }}
                          >
                            <button
                              type="submit"
                              disabled={!v.email}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                          </form>
                        </ActionTooltip>
                        <ActionTooltip label="Eliminar">
                          <ConfirmDeleteButton
                            itemLabel={`al vendedor ${v.fullName}`}
                            action={async () => {
                              'use server'
                              await deleteVendedor(v.id)
                            }}
                          />
                        </ActionTooltip>
                      </div>
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
