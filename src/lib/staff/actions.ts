'use server'

import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/get-user'
import { sendVendedorInviteEmail, resolvePublicAppUrl } from '@/lib/email/send'
import type { ActionResult } from '@/lib/types/action-result'

export interface CreateVendedorInput {
  fullName: string
  email: string
  phone?: string
}

async function sendVendedorSetPasswordEmail(email: string, fullName: string): Promise<void> {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email })

  if (error || !data?.properties) {
    console.error('[EMAIL] Failed to generate vendedor set-password link:', error)
    return
  }

  const setPasswordUrl = `${resolvePublicAppUrl()}/auth/confirm?token_hash=${data.properties.hashed_token}&type=recovery`
  await sendVendedorInviteEmail(email, fullName, setPasswordUrl)
}

export async function createVendedor(
  input: CreateVendedorInput
): Promise<ActionResult<{ profileId: string }>> {
  try {
    await requireAdmin()

    const { fullName, email, phone } = input

    if (!fullName.trim()) {
      return { success: false, error: 'El nombre es obligatorio.' }
    }
    if (!email.trim()) {
      return { success: false, error: 'El email es obligatorio.' }
    }

    const admin = createAdminClient()
    // No password is set here — the vendedor gets an email to create their
    // own, same as the password-reset flow.
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
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

    after(() =>
      sendVendedorSetPasswordEmail(email, fullName.trim()).catch((err) => {
        console.error('[EMAIL] Failed to send vendedor invite email:', err)
      })
    )

    revalidatePath('/admin/settings/vendedores')
    return { success: true, data: { profileId: authData.user.id } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo crear el vendedor.',
    }
  }
}

export interface UpdateVendedorInput {
  fullName: string
  phone?: string
}

export async function updateVendedor(
  profileId: string,
  input: UpdateVendedorInput
): Promise<ActionResult<void>> {
  try {
    await requireAdmin()

    if (!input.fullName.trim()) {
      return { success: false, error: 'El nombre es obligatorio.' }
    }

    await db
      .update(profiles)
      .set({
        fullName: input.fullName.trim(),
        phone: input.phone || null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profileId))

    revalidatePath('/admin/settings/vendedores')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo actualizar el vendedor.',
    }
  }
}

export async function resetVendedorPassword(
  profileId: string,
  email: string,
  fullName: string
): Promise<ActionResult<void>> {
  try {
    await requireAdmin()
    await sendVendedorSetPasswordEmail(email, fullName)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo enviar el email de blanqueo.',
    }
  }
}

export async function deleteVendedor(profileId: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin()

    const admin = createAdminClient()
    await db.delete(profiles).where(eq(profiles.id, profileId))
    await admin.auth.admin.deleteUser(profileId)

    revalidatePath('/admin/settings/vendedores')
    return { success: true, data: undefined }
  } catch {
    return {
      success: false,
      error:
        'No se pudo eliminar: este vendedor tiene presupuestos u otra actividad asociada. Podés blanquearle la contraseña en su lugar.',
    }
  }
}
