export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/get-user'
import { canAccessSettings } from '@/lib/auth/roles'
import { getAllVendedores } from '@/lib/staff/queries'
import { createVendedor } from '@/lib/staff/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
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
      password: formData.get('password') as string,
      phone: (formData.get('phone') as string) || undefined,
    })

    if (result.success) {
      redirect('/admin/settings/vendedores')
    }
    redirect(`/admin/settings/vendedores?error=${encodeURIComponent(result.error)}`)
  }

  return (
    <div className="max-w-2xl space-y-6">
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
              <Label htmlFor="password">Contraseña</Label>
              <PasswordInput id="password" name="password" minLength={8} autoComplete="new-password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
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
