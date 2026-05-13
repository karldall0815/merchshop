import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupportReport } from "@/modules/support/queries";
import { resolveSupportReport } from "@/modules/support/actions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminSupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getSupportReport(id);
  if (!report) notFound();

  async function markResolved() {
    "use server";
    await resolveSupportReport({ id });
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/admin/support" className="text-sm underline">← zurück zur Liste</Link>
        {report.status !== "resolved" && (
          <form action={markResolved}>
            <Button type="submit">Erledigt</Button>
          </form>
        )}
      </div>

      <div className="rounded border p-4 space-y-2">
        <h2 className="text-lg font-semibold">
          Report #{report.id.slice(0, 8)} <span className="ml-2 text-sm font-normal text-muted-foreground">({report.type})</span>
        </h2>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Status</dt><dd>{report.status}</dd>
          <dt className="text-muted-foreground">Reporter</dt><dd>{report.reporter?.name ?? "—"} ({report.reporter?.email ?? "ohne Login"})</dd>
          <dt className="text-muted-foreground">URL</dt><dd className="font-mono text-xs">{report.url ?? "—"}</dd>
          <dt className="text-muted-foreground">User-Agent</dt><dd className="text-xs">{report.userAgent ?? "—"}</dd>
          <dt className="text-muted-foreground">Erstmals</dt><dd>{new Date(report.firstSeenAt).toLocaleString("de-DE")}</dd>
          <dt className="text-muted-foreground">Zuletzt</dt><dd>{new Date(report.lastSeenAt).toLocaleString("de-DE")}</dd>
          <dt className="text-muted-foreground">Anzahl</dt><dd>{report.count}×</dd>
          {report.errorDigest && (<><dt className="text-muted-foreground">Digest</dt><dd className="font-mono text-xs">{report.errorDigest}</dd></>)}
          {report.resolvedBy && (
            <>
              <dt className="text-muted-foreground">Erledigt durch</dt>
              <dd>{report.resolvedBy.name} ({report.resolvedAt ? new Date(report.resolvedAt).toLocaleString("de-DE") : "—"})</dd>
            </>
          )}
        </dl>
      </div>

      {report.userMessage && (
        <div className="rounded border p-4">
          <h3 className="font-semibold mb-2">Beschreibung des Users</h3>
          <p className="text-sm whitespace-pre-line">{report.userMessage}</p>
        </div>
      )}

      {report.errorMessage && (
        <div className="rounded border p-4">
          <h3 className="font-semibold mb-2">Fehler-Nachricht</h3>
          <pre className="text-xs whitespace-pre-wrap bg-muted p-2 rounded">{report.errorMessage}</pre>
        </div>
      )}

      {report.errorStack && (
        <details className="rounded border p-4">
          <summary className="font-semibold cursor-pointer">Stack-Trace</summary>
          <pre className="text-xs whitespace-pre-wrap bg-muted p-2 rounded mt-2 max-h-[24rem] overflow-auto">{report.errorStack}</pre>
        </details>
      )}
    </div>
  );
}
