import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { isInstalled } from "@/modules/setup/state-machine";
import { dashboardStats } from "@/modules/dashboard/queries";
import { StatusBadge } from "@/components/orders/StatusBadge";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!(await isInstalled())) redirect("/setup");
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stats = await dashboardStats(user);
  const isApprover = user.role === "approver" || user.role === "admin";
  const isFulfiller = user.role === "agentur" || user.role === "admin";

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Willkommen, {user.name}</h1>
        <p className="text-sm text-muted-foreground">
          Rolle: <span className="font-mono">{user.role}</span>
        </p>
      </header>

      {/* Quick stats — relevant tiles per role */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          href="/cart"
          label="Im Warenkorb"
          value={stats.myDraftItems}
          hint="Artikel"
          tone="default"
        />
        <Tile
          href="/orders"
          label="Eigene offene Bestellungen"
          value={stats.myOpenOrders}
          hint="aktiv"
          tone="default"
        />
        {isApprover && (
          <Tile
            href="/approvals"
            label="Freigaben offen"
            value={stats.pendingApprovals}
            hint="warten"
            tone={stats.pendingApprovals > 0 ? "amber" : "default"}
          />
        )}
        {isFulfiller && (
          <Tile
            href="/fulfillment"
            label="Fulfillment offen"
            value={stats.fulfillmentApproved + stats.fulfillmentProcessing}
            hint={`${stats.fulfillmentShipped} versendet`}
            tone={
              stats.fulfillmentApproved + stats.fulfillmentProcessing > 0 ? "indigo" : "default"
            }
          />
        )}
      </section>

      {/* Mein letzten Bestellungen */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Meine letzten Bestellungen</h2>
          <Link href="/orders" className="text-sm underline">
            alle ansehen →
          </Link>
        </div>
        {stats.myRecentOrders.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Noch keine Bestellungen.{" "}
            <Link href="/shop" className="underline">
              Zum Shop
            </Link>
            .
          </div>
        ) : (
          <ul className="space-y-2">
            {stats.myRecentOrders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-muted/40"
                >
                  <div>
                    <p className="font-medium">{o.orderNumber ?? "(ohne Nummer)"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString("de-DE")}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isFulfiller && stats.lowStock.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Bestand niedrig</h2>
          <ul className="space-y-2">
            {stats.lowStock.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-sm dark:border-amber-900/40 dark:bg-amber-900/10"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sku}</p>
                </div>
                <span className="text-sm">
                  <span className="font-medium">{p.current}</span> / {p.minStock}{" "}
                  Mindestbestand
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quick links by role */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Schnellzugriff</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <QuickLink href="/shop" title="Shop" description="Artikel ansehen + bestellen" />
          <QuickLink href="/orders" title="Bestellungen" description="Eigene Historie" />
          {isApprover && (
            <QuickLink
              href="/approvals"
              title="Freigaben"
              description="Bestellungen genehmigen"
            />
          )}
          {isFulfiller && (
            <>
              <QuickLink
                href="/fulfillment"
                title="Fulfillment"
                description="Versand vorbereiten"
              />
              <QuickLink
                href="/catalog"
                title="Artikelverwaltung"
                description="CRUD + Bilder"
              />
              <QuickLink href="/inventory" title="Bestand" description="Korrekturen + Verlauf" />
            </>
          )}
          <QuickLink href="/reports" title="Reports" description="Dashboards + CSV-Export" />
        </div>
      </section>
    </main>
  );
}

type Tone = "default" | "amber" | "indigo";

function Tile({
  href,
  label,
  value,
  hint,
  tone,
}: {
  href: string;
  label: string;
  value: number | string;
  hint?: string;
  tone: Tone;
}) {
  const toneClasses: Record<Tone, string> = {
    default: "bg-card",
    amber:
      "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/40",
    indigo:
      "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-900/40",
  };
  return (
    <Link
      href={href}
      className={`block rounded-lg border p-4 transition hover:shadow ${toneClasses[tone]}`}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Link>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border bg-card p-4 transition hover:bg-muted/40"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}
