import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function listCategories({ activeOnly }: { activeOnly: boolean }) {
  return db.category.findMany({
    where: activeOnly ? { active: true } : {},
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getCategoryById(id: string) {
  return db.category.findUnique({ where: { id } });
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

export async function getCategoryWithUsage(id: string) {
  const cat = await db.category.findUnique({ where: { id } });
  if (!cat) return null;
  const productCount = await db.product.count({ where: { categoryId: id } });
  return { ...cat, productCount };
}

export async function getProductsUsingAttributeKey(categoryId: string, attributeKey: string) {
  return db.product.findMany({
    where: {
      categoryId,
      attributes: { path: [attributeKey], not: Prisma.DbNull },
    },
    select: { id: true, sku: true, name: true },
  });
}
