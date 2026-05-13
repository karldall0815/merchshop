import { PrismaClient } from "@prisma/client";
import { BUILTIN_CATEGORIES } from "./seed-data/categories";

const db = new PrismaClient();

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

  const SUPPORT_SETTINGS: { key: string; value: string }[] = [
    { key: "support.errorAutoReport",          value: "true" },
    { key: "support.errorReportDedupeMinutes", value: "5" },
    { key: "support.notifyAdminsByMail",       value: "true" },
  ];
  for (const s of SUPPORT_SETTINGS) {
    await db.setting.upsert({
      where: { key: s.key },
      create: { key: s.key, value: s.value, encrypted: false },
      update: {},   // do not overwrite existing user-set values
    });
  }
  console.log(`Seeded ${SUPPORT_SETTINGS.length} support default settings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
