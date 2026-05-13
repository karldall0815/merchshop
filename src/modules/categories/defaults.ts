// The actual definitions live in `prisma/seed-data/categories.ts` so the seed
// script can use them without importing anything from `src/` (the production
// Docker image doesn't ship `src/`). This module just re-exports them so the
// rest of the codebase keeps the familiar `@/modules/categories/defaults`
// import path.
export type {
  AttributeType,
  AttributeOption,
  AttributeSchemaItem,
  VariantTemplate,
  BuiltinCategoryDef,
} from "../../../prisma/seed-data/categories";

export { BUILTIN_CATEGORIES } from "../../../prisma/seed-data/categories";
