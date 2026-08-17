'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { db } from '@/db'
import {
  quotes,
  quoteItems,
  quoteApprovalLog,
  clients,
  quoteRequests,
  interestListItems,
  paymentMethodEnum,
} from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import type { ActionResult } from '@/lib/types/action-result'
import { getUser, requireAdmin } from '@/lib/auth/get-user'
import { canApproveQuotes } from '@/lib/auth/roles'
import { getEffectiveMarginForClient } from '@/lib/pricing/queries'
import { getProductById } from '@/lib/products/queries'
import { getClientIdByProfileId } from '@/lib/interest-lists/queries'
import { getQuoteApprovalLog } from './queries'
import {
  sendQuoteApprovedEmail,
  sendQuoteSentEmail,
  getClientEmail,
} from '@/lib/email/send'
import { notify } from '@/lib/notifications'

// ─── Quote creation & editing ────────────────────────────────────────────────

export async function createQuote(clientId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    const [quote] = await db
      .insert(quotes)
      .values({
        clientId,
        salespersonId: user.id,
        status: 'draft',
      })
      .returning({ id: quotes.id })

    revalidatePath('/admin/presupuestos')
    return { success: true, data: { id: quote.id } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo crear el presupuesto',
    }
  }
}

export async function addQuoteItem(
  quoteId: string,
  productId: string,
  quantity: number
): Promise<ActionResult<{ id: string; unitPrice: number; marginPercent: number; subtotal: number }>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    // Load the quote to get clientId
    const quoteRows = await db
      .select({ clientId: quotes.clientId, status: quotes.status })
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1)

    const quote = quoteRows[0]
    if (!quote) return { success: false, error: 'Presupuesto no encontrado', code: 'NOT_FOUND' }
    if (quote.status !== 'draft') {
      return { success: false, error: 'Solo se pueden editar presupuestos en borrador', code: 'INVALID_STATUS' }
    }

    const product = await getProductById(productId)
    if (!product) return { success: false, error: 'Producto no encontrado', code: 'NOT_FOUND' }

    // Suggested price = product cost * (1 + margin for the client's industry).
    // The salesperson can still override both via updateQuoteItem.
    const pricing = await getEffectiveMarginForClient(quote.clientId)
    const marginPercent = pricing.marginPercent
    const baseUnitPrice = Number(product.costPrice ?? 0)
    const unitPrice = baseUnitPrice * (1 + marginPercent / 100)
    const subtotal = unitPrice * quantity

    const [item] = await db
      .insert(quoteItems)
      .values({
        quoteId,
        productId,
        quantity,
        unitPrice: String(unitPrice),
        marginPercent: String(marginPercent),
        subtotal: String(subtotal),
      })
      .returning({ id: quoteItems.id })

    // Update quote updatedAt
    await db
      .update(quotes)
      .set({ updatedAt: new Date() })
      .where(eq(quotes.id, quoteId))

    revalidatePath(`/admin/presupuestos/${quoteId}`)
    revalidatePath('/admin/presupuestos/nuevo')
    return { success: true, data: { id: item.id, unitPrice, marginPercent, subtotal } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo agregar el ítem',
    }
  }
}

export async function updateQuoteItem(
  itemId: string,
  updates: { quantity?: number; unitPrice?: number; marginPercent?: number }
): Promise<ActionResult<void>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    const rows = await db
      .select({
        quantity: quoteItems.quantity,
        unitPrice: quoteItems.unitPrice,
        marginPercent: quoteItems.marginPercent,
        quoteId: quoteItems.quoteId,
      })
      .from(quoteItems)
      .where(eq(quoteItems.id, itemId))
      .limit(1)

    const item = rows[0]
    if (!item) return { success: false, error: 'Ítem no encontrado', code: 'NOT_FOUND' }

    const newQuantity = updates.quantity ?? item.quantity
    const newUnitPrice = updates.unitPrice ?? Number(item.unitPrice)
    const newMarginPercent = updates.marginPercent ?? Number(item.marginPercent)
    const newSubtotal = newUnitPrice * newQuantity

    await db
      .update(quoteItems)
      .set({
        quantity: newQuantity,
        unitPrice: String(newUnitPrice),
        marginPercent: String(newMarginPercent),
        subtotal: String(newSubtotal),
      })
      .where(eq(quoteItems.id, itemId))

    await db
      .update(quotes)
      .set({ updatedAt: new Date() })
      .where(eq(quotes.id, item.quoteId))

    revalidatePath(`/admin/presupuestos/${item.quoteId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo actualizar el ítem',
    }
  }
}

export async function removeQuoteItem(itemId: string): Promise<ActionResult<void>> {
  try {
    const rows = await db
      .select({ quoteId: quoteItems.quoteId })
      .from(quoteItems)
      .where(eq(quoteItems.id, itemId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Ítem no encontrado', code: 'NOT_FOUND' }

    await db.delete(quoteItems).where(eq(quoteItems.id, itemId))

    await db
      .update(quotes)
      .set({ updatedAt: new Date() })
      .where(eq(quotes.id, rows[0].quoteId))

    revalidatePath(`/admin/presupuestos/${rows[0].quoteId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo eliminar el ítem',
    }
  }
}

