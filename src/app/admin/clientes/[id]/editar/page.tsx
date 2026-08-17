export const dynamic = 'force-dynamic'

import { getClientWithScore } from '@/lib/clients/queries'
import { updateClient } from '@/lib/clients/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { EditClientForm } from '@/components/features/clients/EditClientForm'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

type ActionState = { error?: string } | null

export default async function EditarClientePage({ params }: Props) {
  const { id } = await params
  const client = await getClientWithScore(id)
  if (!client) notFound()

  const admin = createAdminClient()
  const { data: authUser } = await admin.auth.admin.getUserById(client.profileId)
  if (!authUser?.user?.email_confirmed_at) {
    redirect(`/admin/clientes/${id}`)
  }

  async function handleUpdate(
    _prevState: ActionState,
    formData: FormData
  ): Promise<ActionState> {
    'use server'
    const result = await updateClient(id, formData)
    if (result.success) {
      redirect(`/admin/clientes/${id}`)
    }
    return { error: result.error }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-4">
        <Link href={`/admin/clientes/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← Volver
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Editar cliente</h1>

      <EditClientForm clientId={id} client={client} action={handleUpdate} />
    </div>
  )
}
