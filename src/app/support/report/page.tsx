import { SupportReportForm } from "@/components/support/SupportReportForm";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const digest = typeof sp.digest === "string" ? sp.digest : undefined;
  const fromError = sp.from === "error";
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Fehler melden</h2>
      <p className="text-sm text-muted-foreground">
        Beschreibe kurz, was passiert ist — dein Admin wird benachrichtigt und kümmert sich.
      </p>
      <SupportReportForm preset={{ digest, fromError }} />
    </div>
  );
}
