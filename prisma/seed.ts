import { db } from "../src/lib/db";

async function main() {
  await db.systemSetup.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
