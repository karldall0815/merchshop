import { db } from "@/lib/db";
import { availableStock, currentStock } from "@/modules/inventory/stock";

export async function listProductsWithStock() {
  const products = await db.product.findMany({
    where: { active: true },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, variants: true },
    orderBy: { name: "asc" },
  });
  return Promise.all(
    products.map(async (p) => ({
      ...p,
      current: await currentStock({ productId: p.id }),
    })),
  );
}

export async function getProductDetail(id: string) {
  const product = await db.product.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
  });
  if (!product) return null;
  const current = await currentStock({ productId: product.id });
  return { ...product, current };
}

// Shop-only variant: only active products, with the bookable count (hard
// stock minus reserved-by-open-orders). Variants get their own count so
// the shop UI can disable individual sizes when reserved out.
//
// `query` (optional) does a case-insensitive `contains` over name + sku
// — keeps the surface narrow enough that an index on Product.name would
// only marginally help (catalogues stay <500 rows in this domain).
//
// `extraWhere` is merged via AND so callers can layer category + attribute
// filters on top without re-implementing the search/active baseline.
export async function listShopProducts(
  query?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraWhere?: any,
) {
  const q = query?.trim();
  const baseWhere = q
    ? {
        active: true,
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { sku: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : { active: true };
  const where =
    extraWhere && Object.keys(extraWhere).length > 0
      ? { AND: [baseWhere, extraWhere] }
      : baseWhere;
  const products = await db.product.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      sku: true,
      name: true,
      description: true,
      images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
      variants: {
        where: { active: true },
        orderBy: { label: "asc" },
        select: { id: true, label: true },
      },
    },
  });
  return Promise.all(
    products.map(async (p) => ({
      ...p,
      available: await availableStock({ productId: p.id }),
    })),
  );
}

export async function getShopProduct(id: string) {
  const product = await db.product.findFirst({
    where: { id, active: true },
    select: {
      id: true,
      sku: true,
      name: true,
      description: true,
      attributes: true,
      category: {
        select: { id: true, slug: true, name: true, attributeSchema: true },
      },
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true } },
      variants: {
        where: { active: true },
        orderBy: { label: "asc" },
        select: { id: true, label: true },
      },
    },
  });
  if (!product) return null;
  const variants = await Promise.all(
    product.variants.map(async (v) => ({
      ...v,
      available: await availableStock({ productId: product.id, variantId: v.id }),
    })),
  );
  const available =
    product.variants.length === 0
      ? await availableStock({ productId: product.id })
      : variants.reduce((a, v) => a + v.available, 0);
  return { ...product, variants, available };
}
