import { NextRequest, NextResponse } from 'next/server'
import { getAllProducts } from '@/lib/products/queries'

/**
 * GET /api/products/search?q={query}
 * Used by the admin quote-creation flow to find a product by name or SKU.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q) {
    return NextResponse.json({ products: [] })
  }

  const result = await getAllProducts({ search: q, active: true, limit: 10 })

  return NextResponse.json({
    products: result.data.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
    })),
  })
}