export async function deleteQuote(quoteId: string): Promise<ActionResult<void>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    const rows = await db
      .select({ id: quotes.id })
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Presupuesto no encontrado', code: 'NOT_FOUND' }

    // quote_items and quote_approval_log cascade from quotes
    await db.delete(quotes).where(eq(quotes.id, quoteId))

    revalidatePath('/admin/presupuestos')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo eliminar el presupuesto',
    }
  }
}

export async function updateQuoteNotes(
  quoteId: string,
  notes: string
): Promise<ActionResult<void>> {
  try {
    await db.update(quotes).set({ notes, updatedAt: new Date() }).where(eq(quotes.id, quoteId))
    revalidatePath(`/admin/presupuestos/${quoteId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudieron actualizar las notas',
    }
  }
}

export async function submitQuoteForApproval(quoteId: string): Promise<ActionResult<void>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    const rows = await db
      .select({ status: quotes.status })
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Presupuesto no encontrado', code: 'NOT_FOUND' }
    if (rows[0].status !== 'draft') {
      return { success: false, error: 'Solo se pueden enviar a revisión presupuestos en borrador', code: 'INVALID_STATUS' }
    }

    await db
      .update(quotes)
      .set({ status: 'pending_approval', updatedAt: new Date() })
      .where(eq(quotes.id, quoteId))

    await db.insert(quoteApprovalLog).values({
      quoteId,
      action: 'submitted',
      performedBy: user.id,
      notes: null,
    })

    // Notification placeholder — Slice 6 wires real notifications
    console.log(`[NOTIFICATION] Quote ${quoteId} submitted for approval by ${user.id}`)

    revalidatePath(`/admin/presupuestos/${quoteId}`)
    revalidatePath('/admin/presupuestos')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo enviar el presupuesto a revisión',
    }
  }
}

// ─── Approval flow ────────────────────────────────────────────────────────────

export async function approveQuote(quoteId: string, notes?: string): Promise<ActionResult<void>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }
    if (!canApproveQuotes(user.role)) {
      return { success: false, error: 'Prohibido: se requiere rol de administrador', code: 'FORBIDDEN' }
    }

    const rows = await db
      .select({ status: quotes.status, clientId: quotes.clientId })
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Presupuesto no encontrado', code: 'NOT_FOUND' }
    if (rows[0].status !== 'pending_approval') {
      return {
        success: false,
        error: 'El presupuesto no está pendiente de aprobación',
        code: 'INVALID_STATUS',
      }
    }

    await db
      .update(quotes)
      .set({
        status: 'approved',
        approvedBy: user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId))

    await db.insert(quoteApprovalLog).values({
      quoteId,
      action: 'approved',
      performedBy: user.id,
      notes: notes ?? null,
    })

    // Notify client via email + in-app notification — non-blocking, but kept
    // alive past the response via after() so Vercel doesn't freeze the
    // function before the SMTP send completes.
    after(async () => {
      const email = await getClientEmail(rows[0].clientId).catch(() => null)
      if (email) await sendQuoteApprovedEmail(email, quoteId).catch(() => {})
      await notify('quote_approved', { quoteId, clientId: rows[0].clientId }).catch(() => {})
    })

    revalidatePath(`/admin/presupuestos/${quoteId}`)
    revalidatePath('/admin/presupuestos')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo aprobar el presupuesto',
    }
  }
}

export async function rejectQuote(
  quoteId: string,
  reason: string
): Promise<ActionResult<void>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }
    if (!canApproveQuotes(user.role)) {
      return { success: false, error: 'Prohibido: se requiere rol de administrador', code: 'FORBIDDEN' }
    }

    await db
      .update(quotes)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(eq(quotes.id, quoteId))

    await db.insert(quoteApprovalLog).values({
      quoteId,
      action: 'rejected',
      performedBy: user.id,
      notes: reason,
    })

    // In-app notification — non-blocking, kept alive past the response
    after(() => notify('quote_rejected', { quoteId }).catch(() => {}))

    revalidatePath(`/admin/presupuestos/${quoteId}`)
    revalidatePath('/admin/presupuestos')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo rechazar el presupuesto',
    }
  }
}

export async function sendQuoteToClient(quoteId: string): Promise<ActionResult<void>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    const rows = await db
      .select({ status: quotes.status, clientId: quotes.clientId })
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1)

    if (!rows[0]) return { success: false, error: 'Presupuesto no encontrado', code: 'NOT_FOUND' }
    if (rows[0].status !== 'approved') {
      return {
        success: false,
        error: 'Solo se pueden enviar presupuestos aprobados',
        code: 'INVALID_STATUS',
      }
    }

    await db
      .update(quotes)
      .set({ status: 'sent', updatedAt: new Date() })
      .where(eq(quotes.id, quoteId))

    await db.insert(quoteApprovalLog).values({
      quoteId,
      action: 'sent',
      performedBy: user.id,
      notes: null,
    })

    // Notify client via email + in-app notification — non-blocking, but kept
    // alive past the response via after() so Vercel doesn't freeze the
    // function before the SMTP send completes.
    after(async () => {
      const email = await getClientEmail(rows[0].clientId).catch(() => null)
      if (email) await sendQuoteSentEmail(email, quoteId).catch(() => {})
      await notify('quote_sent', { quoteId, clientId: rows[0].clientId }).catch(() => {})
    })

    revalidatePath(`/admin/presupuestos/${quoteId}`)
    revalidatePath('/admin/presupuestos')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo enviar el presupuesto',
    }
  }
}

// ─── Client portal actions ────────────────────────────────────────────────────

export async function clientAcceptQuote(quoteId: string): Promise<ActionResult<void>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    await db
      .update(quotes)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(quotes.id, quoteId))

    revalidatePath(`/mis-presupuestos/${quoteId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo aceptar el presupuesto',
    }
  }
}

export async function payQuote(
  quoteId: string,
  paymentMethod: string
): Promise<ActionResult<void>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    const clientId = await getClientIdByProfileId(user.id)
    if (!clientId) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    if (!paymentMethodEnum.enumValues.includes(paymentMethod as (typeof paymentMethodEnum.enumValues)[number])) {
      return { success: false, error: 'Forma de pago inválida' }
    }

    const rows = await db
      .select({ id: quotes.id, clientId: quotes.clientId, status: quotes.status })
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1)

    const quote = rows[0]
    if (!quote || quote.clientId !== clientId) {
      return { success: false, error: 'Presupuesto no encontrado', code: 'NOT_FOUND' }
    }
    if (quote.status !== 'accepted') {
      return { success: false, error: 'Solo se pueden pagar presupuestos aceptados' }
    }

    await db
      .update(quotes)
      .set({
        paymentMethod: paymentMethod as (typeof paymentMethodEnum.enumValues)[number],
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId))

    revalidatePath('/mis-presupuestos')
    revalidatePath(`/mis-presupuestos/${quoteId}`)
    revalidatePath('/mis-compras')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo registrar el pago',
    }
  }
}

