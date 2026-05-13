import Link from "next/link";
import { distinctAuditEntities, listAudit } from "@/modules/admin/audit";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const [entries, entities] = await Promise.all([
    listAudit({ entity: sp.entity, q: sp.q, limit: 300 }),
    distinctAuditEntities(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Audit-Log</h1>
        <p className="text-sm text-muted-foreground">
          Append-only Aufzeichnung aller Domain-Aktionen. Letzte 300 Treffer.
        </p>
      </header>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
        <div className="space-y-1">
          <label htmlFor="entity" className="text-xs font-medium text-muted-foreground">
            Entity
          </label>
          <select
            name="entity"
            defaultValue={sp.entity ?? ""}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">— alle —</option>
            {entities.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
            Suche (entityId / action)
          </label>
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            className="rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="z. B. MS-2026"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Filtern
        </button>
        {(sp.entity || sp.q) && (
          <Link href="/admin/audit" className="text-sm underline">
            zurücksetzen
          </Link>
        )}
      </form>

      <section className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Zeit</th>
              <th className="px-4 py-3 text-left font-medium">Actor</th>
              <th className="px-4 py-3 text-left font-medium">Entity</th>
              <th className="px-4 py-3 text-left font-medium">ID</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
              <th className="px-4 py-3 text-left font-medium">Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Keine Einträge.
                </td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="align-top">
                <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString("de-DE")}
                </td>
                <td className="px-4 py-3 text-xs">
                  {e.actor ? (
                    <>
                      {e.actor.name}
                      <span className="text-muted-foreground"> · {e.actor.role}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">system</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{e.entity}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {e.entityId ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs font-medium">{e.action}</td>
                <td className="px-4 py-3">
                  {e.diff && Object.keys(e.diff as object).length > 0 ? (
                    <details>
                      <summary className="cursor-pointer text-xs underline">
                        anzeigen
                      </summary>
                      <pre className="mt-2 overflow-x-auto rounded bg-muted/40 p-2 text-xs">
                        {JSON.stringify(e.diff, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
