import { db } from '@/db'
import { profiles } from '@/db/schema'
import { inArray, desc } from 'drizzle-orm'
import { createAdminClient } from '@/lib/supabase/admin'

export interface VendedorRow {
  id: string
  fullName: string
  phone: string | null
  email: string | null
  createdAt: Date
}

export async function getAllVendedores(): Promise<VendedorRow[]> {
  const rows = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      phone: profiles.phone,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(inArray(profiles.role, ['vendedor']))
    .orderBy(desc(profiles.createdAt))

  if (rows.length === 0) return []

  const admin = createAdminClient()
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailById = new Map((data?.users ?? []).map((u) => [u.id, u.email ?? null]))

  return rows.map((row) => ({ ...row, email: emailById.get(row.id) ?? null }))
}
