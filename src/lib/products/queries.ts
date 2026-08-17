import { db } from '@/db'
import { products, categories } from '@/db/schema'
import { eq, ilike, and, or, asc, desc, sql } from 'drizzle-orm'

interface GetAllProductsOptions {
  categoryId?: string
  search?: string
  active?: boolean
  page?: number
  limit?: number
}

export async function getAllProducts(opts: GetAllProductsOptions = {}) {
  const { categoryId, search, active, page = 1, limit = 20 } = opts
  const offset = (page - 1) * limit

  const conditions = []
  if (categoryId) conditions.push(eq(products.categoryId, categoryId))
  if (search) {
    conditions.push(
      or(
        ilike(products.name, `%${search}%`),
        ilike(products.sku, `%${search}%`)
      )
    )
  }
  if (active !== undefined) conditions.push(eq(products.active, active))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        description: products.description,
        specs: products.specs,
        images: products.images,
        active: products.active,
        stock: products.stock,
        categoryId: products.categoryId,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(where)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(where),
  ])

  return {
    data: rows,
    total: countRows[0]?.count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((countRows[0]?.count ?? 0) / limit),
  }
}

/**
 * Admin-only variant of getAllProducts that also includes costPrice.
 * Never use this for public-facing pages — cost price must not leak
 * to the client-facing catalog.
 */
export async function getAllProductsAdmin(opts: GetAllProductsOptions = {}) {
  const { categoryId, search, active, page = 1, limit = 20 } = opts
  const offset = (page - 1) * limit

  const conditions = []
  if (categoryId) conditions.push(eq(products.categoryId, categoryId))
  if (search) {
    conditions.push(
      or(
        ilike(products.name, `%${search}%`),
        ilike(products.sku, `%${search}%`)
      )
    )
  }
  if (active !== undefined) conditions.push(eq(products.active, active))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        active: products.active,
        stock: products.stock,
        costPrice: products.costPrice,
        categoryId: products.categoryId,
        createdAt: products.createdAt,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(where)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(where),
  ])

  return {
    data: rows,
    total: countRows[0]?.count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((countRows[0]?.count ?? 0) / limit),
  }
}

export async function getProductById(id: string) {
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      description: products.description,
      specs: products.specs,
      images: products.images,
      active: products.active,
      costPrice: products.costPrice,
      stock: products.stock,
      categoryId: products.categoryId,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(products.id, id))
    .limit(1)

  return rows[0] ?? null
}

export async function getProductBySlug(slug: string) {
  // Products don't have a slug field in the current schema;
  // fall back to matching by SKU which is a unique identifier.
  // Public-facing — costPrice is intentionally excluded.
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      description: products.description,
      specs: products.specs,
      images: products.images,
      active: products.active,
      stock: products.stock,
      categoryId: products.categoryId,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .where(eq(products.sku, slug))
    .limit(1)

  return rows[0] ?? null
}

export async function getActiveProducts(limit = 20) {
  return db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      description: products.description,
      images: products.images,
      categoryId: products.categoryId,
      createdAt: products.createdAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(products.active, true))
    .orderBy(desc(products.createdAt))
    .limit(limit)
}
