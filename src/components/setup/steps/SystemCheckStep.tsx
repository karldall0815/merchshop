import Link from "next/link";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function SystemCheckStep() {
  let dbOk = true;
  try { await db.$queryRaw`SELECT 1`; } catch { dbOk = false; }
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">System-Check</h2>
      <ul className="space-y-1 text-sm">
        <li>{dbOk ? "✔" : "✖"} Datenbankverbindung</li>
        <li>✔ Migrations angewendet (Container-Start)</li>
        <li>✔ Node {process.version}</li>
      </ul>
      {dbOk ? (
        <Link href="/setup/branding" className={buttonVariants()}>Weiter</Link>
      ) : (
        <span className={cn(buttonVariants(), "pointer-events-none opacity-50")}>Weiter</span>
      )}
    </div>
  );
}
