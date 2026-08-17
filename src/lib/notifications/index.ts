import { db } from '@/db'
import { notifications, profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'quote_approved'
  | 'quote_rejected'
  | 'quote_sent'
  | 'new_quote_request'
  | 'no_purchase_alert'
  | 'voice_consultation'
  | 'client_pending_activation'

interface NotificationPayload {
  quoteId?: string
  clientId?: string
  clientName?: string
  requestId?: string
  alertId?: string
  consultationId?: string
  [key: string]: unknown
}

// ─── Title / body builders ────────────────────────────────────────────────────

function buildNotificationContent(
  type: NotificationType,
  payload: NotificationPayload
): { title: string; body: string } {
  switch (type) {
    case 'quote_approved':
      return {
        title: 'Presupuesto aprobado',
        body: `El presupuesto ${payload.quoteId ? payload.quoteId.slice(0, 8) : ''} fue aprobado y está listo para enviar.`,
      }
    case 'quote_rejected':
      return {
        title: 'Presupuesto rechazado',
        body: `El presupuesto ${payload.quoteId ? payload.quoteId.slice(0, 8) : ''} fue rechazado. Revisá los comentarios.`,
      }
    case 'quote_sent':
      return {
        title: 'Presupuesto enviado al cliente',
        body: `El presupuesto ${payload.quoteId ? payload.quoteId.slice(0, 8) : ''} fue enviado al cliente.`,
      }
    case 'new_quote_request':
      return {
        title: 'Nueva solicitud de presupuesto',
        body: `${payload.clientName ?? 'Un cliente'} solicitó un presupuesto.`,
      }
    case 'no_purchase_alert':
      return {
        title: 'Alerta de inactividad',
        body: `El cliente ${payload.clientName ?? payload.clientId ?? ''} no compró recientemente.`,
      }
    case 'voice_consultation':
      return {
        title: 'Nueva consulta de voz',
        body: 'Hay una consulta de voz pendiente de revisión.',
      }
    case 'client_pending_activation':
      return {
        title: 'Nuevo cliente registrado',
        body: `${payload.clientName ?? 'Un cliente'} se registró y está esperando activación.`,
      }
    default:
      return { title: 'Notificación', body: 'Tenés una nueva notificación.' }
  }
}

// ─── Resolve target user IDs ──────────────────────────────────────────────────

/**
 * Returns the user IDs that should receive this notification.
 * For admin-targeted notifications, finds all admin_general + admin_secundario profiles.
 */
async function resolveTargetUserIds(
  type: NotificationType,
  payload: NotificationPayload
): Promise<string[]> {
  const adminTypes: NotificationType[] = [
    'quote_approved',
    'quote_rejected',
    'quote_sent',
    'new_quote_request',
    'no_purchase_alert',
    'voice_consultation',
    'client_pending_activation',
  ]

  if (adminTypes.includes(type)) {
    // Notify all admins
    const admins = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        eq(profiles.role, 'admin_general')
      )

    const secondaryAdmins = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        eq(profiles.role, 'admin_secundario')
      )

    return [...admins, ...secondaryAdmins].map((a) => a.id)
  }

  return []
}

// ─── Main notify function ─────────────────────────────────────────────────────

/**
 * Fire-and-forget notification helper.
 * Inserts notification records into the database.
 * Never throws — all errors are caught and logged silently.
 */
export async function notify(
  type: NotificationType,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const targetUserIds = await resolveTargetUserIds(type, payload as NotificationPayload)

    if (targetUserIds.length === 0) return

    const { title, body } = buildNotificationContent(type, payload as NotificationPayload)

    await db.insert(notifications).values(
      targetUserIds.map((userId) => ({
        userId,
        type,
        title,
        body,
        read: false,
        payload,
      }))
    )
  } catch (err) {
    // Never throw — notifications are non-critical
    if (process.env.NODE_ENV === 'development') {
      console.error('[notify] Failed to insert notification:', err)
    }
  }
}
