export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { getUser } from '@/lib/auth/get-user'
import { canAccessSettings } from '@/lib/auth/roles'
import { getVendedorById } from '@/lib/staff/queries'
import { updateVendedor } from '@/lib/staff/actions'
import { EditVendedorForm } from '@/components/features/staff/EditVendedorForm'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

type ActionState = { error?: string } | null

export default async function EditarVendedorPage({ params }: Props) {
  const { id } = await params
  const user = await getUser()
  if (!user) redirect('/login')
  if (!canAccessSettings(user.role)) redirect('/admin/settings')

  const vendedor = await getVendedorById(id)
  if (!vendedor) notFound()

  async function handleUpdate(
    _prevState: ActionState,
    formData: FormData
  ): Promise<ActionState> {
    'use server'
    const result = await updateVendedor(id, {
      fullName: formData.get('fullName') as string,
      phone: (formData.get('phone') as string) || undefined,
    })
    if (result.success) {
      redirect('/admin/settings/vendedores')
    }
    return { error: result.error }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/settings/vendedores" className="text-sm text-muted-foreground hover:underline">
          ← Vendedores
        </Link>
      </div>

      <EditVendedorForm
        fullName={vendedor.fullName}
        phone={vendedor.phone}
        action={handleUpdate}
      />
    </div>
  )
}
