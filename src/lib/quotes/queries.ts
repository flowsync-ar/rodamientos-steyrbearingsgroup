import { db } from '@/db'
import {
  quotes,
  quoteItems,
  quoteApprovalLog,
  clients,
  profiles,
  products,
  quoteRequests,
  interestListItems,
} from '@/db/schema'
import { eq, and, desc, sql, isNotNull } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

const clientProfiles = alias(profiles, 'client_profiles')

export async function getQuoteById(id: string) {
  const rows = await db
    .select({
      // Quote fields
      id: quotes.id,
      quoteNumber: quotes.quoteNumber,
      status: quotes.status,
      notes: quotes.notes,
      approvedBy: quotes.approvedBy,
      approvedAt: quotes.approvedAt,
      paymentMethod: quotes.paymentMethod,
      paidAt: quotes.paidAt,
      createdAt: quotes.createdAt,
      updatedAt: quotes.updatedAt,
      // Client
      clientId: quotes.clientId,
      clientName: sql<string>`coalesce(${clients.razonSocial}, ${clientProfiles.fullName})`,
      clientProfileId: clients.profileId,
      // Salesperson
      salespersonId: quotes.salespersonId,
      salespersonName: profiles.fullName,
    })
    .from(quotes)
    .innerJoin(clients, eq(clients.id, quotes.clientId))
    .innerJoin(clientProfiles, eq(clientProfiles.id, clients.profileId))
    .innerJoin(profiles, eq(profiles.id, quotes.salespersonId))
    .where(eq(quotes.id, id))
    .limit(1)

  const quote = rows[0]
  if (!quote) return null

  const items = await getQuoteItems(id)

  const total = items.reduce((sum, item) => sum + Number(item.subtotal), 0)

  return { ...quote, items, total }
}

export async function getQuoteItems(quoteId: string) {
  return db
    .select({
      id: quoteItems.id,
      quoteId: quoteItems.quoteId,
      productId: quoteItems.productId,
      quantity: quoteItems.quantity,
      unitPrice: quoteItems.unitPrice,
      marginPercent: quoteItems.marginPercent,
      subtotal: quoteItems.subtotal,
      productName: products.name,
      productSku: products.sku,
    })
    .from(quoteItems)
    .innerJoin(products, eq(products.id, quoteItems.productId))
    .where(eq(quoteItems.quoteId, quoteId))
    .orderBy(quoteItems.id)
}

export interface GetAllQuotesOptions {
  status?: string
  salesPersonId?: string
  clientId?: string
  paidOnly?: boolean
  page?: number
  pageSize?: number
}

export async function getAllQuotes(opts: GetAllQuotesOptions = {}) {
  const { status, salesPersonId, clientId, paidOnly, page = 1, pageSize = 20 } = opts
  const offset = (page - 1) * pageSize

  const conditions = []
  if (status) conditions.push(eq(quotes.status, status as typeof quotes.status._.data))
  if (salesPersonId) conditions.push(eq(quotes.salespersonId, salesPersonId))
  if (clientId) conditions.push(eq(quotes.clientId, clientId))
  if (paidOnly) conditions.push(isNotNull(quotes.paidAt))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const rows = await db
    .select({
      id: quotes.id,
      quoteNumber: quotes.quoteNumber,
      status: quotes.status,
      notes: quotes.notes,
      paymentMethod: quotes.paymentMethod,
      paidAt: quotes.paidAt,
      createdAt: quotes.createdAt,
      updatedAt: quotes.updatedAt,
      clientId: quotes.clientId,
      clientName: sql<string>`coalesce(${clients.razonSocial}, ${clientProfiles.fullName})`,
      salespersonId: quotes.salespersonId,
      salespersonName: profiles.fullName,
      itemCount: sql<number>`count(${quoteItems.id})::int`,
      total: sql<string>`coalesce(sum(${quoteItems.subtotal}), 0)`,
    })
    .from(quotes)
    .innerJoin(clients, eq(clients.id, quotes.clientId))
    .innerJoin(clientProfiles, eq(clientProfiles.id, clients.profileId))
    .innerJoin(profiles, eq(profiles.id, quotes.salespersonId))
    .leftJoin(quoteItems, eq(quoteItems.quoteId, quotes.id))
    .where(where)
    .groupBy(quotes.id, clients.razonSocial, clientProfiles.fullName, profiles.fullName)
    .orderBy(desc(quotes.createdAt))
    .limit(pageSize)
    .offset(offset)

  return rows
}

export async function getQuotesByClient(clientId: string) {
  return getAllQuotes({ clientId })
}

export async function getPaidQuotesByClient(clientId: string) {
  return getAllQuotes({ clientId, paidOnly: true })
}

export async function getQuoteApprovalLog(quoteId: string) {
  return db
    .select({
      id: quoteApprovalLog.id,
      quoteId: quoteApprovalLog.quoteId,
      action: quoteApprovalLog.action,
      notes: quoteApprovalLog.notes,
      performedAt: quoteApprovalLog.performedAt,
      actorId: quoteApprovalLog.performedBy,
      actorName: profiles.fullName,
    })
    .from(quoteApprovalLog)
    .innerJoin(profiles, eq(profiles.id, quoteApprovalLog.performedBy))
    .where(eq(quoteApprovalLog.quoteId, quoteId))
    .orderBy(quoteApprovalLog.performedAt)
}

export async function getPendingQuoteRequestsByClient(clientId: string) {
  const requests = await db
    .select({
      id: quoteRequests.id,
      interestListId: quoteRequests.interestListId,
      createdAt: quoteRequests.createdAt,
    })
    .from(quoteRequests)
    .where(and(eq(quoteRequests.clientId, clientId), eq(quoteRequests.status, 'pending')))
    .orderBy(desc(quoteRequests.createdAt))

  return Promise.all(
    requests.map(async (req) => {
      const items = await db
        .select({
          id: interestListItems.id,
          productName: products.name,
          productSku: products.sku,
          quantity: interestListItems.quantity,
        })
        .from(interestListItems)
        .innerJoin(products, eq(products.id, interestListItems.productId))
        .where(eq(interestListItems.interestListId, req.interestListId))

      return { id: req.id, createdAt: req.createdAt, items }
    })
  )
}

export async function getPendingQuoteRequests() {
  return db
    .select({
      id: quoteRequests.id,
      interestListId: quoteRequests.interestListId,
      clientId: quoteRequests.clientId,
      status: quoteRequests.status,
      createdAt: quoteRequests.createdAt,
      clientName: sql<string>`coalesce(${clients.razonSocial}, ${clientProfiles.fullName})`,
      clientProfileId: clients.profileId,
    })
    .from(quoteRequests)
    .innerJoin(clients, eq(clients.id, quoteRequests.clientId))
    .innerJoin(clientProfiles, eq(clientProfiles.id, clients.profileId))
    .where(eq(quoteRequests.status, 'pending'))
    .orderBy(desc(quoteRequests.createdAt))
}
