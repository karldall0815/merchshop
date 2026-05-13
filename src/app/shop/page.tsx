import Link from "next/link";
import Image from "next/image";
import { listShopProducts } from "@/modules/catalog/queries";
import { listCategories } from "@/modules/categories/queries";
import { ShopSearchBox } from "@/components/shop/ShopSearchBox";
import { ShopViewToggle, type ShopView } from "@/components/shop/ShopViewToggle";
import { CategoryPills } from "@/components/shop/CategoryPills";
import { CustomFiltersSidebar } from "@/components/shop/CustomFiltersSidebar";
import { parseShopFilters, filtersToPrismaWhere } from "@/lib/shop-filters";
import type { AttributeSchemaItem } from "@/modules/categories/defaults";

export const dynamic = "force-dynamic";

type ProductCard = Awaited<ReturnType<typeof listShopProducts>>[number];

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const rawView = typeof params.view === "string" ? params.view : undefined;
  const view: ShopView = rawView === "list" ? "list" : "grid";

  // Re-encode params into a URLSearchParams so the helper can parse them
  // the same way it would on the client.
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) sp.append(key, v);
    } else {
      sp.set(key, value);
    }
  }

  const filters = parseShopFilters(sp);
  const categories = await listCategories({ activeOnly: true });

  // Filter sidebar is only shown when exactly one category is selected.
  let activeCategory: (typeof categories)[number] | null = null;
  let schema: AttributeSchemaItem[] = [];
  if (filters.categoryId) {
    activeCategory = categories.find((c) => c.id === filters.categoryId) ?? null;
    if (activeCategory) {
      schema = (activeCategory.attributeSchema as unknown as AttributeSchemaItem[]) ?? [];
    }
  }

  const where = filtersToPrismaWhere(filters, schema);
  const products = await listShopProducts(q, where);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Shop</h1>
        <ShopViewToggle current={view} />
      </header>
      <ShopSearchBox initial={q ?? ""} />
      <CategoryPills
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        activeId={filters.categoryId}
      />

      {activeCategory && schema.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[16rem_1fr]">
          <aside>
            <CustomFiltersSidebar schema={schema} />
          </aside>
          <div>
            {products.length === 0 ? (
              <EmptyState q={q} />
            ) : view === "grid" ? (
              <GridView products={products} />
            ) : (
              <ListView products={products} />
            )}
          </div>
        </div>
      ) : products.length === 0 ? (
        <EmptyState q={q} />
      ) : view === "grid" ? (
        <GridView products={products} />
      ) : (
        <ListView products={products} />
      )}
    </div>
  );
}

function EmptyState({ q }: { q?: string }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
      {q ? `Keine Treffer für „${q}"` : "Keine Artikel verfügbar."}
    </div>
  );
}

function GridView({ products }: { products: ProductCard[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => {
        const thumb = p.images[0]?.url;
        const soldOut = p.available <= 0;
        return (
          <li key={p.id} className="rounded-lg border bg-card p-4 space-y-3">
            <Link href={`/shop/${p.id}`} className="block space-y-3">
              <div className="aspect-square w-full overflow-hidden rounded bg-muted">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={p.name}
                    width={400}
                    height={400}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    kein Bild
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium">{p.name}</h3>
                <p className="text-xs text-muted-foreground">{p.sku}</p>
              </div>
              {p.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
              )}
            </Link>
            <div className="flex items-center justify-between text-sm">
              <span className={soldOut ? "text-red-600" : "text-muted-foreground"}>
                {soldOut ? "Ausverkauft" : `${p.available} verfügbar`}
              </span>
              {p.variants.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {p.variants.length} {p.variants.length === 1 ? "Variante" : "Varianten"}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ListView({ products }: { products: ProductCard[] }) {
  return (
    <ul className="divide-y rounded-lg border bg-card">
      {products.map((p) => {
        const thumb = p.images[0]?.url;
        const soldOut = p.available <= 0;
        return (
          <li key={p.id}>
            <Link
              href={`/shop/${p.id}`}
              className="flex items-center gap-4 p-3 transition hover:bg-muted/40"
            >
              <div className="h-12 w-12 flex-none overflow-hidden rounded bg-muted">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={p.name}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                    —
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.sku}
                  {p.description ? ` · ${p.description}` : ""}
                </p>
              </div>
              {p.variants.length > 0 && (
                <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:inline">
                  {p.variants.length} {p.variants.length === 1 ? "Variante" : "Varianten"}
                </span>
              )}
              <span
                className={`whitespace-nowrap text-sm ${
                  soldOut ? "text-red-600" : "text-muted-foreground"
                }`}
              >
                {soldOut ? "Ausverkauft" : `${p.available} verfügbar`}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
