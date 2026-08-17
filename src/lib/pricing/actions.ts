'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { industryMargins, appConfig } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { ActionResult } from '@/lib/types/action-result'
import { requireAdmin } from '@/lib/auth/get-user'
import { DEFAULT_MARGIN_CONFIG_KEY } from './queries'

export async function createIndustryMargin(
  industry: string,
  marginPercent: number
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()

    if (!industry.trim()) {
      return { success: false, error: 'El rubro es obligatorio.' }
    }

    const [rule] = await db
      .insert(industryMargins)
      .values({ industry: industry.trim(), marginPercent: String(marginPercent) })
      .returning({ id: industryMargins.id })

    revalidatePath('/admin/settings/margenes')
    return { success: true, data: { id: rule.id } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo crear el margen. ¿Ya existe ese rubro?',
    }
  }
}

export async function updateIndustryMargin(
  id: string,
  marginPercent: number
): Promise<ActionResult<void>> {
  try {
    await requireAdmin()

    await db
      .update(industryMargins)
      .set({ marginPercent: String(marginPercent), updatedAt: new Date() })
      .where(eq(industryMargins.id, id))

    revalidatePath('/admin/settings/margenes')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo actualizar el margen.',
    }
  }
}

export async function deleteIndustryMargin(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin()

    await db.delete(industryMargins).where(eq(industryMargins.id, id))

    revalidatePath('/admin/settings/margenes')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo eliminar el margen.',
    }
  }
}

export async function setDefaultMarginPercent(marginPercent: number): Promise<ActionResult<void>> {
  try {
    await requireAdmin()

    await db
      .insert(appConfig)
      .values({ key: DEFAULT_MARGIN_CONFIG_KEY, value: marginPercent })
      .onConflictDoUpdate({
        target: appConfig.key,
        set: { value: marginPercent, updatedAt: new Date() },
      })

    revalidatePath('/admin/settings/margenes')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo guardar el margen por defecto.',
    }
  }
}
