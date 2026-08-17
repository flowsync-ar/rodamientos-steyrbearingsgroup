import { NextRequest, NextResponse } from 'next/server'
import { getAllClients } from '@/lib/clients/queries'

/**
 * GET /api/clients/search?q={query}
 * Used by the admin quote-creation flow to find a client by name or CUIT.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q) {
    return NextResponse.json({ clients: [] })
  }

  const rows = await getAllClients({ search: q, pageSize: 10 })

  return NextResponse.json({
    clients: rows.map((row) => ({
      id: row.id,
      name: row.razonSocial ?? row.fullName,
      cuit: row.cuit,
      bcraRiskLevel: row.bcraRiskLevel,
    })),
  })
}
