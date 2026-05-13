import Link from "next/link";
import { listSupportReports } from "@/modules/support/queries";

export const dynamic = "force-dynamic";

function FilterChip({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link href={href} className={`rounded-full px-3 py-1 border ${active ? "bg-primary text-primary-foreground" : ""}`}>
      {label}
    </Link>
  );
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const status =
    sp.status === "open" || sp.status === "resolved" ? sp.status : undefined;
  const type = sp.type === "auto" || sp.type === "manual" ? sp.type : undefined;

  const reports = await listSupportReports({ status, type });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Support-Reports</h1>
      </div>

      <div className="flex flex-wrap gap-1 text-xs">
        <FilterChip label="Alle" active={!status} href="/admin/support" />
        <FilterChip label="Offen" active={status === "open"} href="/admin/support?status=open" />
        <FilterChip label="Erledigt" active={status === "resolved"} href="/admin/support?status=resolved" />
        <span className="mx-2 text-muted-foreground">|</span>
        <FilterChip label="Auto" active={type === "auto"} href={`/admin/support?type=auto${status ? "&status=" + status : ""}`} />
        <FilterChip label="Manuell" active={type === "manual"} href={`/admin/support?type=manual${status ? "&status=" + status : ""}`} />
      </div>

      <table className="w-full text-sm">
        <thead className="border-b text-left">
          <tr>
            <th className="py-2">ID</th>
            <th className="py-2">Typ</th>
            <th className="py-2">Reporter</th>
            <th className="py-2">URL</th>
            <th className="py-2">Status</th>
            <th className="py-2">Anz.</th>
            <th className="py-2">Zuletzt</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id} className="border-b hover:bg-muted/30">
              <td className="py-2 font-mono text-xs">
                <Link className="underline" href={`/admin/support/${r.id}`}>#{r.id.slice(0, 8)}</Link>
              </td>
              <td className="py-2">{r.type === "auto" ? "Auto" : "Manuell"}</td>
              <td className="py-2">{r.reporter?.name ?? "—"}</td>
              <td className="py-2 truncate max-w-[20ch] text-xs">{r.url ?? "—"}</td>
              <td className="py-2">{r.status}</td>
              <td className="py-2">{r.count}</td>
              <td className="py-2">{new Date(r.lastSeenAt).toLocaleString("de-DE")}</td>
            </tr>
          ))}
          {reports.length === 0 && (
            <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Keine Reports.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
