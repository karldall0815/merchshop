import { db } from "../src/lib/db";
import { BUILTIN_CATEGORIES } from "../src/modules/categories/defaults";

async function main() {
  await db.systemSetup.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  for (const def of BUILTIN_CATEGORIES) {
    await db.category.upsert({
      where: { slug: def.slug },
      create: {
        slug: def.slug,
        name: def.name,
        description: def.description,
        sortOrder: def.sortOrder,
        isBuiltin: true,
        active: true,
        attributeSchema: def.attributeSchema as object,
        variantTemplate: (def.variantTemplate as object | null) ?? undefined,
      },
      update: {
        name: def.name,
        description: def.description,
        sortOrder: def.sortOrder,
        attributeSchema: def.attributeSchema as object,
        variantTemplate: (def.variantTemplate as object | null) ?? undefined,
      },
    });
  }
  console.log(`Seeded ${BUILTIN_CATEGORIES.length} built-in categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
