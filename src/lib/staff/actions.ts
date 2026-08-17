'use server'

import { db } from '@/db'
import { profiles } from '@/db/schema'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/get-user'
import type { ActionResult } from '@/lib/types/action-result'

export interface CreateVendedorInput {
  fullName: string
  email: string
  password: string
  phone?: string
}

export async function createVendedor(
  input: CreateVendedorInput
): Promise<ActionResult<{ profileId: string }>> {
  try {
    await requireAdmin()

    const { fullName, email, password, phone } = input

    if (!fullName.trim()) {
      return { success: false, error: 'El nombre es obligatorio.' }
    }
    if (password.length < 8) {
      return { success: false, error: 'La contraseña debe tener al menos 8 caracteres.' }
    }

    const admin = createAdminClient()
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // internal staff account — no self-verification flow
    })

    if (authError || !authData?.user) {
      return {
        success: false,
        error: authError?.message ?? 'No se pudo crear la cuenta.',
      }
    }

    try {
      await db.insert(profiles).values({
        id: authData.user.id,
        fullName: fullName.trim(),
        phone: phone || null,
        role: 'vendedor',
      })
    } catch (err) {
      await admin.auth.admin.deleteUser(authData.user.id).catch(() => null)
      throw err
    }

    revalidatePath('/admin/settings/vendedores')
    return { success: true, data: { profileId: authData.user.id } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo crear el vendedor.',
    }
  }
}
