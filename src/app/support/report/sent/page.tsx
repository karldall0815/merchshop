import Link from "next/link";

export default async function ReportSentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const id = typeof sp.id === "string" ? sp.id : null;
  return (
    <div className="space-y-4 text-center py-8">
      <div className="text-4xl">✓</div>
      <h2 className="text-xl font-semibold">Vielen Dank</h2>
      <p className="text-sm text-muted-foreground">
        Dein Fehlerbericht wurde an den Admin gesendet.
        {id && (
          <>
            {" "}Referenz-ID: <code className="bg-muted px-1.5 py-0.5 rounded">#{id.slice(0, 8)}</code>
          </>
        )}
      </p>
      <Link href="/" className="text-sm underline">Zur Startseite</Link>
    </div>
  );
}