export async function clientDeclineQuote(quoteId: string): Promise<ActionResult<void>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    await db
      .update(quotes)
      .set({ status: 'declined', updatedAt: new Date() })
      .where(eq(quotes.id, quoteId))

    revalidatePath(`/mis-presupuestos/${quoteId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo declinar el presupuesto',
    }
  }
}

// ─── Quote request conversion ─────────────────────────────────────────────────

export async function convertQuoteRequest(
  quoteRequestId: string
): Promise<ActionResult<{ quoteId: string }>> {
  try {
    const user = await getUser()
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHENTICATED' }

    // Load the quote request
    const requestRows = await db
      .select({
        id: quoteRequests.id,
        clientId: quoteRequests.clientId,
        interestListId: quoteRequests.interestListId,
        status: quoteRequests.status,
      })
      .from(quoteRequests)
      .where(eq(quoteRequests.id, quoteRequestId))
      .limit(1)

    const request = requestRows[0]
    if (!request) return { success: false, error: 'Solicitud de presupuesto no encontrada', code: 'NOT_FOUND' }
    if (request.status !== 'pending') {
      return {
        success: false,
        error: 'La solicitud de presupuesto no está pendiente',
        code: 'INVALID_STATUS',
      }
    }

    // Create draft quote
    const [quote] = await db
      .insert(quotes)
      .values({
        clientId: request.clientId,
        salespersonId: user.id,
        status: 'draft',
      })
      .returning({ id: quotes.id })

    // Pre-populate items from interest list
    const items = await db
      .select({
        productId: interestListItems.productId,
        quantity: interestListItems.quantity,
      })
      .from(interestListItems)
      .where(eq(interestListItems.interestListId, request.interestListId))

    if (items.length > 0) {
      const pricing = await getEffectiveMarginForClient(request.clientId)
      const itemInserts = await Promise.all(
        items.map(async (item) => {
          const product = await getProductById(item.productId)
          const baseUnitPrice = Number(product?.costPrice ?? 0)
          const unitPrice = baseUnitPrice * (1 + pricing.marginPercent / 100)
          const subtotal = unitPrice * item.quantity
          return {
            quoteId: quote.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: String(unitPrice),
            marginPercent: String(pricing.marginPercent),
            subtotal: String(subtotal),
          }
        })
      )

      await db.insert(quoteItems).values(itemInserts)
    }

    // Mark quote request as in_progress
    await db
      .update(quoteRequests)
      .set({ status: 'in_progress' })
      .where(eq(quoteRequests.id, quoteRequestId))

    revalidatePath('/admin/presupuestos')
    return { success: true, data: { quoteId: quote.id } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo convertir la solicitud en presupuesto',
    }
  }
}
