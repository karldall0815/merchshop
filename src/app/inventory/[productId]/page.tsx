import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProductDetail } from "@/modules/catalog/queries";
import { StockBadge } from "@/components/inventory/StockBadge";
import { MovementRow } from "@/components/inventory/MovementRow";
import { CorrectionDialog } from "@/components/inventory/CorrectionDialog";

export const dynamic = "force-dynamic";

export default async function InventoryDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = await getProductDetail(productId);
  if (!product) notFound();

  const movements = await db.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { variant: true },
  });

  const actorIds = [...new Set(movements.map(m => m.actorId).filter(Boolean))] as string[];
  const actors = actorIds.length > 0
    ? await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } })
    : [];
  const actorMap = new Map(actors.map(a => [a.id, a.name]));

  const variants = product.variants
    .filter(v => v.active)
    .map(v => ({ id: v.id, label: v.label }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground">{product.sku}</p>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span>Bestand: <strong className="text-foreground">{product.current}</strong></span>
            <span>Mindestbestand: <strong className="text-foreground">{product.minStock}</strong></span>
            <StockBadge current={product.current} minStock={product.minStock} />
          </div>
        </div>
        <CorrectionDialog productId={product.id} variants={variants} />
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">Bewegungsverlauf</h2>
        {movements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Bewegungen vorhanden.</p>
        ) : (
          <ul className="rounded-lg border">
            <li className="grid grid-cols-[120px_80px_1fr_180px] gap-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium uppercase text-muted-foreground">
              <span>Datum</span>
              <span>Delta</span>
              <span>Grund</span>
              <span>Benutzer</span>
            </li>
            {movements.map(m => (
              <MovementRow
                key={m.id}
                delta={m.delta}
                reason={m.reason}
                comment={m.comment}
                variantLabel={m.variant?.label ?? null}
                actorName={m.actorId ? (actorMap.get(m.actorId) ?? null) : null}
                createdAt={m.createdAt}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
