import { db } from '@/db'
import { industryMargins, clients, appConfig } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const DEFAULT_MARGIN_CONFIG_KEY = 'default_margin_percent'

export async function getAllIndustryMargins() {
  return db.select().from(industryMargins).orderBy(industryMargins.industry)
}

export async function getDefaultMarginPercent(): Promise<number> {
  const rows = await db
    .select({ value: appConfig.value })
    .from(appConfig)
    .where(eq(appConfig.key, DEFAULT_MARGIN_CONFIG_KEY))
    .limit(1)

  const value = rows[0]?.value
  return typeof value === 'number' ? value : 0
}

export interface EffectiveMarginResult {
  industry: string | null
  marginPercent: number
  isDefault: boolean
}

/**
 * Resolves the margin % to apply for a client: matches the client's
 * industry against a configured rule, falling back to the global
 * default margin when there's no industry or no matching rule.
 */
export async function getEffectiveMarginForClient(
  clientId: string
): Promise<EffectiveMarginResult> {
  const clientRows = await db
    .select({ industry: clients.industry })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1)

  const industry = clientRows[0]?.industry ?? null

  if (industry) {
    const ruleRows = await db
      .select({ marginPercent: industryMargins.marginPercent })
      .from(industryMargins)
      .where(eq(industryMargins.industry, industry))
      .limit(1)

    if (ruleRows[0]) {
      return { industry, marginPercent: Number(ruleRows[0].marginPercent), isDefault: false }
    }
  }

  const defaultMargin = await getDefaultMarginPercent()
  return { industry, marginPercent: defaultMargin, isDefault: true }
}
