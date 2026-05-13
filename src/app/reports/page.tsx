import Link from "next/link";
import { getCurrentUser } from "@/modules/auth/session";
import { topProducts, ordersGrouped } from "@/modules/reporting/queries";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [top, byOccasion, byCostCenter] = await Promise.all([
    topProducts(user, undefined, 10),
    ordersGrouped(user, "occasion"),
    ordersGrouped(user, "costCenter"),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Reporting</h1>
        <p className="text-sm text-muted-foreground">
          {user.role === "requester"
            ? "Übersicht deiner eigenen Bestellungen."
            : "Übersicht aller Bestellungen."}
        </p>
        <div className="flex flex-wrap gap-3 pt-2 text-sm">
          <Link href="/api/reports/orders.csv" className="underline">
            Bestellungen als CSV
          </Link>
          <Link href="/api/reports/top-products.csv" className="underline">
            Top-Artikel als CSV
          </Link>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Top-Artikel</h2>
        {top.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Noch keine Bestelldaten.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">SKU</th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-right font-medium">Menge gesamt</th>
                  <th className="px-4 py-3 text-right font-medium">Bestell-Positionen</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {top.map((p) => (
                  <tr key={p.productId} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-right">{p.quantity}</td>
                    <td className="px-4 py-3 text-right">{p.orderLines}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <BreakdownCard title="Nach Anlass" rows={byOccasion} />
        <BreakdownCard title="Nach Kostenstelle" rows={byCostCenter} />
      </section>
    </div>
  );
}

function BreakdownCard({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; orders: number; items: number }[];
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">{title}</h2>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Noch keine Daten.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Wert</th>
                <th className="px-4 py-3 text-right font-medium">Bestellungen</th>
                <th className="px-4 py-3 text-right font-medium">Artikel</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.key} className="hover:bg-muted/30">
                  <td className="px-4 py-3">{r.key}</td>
                  <td className="px-4 py-3 text-right">{r.orders}</td>
                  <td className="px-4 py-3 text-right">{r.items}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
